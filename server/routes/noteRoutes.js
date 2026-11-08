import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import upload from "../middleware/upload.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import { noteSchema } from "../utils/validators.js";
import {
  createNote,
  getNotes,
  getNote,
  deleteNote,
  regenerateSummary,
  askNoteAI,
} from "../controllers/noteController.js";
import { getFlashcards, generateFlashcards } from "../controllers/flashcardController.js";
import { listQuizzes, generateQuiz } from "../controllers/quizController.js";

const router = Router();
router.use(protect);

router
  .route("/")
  .get(getNotes)
  .post(aiLimiter, upload.single("file"), validate(noteSchema), createNote);

router.route("/:id").get(getNote).delete(deleteNote);
router.post("/:id/summary", aiLimiter, regenerateSummary);
router.post("/:id/ask", aiLimiter, askNoteAI);

// Note-scoped flashcards and quizzes
router.get("/:noteId/flashcards", getFlashcards);
router.post("/:noteId/flashcards/generate", aiLimiter, generateFlashcards);
router.get("/:noteId/quizzes", listQuizzes);
router.post("/:noteId/quizzes/generate", aiLimiter, generateQuiz);

export default router;
