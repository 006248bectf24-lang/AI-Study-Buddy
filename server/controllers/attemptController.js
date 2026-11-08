
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as ai from "../services/aiService.js";

// Build detailed result for the user
function buildResult(attempt, quiz) {
  return {
    _id: attempt._id,
    quizId: attempt.quizId,
    noteId: quiz.noteId,
    score: attempt.score,
    total: attempt.total,
    percent: attempt.total
      ? Math.round((attempt.score / attempt.total) * 100)
      : 0,
    createdAt: attempt.createdAt,
    review: attempt.questionResults || [],
  };
}

// POST /api/attempts
export const submitAttempt = asyncHandler(async (req, res) => {
  const { quizId, answers } = req.body;

  const quiz = await Quiz.findOne({
    _id: quizId,
    userId: req.user._id,
  });

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  if (
    !Array.isArray(answers) ||
    answers.length !== quiz.questions.length
  ) {
    throw new ApiError(
      400,
      "Number of answers does not match number of questions."
    );
  }

  let score = 0;
  const wrongTopics = [];
  const questionResults = [];
  const writtenQuestions = [];

  // Check MCQs automatically and collect written questions
  quiz.questions.forEach((q, index) => {
    const type = q.type || "mcq";
    const answer = answers[index];

    if (type === "mcq") {
      const selectedIndex =
        Number.isInteger(answer) ? answer : -1;

      const isCorrect =
        selectedIndex >= 0 &&
        selectedIndex < 4 &&
        q.options?.[selectedIndex] === q.correctAnswer;

      if (isCorrect) {
        score += 1;
      } else {
        wrongTopics.push(q.topic || "General");
      }

      questionResults[index] = {
        type,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        topic: q.topic || "General",
        selectedAnswer:
          selectedIndex >= 0 && selectedIndex < 4
            ? q.options[selectedIndex]
            : "Not answered",
        selectedIndex,
        isCorrect,
        marks: isCorrect ? 1 : 0,
        feedback: isCorrect
          ? "Correct answer!"
          : "Review the correct answer and explanation.",
      };
    } else {
      writtenQuestions.push({
        index,
        type,
        question: q.question,
        correctAnswer: q.correctAnswer,
        studentAnswer:
          typeof answer === "string" ? answer.trim() : "",
        topic: q.topic || "General",
      });
    }
  });

  // Evaluate short and long answers through AI
  if (writtenQuestions.length > 0) {
    const evaluations = await ai.evaluateWrittenAnswers(
      writtenQuestions
    );

    if (
      !Array.isArray(evaluations) ||
      evaluations.length !== writtenQuestions.length
    ) {
      throw new ApiError(
        502,
        "AI could not evaluate written answers. Please try again."
      );
    }

    writtenQuestions.forEach((item, i) => {
      const evaluation = evaluations[i];

      const marks = Math.max(
        0,
        Math.min(1, Number(evaluation.marks) || 0)
      );

      score += marks;

      if (marks < 0.5) {
        wrongTopics.push(item.topic);
      }

      questionResults[item.index] = {
        type: item.type,
        question: item.question,
        correctAnswer: item.correctAnswer,
        selectedAnswer: item.studentAnswer || "Not answered",
        topic: item.topic,
        marks,
        isCorrect: marks >= 0.5,
        feedback: evaluation.feedback || "",
      };
    });
  }

  const attempt = await QuizAttempt.create({
    quizId: quiz._id,
    userId: req.user._id,
    score,
    total: quiz.questions.length,
    wrongTopics,
    answers,
    questionResults,
  });

  res.status(201).json({
    result: buildResult(attempt, quiz),
  });
});

// GET /api/attempts/:id
export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!attempt) {
    throw new ApiError(404, "Result not found");
  }

  const quiz = await Quiz.findById(attempt.quizId);

  if (!quiz) {
    throw new ApiError(
      404,
      "The quiz for this result no longer exists."
    );
  }

  // Support older attempts that do not have saved question results
  if (!attempt.questionResults?.length) {
    const review = quiz.questions.map((q, index) => {
      const selectedIndex = attempt.answers[index] ?? -1;
      const isCorrect =
        (q.type || "mcq") === "mcq" &&
        selectedIndex >= 0 &&
        q.options?.[selectedIndex] === q.correctAnswer;

      return {
        type: q.type || "mcq",
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        topic: q.topic || "General",
        selectedIndex,
        selectedAnswer:
          selectedIndex >= 0 && q.options?.[selectedIndex]
            ? q.options[selectedIndex]
            : "Not answered",
        isCorrect,
        marks: isCorrect ? 1 : 0,
        feedback: "",
      };
    });

    return res.json({
      result: {
        ...buildResult(attempt, quiz),
        review,
      },
    });
  }

  res.json({
    result: buildResult(attempt, quiz),
  });
});

// GET /api/attempts?quizId=...
export const getAttempts = asyncHandler(async (req, res) => {
  const filter = {
    userId: req.user._id,
  };

  if (req.query.quizId) {
    filter.quizId = req.query.quizId;
  }

  const attempts = await QuizAttempt.find(filter).sort({
    createdAt: -1,
  });

  res.json({ attempts });
});
