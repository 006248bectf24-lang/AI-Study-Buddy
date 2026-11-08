
import Flashcard from "../models/Flashcard.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import findOwnedNote from "../utils/findOwnedNote.js";
import * as ai from "../services/aiService.js";

// Days until next review for each difficulty rating
const REVIEW_DAYS = {
  easy: 7,
  medium: 3,
  hard: 1,
};

// GET /api/notes/:noteId/flashcards
export const getFlashcards = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.noteId, req.user._id);

  const flashcards = await Flashcard.find({
    noteId: note._id,
    userId: req.user._id,
  }).sort({ _id: 1 });

  res.json({ flashcards });
});

// POST /api/notes/:noteId/flashcards/generate
// Body: { "count": 20 }
export const generateFlashcards = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.noteId, req.user._id, true);

  // Read the quantity selected by the user
  const count = Number(req.body.count ?? 10);

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new ApiError(
      400,
      "Flashcard count must be a whole number between 1 and 100."
    );
  }

  // Generate the requested number of cards
  const cards = await ai.generateFlashcards(note.extractedText, count);

  if (!Array.isArray(cards) || cards.length === 0) {
    throw new ApiError(500, "AI could not generate flashcards. Please try again.");
  }

  // Delete old cards only after AI generation succeeds
  await Flashcard.deleteMany({
    noteId: note._id,
    userId: req.user._id,
  });

  const flashcards = await Flashcard.insertMany(
    cards.map((card) => ({
      ...card,
      noteId: note._id,
      userId: req.user._id,
    }))
  );

  res.status(201).json({
    flashcards,
    requestedCount: count,
    generatedCount: flashcards.length,
  });
});

// PATCH /api/flashcards/:id/review
// Body: { "difficulty": "easy" }
export const reviewFlashcard = asyncHandler(async (req, res) => {
  const { difficulty } = req.body;

  if (!REVIEW_DAYS[difficulty]) {
    throw new ApiError(400, "Invalid difficulty. Use easy, medium, or hard.");
  }

  const nextReviewDate = new Date(
    Date.now() + REVIEW_DAYS[difficulty] * 24 * 60 * 60 * 1000
  );

  const flashcard = await Flashcard.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user._id,
    },
    {
      difficulty,
      nextReviewDate,
    },
    {
      new: true,
    }
  );

  if (!flashcard) {
    throw new ApiError(404, "Flashcard not found");
  }

  res.json({ flashcard });
});
