import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getQuiz } from "../controllers/quizController.js";

const router = Router();
router.use(protect);

router.get("/:id", getQuiz);

export default router;
