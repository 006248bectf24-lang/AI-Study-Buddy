
import Quiz from "../models/Quiz.js";
import Note from "../models/Note.js";
import QuizAttempt from "../models/QuizAttempt.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import findOwnedNote from "../utils/findOwnedNote.js";
import * as ai from "../services/aiService.js";

// GET /api/notes/:noteId/quizzes
export const listQuizzes = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.noteId, req.user._id);

  const quizzes = await Quiz.find({
    noteId: note._id,
    userId: req.user._id,
  }).sort({ createdAt: -1 });

  const stats = await QuizAttempt.aggregate([
    {
      $match: {
        quizId: { $in: quizzes.map((q) => q._id) },
      },
    },
    {
      $group: {
        _id: "$quizId",
        attempts: { $sum: 1 },
        best: { $max: "$score" },
      },
    },
  ]);

  const statMap = new Map(
    stats.map((s) => [String(s._id), s])
  );

  res.json({
    quizzes: quizzes.map((q) => ({
      _id: q._id,
      createdAt: q.createdAt,
      total: q.questions.length,
      attempts: statMap.get(String(q._id))?.attempts || 0,
      bestScore: statMap.get(String(q._id))?.best ?? null,
    })),
  });
});

// POST /api/notes/:noteId/quizzes/generate
// Body: { "count": 10, "type": "mcq" }
export const generateQuiz = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.noteId, req.user._id, true);

  const count = Number(req.body.count ?? 10);

  const allowedTypes = ["mcq", "short", "long", "mixed"];
  const type = req.body.type ?? "mcq";

  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new ApiError(
      400,
      "Question count must be a whole number between 1 and 50."
    );
  }

  if (!allowedTypes.includes(type)) {
    throw new ApiError(
      400,
      "Invalid quiz type. Choose mcq, short, long, or mixed."
    );
  }

  // Generate questions using selected type and count
  const questions = await ai.generateQuiz(
    note.extractedText,
    count,
    type
  );

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(
      500,
      "AI could not generate quiz questions. Please try again."
    );
  }

  const quiz = await Quiz.create({
    noteId: note._id,
    userId: req.user._id,
    questions,
  });

  res.status(201).json({
    quiz: {
      _id: quiz._id,
      createdAt: quiz.createdAt,
      total: quiz.questions.length,
      type,
      requestedCount: count,
    },
  });
});

// GET /api/quizzes/:id
// Existing MCQ answers remain hidden from the user
export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  const note = await Note.findById(quiz.noteId).select("title");

  res.json({
    quiz: {
      _id: quiz._id,
      noteId: quiz.noteId,
      noteTitle: note?.title || "Quiz",
      questions: quiz.questions.map((q) => ({
        question: q.question,
        options: q.options,
        topic: q.topic,
        type: q.type || "mcq",
      })),
    },
  });
});
