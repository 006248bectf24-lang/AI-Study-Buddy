
import Note from "../models/Note.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import findOwnedNote from "../utils/findOwnedNote.js";
import { extractPdfText } from "../services/pdfService.js";
import * as ai from "../services/aiService.js";

const MAX_TEXT_CHARS = 200000;

// POST /api/notes
export const createNote = asyncHandler(async (req, res) => {
  let text = (req.body.text || "").trim();

  if (req.file) {
    text = (await extractPdfText(req.file.buffer)).trim();
  }

  // Only empty text is rejected. Short text is now allowed.
  if (!text) {
    throw new ApiError(400, "Please enter some text or upload a PDF containing text.");
  }

  text = text.slice(0, MAX_TEXT_CHARS);

  const note = await Note.create({
    userId: req.user._id,
    title: req.body.title,
    extractedText: text,
  });

  let warning;

  try {
    const { summary, keyPoints } = await ai.generateSummary(text);

    note.summary = summary;
    note.keyPoints = keyPoints;

    await note.save();
  } catch (err) {
    console.error("Summary generation failed:", err);

    warning = "Note saved, but the summary could not be generated. You can try again.";
  }

  res.status(201).json({ note, warning });
});

// GET /api/notes
export const getNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  res.json({ notes });
});

// GET /api/notes/:id
export const getNote = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.id, req.user._id);

  res.json({ note });
});

// POST /api/notes/:id/summary
export const regenerateSummary = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.id, req.user._id, true);

  const { summary, keyPoints } = await ai.generateSummary(
    note.extractedText
  );

  note.summary = summary;
  note.keyPoints = keyPoints;

  await note.save();

  res.json({ note });
});

// POST /api/notes/:id/ask
export const askNoteAI = asyncHandler(async (req, res) => {
  const { command } = req.body;
  if (!command || !String(command).trim()) {
    throw new ApiError(400, "Please provide a command or question for the AI.");
  }

  const note = await findOwnedNote(req.params.id, req.user._id, true);
  const reply = await ai.runCustomCommand(note.extractedText, String(command).trim());

  res.json({ reply });
});

// DELETE /api/notes/:id
export const deleteNote = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.id, req.user._id);

  const quizIds = await Quiz.find({
    noteId: note._id,
  }).distinct("_id");

  await Promise.all([
    Flashcard.deleteMany({ noteId: note._id }),
    QuizAttempt.deleteMany({ quizId: { $in: quizIds } }),
    Quiz.deleteMany({ noteId: note._id }),
  ]);

  await note.deleteOne();

  res.json({
    message: "Note and related data deleted",
  });
});
