
import { GoogleGenerativeAI } from "@google/generative-ai";
import { chunkText, selectChunks } from "../utils/chunkText.js";
import ApiError from "../utils/ApiError.js";

const JSON_RULE = "Return ONLY valid JSON, no markdown, no backticks.";
const MAX_CHUNKS = 5;

const modelCache = new Map();

function getGenerativeModel(modelName) {
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(500, "GEMINI_API_KEY is not configured on the server");
  }

  if (!modelCache.has(modelName)) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    modelCache.set(
      modelName,
      genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      })
    );
  }

  return modelCache.get(modelName);
}

function getCandidateModels() {
  const primary = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const candidates = [
    primary,
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
  ];
  return [...new Set(candidates.filter(Boolean))];
}

export function parseJSON(raw) {
  const text = String(raw)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    const start = text.search(/[[{]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));

    if (start === -1 || end <= start) {
      throw new Error("No JSON found in AI reply");
    }

    return JSON.parse(text.slice(start, end + 1));
  }
}

async function askJSON(prompt, validate) {
  const candidateModels = getCandidateModels();
  let lastError;

  for (const modelName of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const extra =
          attempt === 2
            ? `\n\nYour previous reply was invalid. Follow the JSON schema exactly. ${JSON_RULE}`
            : "";

        const result = await getGenerativeModel(modelName).generateContent(prompt + extra);
        const data = parseJSON(result.response.text());

        return validate(data);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        lastError = err;

        // If quota exceeded or 429, break to try the next model immediately
        if (
          err?.status === 429 ||
          err?.message?.includes("429") ||
          err?.message?.includes("Quota exceeded")
        ) {
          console.warn(`[AI Service] Model ${modelName} hit quota limit, trying next candidate...`);
          break;
        }
      }
    }
  }

  console.error("AI failure details:", lastError);

  if (
    lastError?.status === 429 ||
    lastError?.message?.includes("429") ||
    lastError?.message?.includes("Quota exceeded")
  ) {
    throw new ApiError(
      429,
      "AI quota reached across all available models. Please wait for quota reset or update your Gemini API key."
    );
  }

  throw new ApiError(
    502,
    lastError?.message || "AI request failed. Please try again."
  );
}

const material = (text) => `STUDY MATERIAL:\n"""\n${text}\n"""`;

/* SUMMARY */

const summaryPrompt = (text, note = "") => `
You are an expert academic tutor.
Summarize the supplied study material with high clarity, structured by topics or chapters.
For every topic or chapter, provide clear explanations accompanied by concrete, illustrative examples.
Do not invent facts or add information that is not supported by the material.

${JSON_RULE}

Schema:
{
  "summary": "Comprehensive topic-by-topic summary with clear explanations and real-world or illustrative examples for each topic.",
  "keyPoints": [
    "Topic: Core takeaway and example",
    "Topic: Core takeaway and example"
  ]
}

For short material, provide a proportionally concise summary with clear examples and key points.
${note}

${material(text)}
`;

function validateSummary(data) {
  if (
    typeof data?.summary !== "string" ||
    !data.summary.trim()
  ) {
    throw new Error("Bad summary");
  }

  if (!Array.isArray(data.keyPoints)) {
    throw new Error("Bad keyPoints");
  }

  return {
    summary: data.summary.trim(),
    keyPoints: data.keyPoints
      .filter((k) => typeof k === "string" && k.trim())
      .slice(0, 12),
  };
}

export async function generateSummary(text) {
  const chunks = selectChunks(chunkText(text), 8);

  if (chunks.length === 1) {
    return askJSON(summaryPrompt(chunks[0]), validateSummary);
  }

  const partials = [];

  for (const chunk of chunks) {
    partials.push(
      await askJSON(summaryPrompt(chunk), validateSummary)
    );
  }

  const merged = partials
    .map(
      (p, i) =>
        `Part ${i + 1}: ${p.summary}\nPoints: ${p.keyPoints.join("; ")}`
    )
    .join("\n\n");

  return askJSON(
    summaryPrompt(
      merged,
      "Merge these partial summaries into ONE cohesive, structured chapter/topic summary with examples."
    ),
    validateSummary
  );
}

/* FLASHCARDS */

const flashcardPrompt = (text, n) => `
You are a study assistant.
Create exactly ${n} useful flashcards from the supplied material.

Each card must test one important concept.
Keep answers concise, direct, and under 50 characters where possible for fast learning.
Do not invent facts.

${JSON_RULE}

Schema:
{
  "flashcards": [
    {
      "question": "Question",
      "answer": "Concise answer (under 50 chars where possible)",
      "difficulty": "easy|medium|hard"
    }
  ]
}

${material(text)}
`;

function validateCards(data) {
  const cards = (data?.flashcards || [])
    .filter(
      (c) =>
        typeof c?.question === "string" &&
        typeof c?.answer === "string" &&
        c.question.trim() &&
        c.answer.trim()
    )
    .map((c) => ({
      question: c.question.trim(),
      answer: c.answer.trim(),
      difficulty: ["easy", "medium", "hard"].includes(c.difficulty)
        ? c.difficulty
        : "medium",
    }));

  if (!cards.length) {
    throw new Error("No valid flashcards");
  }

  return cards;
}

export async function generateFlashcards(text, total = 10) {
  const chunks = selectChunks(chunkText(text), MAX_CHUNKS);

  if (!chunks.length) {
    throw new ApiError(400, "Not enough study material to generate flashcards.");
  }

  const perChunk = Math.ceil(total / chunks.length);
  const cards = [];

  for (const chunk of chunks) {
    cards.push(
      ...(await askJSON(
        flashcardPrompt(chunk, perChunk),
        validateCards
      ))
    );
  }

  if (cards.length < total) {
    throw new ApiError(
      502,
      "AI generated fewer flashcards than requested. Please try again."
    );
  }

  return cards.slice(0, total);
}

/* QUIZ GENERATION */

function quizPrompt(text, count, type) {
  let instructions = "";

  if (type === "mcq") {
    instructions = `
Create exactly ${count} multiple-choice questions.
Every question must have exactly 4 options and one correct answer.

Question type must be "mcq".

Schema:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation",
      "topic": "Topic"
    }
  ]
}`;
  } else if (type === "short") {
    instructions = `
Create exactly ${count} short-answer questions.
Answers should be concise and accurate, usually 1 to 3 sentences.
Do not include MCQ options.

Question type must be "short".

Schema:
{
  "questions": [
    {
      "type": "short",
      "question": "Question",
      "correctAnswer": "Short answer",
      "explanation": "Additional explanation",
      "topic": "Topic"
    }
  ]
}`;
  } else if (type === "long") {
    instructions = `
Create exactly ${count} long-answer questions.
Answers should be detailed, well-structured and suitable for exam preparation.
Do not include MCQ options.

Question type must be "long".

Schema:
{
  "questions": [
    {
      "type": "long",
      "question": "Question",
      "correctAnswer": "Detailed model answer",
      "explanation": "Important marking points",
      "topic": "Topic"
    }
  ]
}`;
  } else {
    instructions = `
Create exactly ${count} questions in a mixed format.
Include a balanced combination of MCQ, short-answer and long-answer questions.
For small counts, distribute the available questions as evenly as possible.
Every question must have its own type.

For MCQs, provide exactly 4 options and a correctIndex.
For short and long questions, provide correctAnswer and no options.

Schema:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Question",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Explanation",
      "topic": "Topic"
    },
    {
      "type": "short",
      "question": "Question",
      "correctAnswer": "Short answer",
      "explanation": "Explanation",
      "topic": "Topic"
    },
    {
      "type": "long",
      "question": "Question",
      "correctAnswer": "Detailed answer",
      "explanation": "Explanation",
      "topic": "Topic"
    }
  ]
}`;
  }

  return `
You are an expert educational quiz generator.
Create questions using ONLY the supplied study material.
Do not invent facts or use unrelated knowledge.
Avoid duplicate questions.

${instructions}

${JSON_RULE}

${material(text)}
`;
}

function validateQuiz(data) {
  const questions = (data?.questions || [])
    .filter((q) => {
      if (
        typeof q?.question !== "string" ||
        !q.question.trim()
      ) {
        return false;
      }

      const type = q.type || "mcq";

      if (type === "mcq") {
        return (
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.every(
            (o) => typeof o === "string" && o.trim()
          ) &&
          Number.isInteger(q.correctIndex) &&
          q.correctIndex >= 0 &&
          q.correctIndex < 4
        );
      }

      if (type === "short" || type === "long") {
        return (
          typeof q.correctAnswer === "string" &&
          q.correctAnswer.trim().length > 0
        );
      }

      return false;
    })
    .map((q) => {
      const type = q.type || "mcq";

      const common = {
        type,
        question: q.question.trim(),
        correctAnswer:
          type === "mcq"
            ? q.options[q.correctIndex].trim()
            : q.correctAnswer.trim(),
        explanation:
          typeof q.explanation === "string"
            ? q.explanation.trim()
            : "",
        topic:
          typeof q.topic === "string" && q.topic.trim()
            ? q.topic.trim()
            : "General",
      };

      if (type === "mcq") {
        return {
          ...common,
          options: q.options.map((o) => o.trim()),
        };
      }

      return common;
    });

  if (!questions.length) {
    throw new Error("No valid questions");
  }

  return questions;
}

export async function generateQuiz(text, total = 10, type = "mcq") {
  const allowedTypes = ["mcq", "short", "long", "mixed"];

  if (!allowedTypes.includes(type)) {
    throw new ApiError(400, "Invalid quiz type.");
  }

  if (!Number.isInteger(total) || total < 1 || total > 50) {
    throw new ApiError(400, "Question count must be between 1 and 50.");
  }

  const chunks = selectChunks(chunkText(text), MAX_CHUNKS);

  if (!chunks.length) {
    throw new ApiError(400, "Not enough study material to generate a quiz.");
  }

  const perChunk = Math.ceil(total / chunks.length);
  const questions = [];

  for (const chunk of chunks) {
    questions.push(
      ...(await askJSON(
        quizPrompt(chunk, perChunk, type),
        validateQuiz
      ))
    );
  }

  if (questions.length < total) {
    throw new ApiError(
      502,
      "AI generated fewer questions than requested. Please try again."
    );
  }

  return questions.slice(0, total);
}

/* WRITTEN ANSWER EVALUATION */

export async function evaluateWrittenAnswers(items) {
  if (!Array.isArray(items) || !items.length) {
    return [];
  }

  const prompt = `
You are a fair and helpful exam evaluator.

Evaluate each student's written answer against the supplied model answer.
Use only the supplied question and model answer as the marking reference.
Accept equivalent wording and correct explanations.
Do not require exact wording.

Marking:
- Give a score from 0 to 1.
- 0 means completely incorrect or unanswered.
- 0.5 means partially correct.
- 1 means fully correct.
- Consider the question type: short or long.
- For long answers, consider coverage of important points.
- Do not give full marks for an answer that misses essential information.
- Provide constructive feedback in simple language.

Evaluate every item independently.
Keep the same order and include the original index.

${JSON_RULE}

Schema:
{
  "evaluations": [
    {
      "index": 0,
      "marks": 0.75,
      "feedback": "Your answer is mostly correct, but..."
    }
  ]
}

ANSWERS TO EVALUATE:
${JSON.stringify(items)}
`;

  return askJSON(prompt, (data) => {
    if (
      !Array.isArray(data?.evaluations) ||
      data.evaluations.length !== items.length
    ) {
      throw new Error("Invalid written answer evaluation");
    }

    return data.evaluations.map((evaluation, index) => {
      const marks = Number(evaluation.marks);

      if (!Number.isFinite(marks)) {
        throw new Error("Invalid evaluation marks");
      }

      return {
        index: items[index].index,
        marks: Math.max(0, Math.min(1, marks)),
        feedback:
          typeof evaluation.feedback === "string"
            ? evaluation.feedback.trim()
            : "Review the model answer.",
      };
    });
  });
}

/* CUSTOM AI COMMAND / QUESTION RUNNER */

async function askDirectText(prompt) {
  const candidateModels = getCandidateModels();
  let lastError;

  for (const modelName of candidateModels) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const m = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.5 },
      });

      const result = await m.generateContent(prompt);
      const text = result.response.text()?.trim();
      if (text) return text;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      lastError = err;
      if (
        err?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.includes("Quota exceeded")
      ) {
        console.warn(`[AI Service] Model ${modelName} hit quota limit, trying fallback...`);
      }
    }
  }

  console.error("AI failure details:", lastError);
  if (
    lastError?.status === 429 ||
    lastError?.message?.includes("429") ||
    lastError?.message?.includes("Quota exceeded")
  ) {
    throw new ApiError(429, "AI quota reached. Please try again later.");
  }
  throw new ApiError(502, lastError?.message || "AI request failed.");
}

export async function runCustomCommand(text, command) {
  const chunks = selectChunks(chunkText(text), 4);
  const context = chunks.join("\n\n---\n\n");

  // Detect if this is a general question (not about the notes)
  const isGeneralQuestion =
    command.trim().length < 300 &&
    !/\b(note|notes|material|chapter|topic|above|this text|study|summarize|summary|flashcard|quiz)\b/i.test(command);

  const plainTextRules = `
FORMATTING RULES (follow strictly):
- Write in plain, simple, easy-to-read text only.
- Do NOT use LaTeX math notation like $$ or dollar signs for math.
- Do NOT use markdown symbols like ## headings or **bold** — they will show as raw symbols.
- Write math equations in plain text. Example: CO2 + H2O + Light = Glucose + O2
- Use simple numbered lists (1. 2. 3.) or hyphens (-) for bullet points.
- Keep the tone friendly, clear, and easy to understand for a student.
`;

  const prompt = isGeneralQuestion
    ? `You are a friendly, knowledgeable tutor helping a student with their question.
The student asked: "${command}"
${plainTextRules}
Answer the student's question directly and clearly in simple plain text. Do not refer to any study notes.`
    : `You are an expert educational study assistant helping a student review their notes.
The student's request: "${command}"
${plainTextRules}
Use the study material below as your primary reference. If the material does not cover everything, use your general academic knowledge.

STUDY MATERIAL:
${context}`;

  return askDirectText(prompt);
}

