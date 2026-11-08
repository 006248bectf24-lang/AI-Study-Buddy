import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { reviewSchema } from "../utils/validators.js";
import { reviewFlashcard } from "../controllers/flashcardController.js";

const router = Router();
router.use(protect);

router.patch("/:id/review", validate(reviewSchema), reviewFlashcard);

export default router;
