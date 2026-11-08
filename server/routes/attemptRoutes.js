import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { attemptSchema } from "../utils/validators.js";
import { submitAttempt, getAttempt, getAttempts } from "../controllers/attemptController.js";

const router = Router();
router.use(protect);

router.route("/").get(getAttempts).post(validate(attemptSchema), submitAttempt);
router.get("/:id", getAttempt);

export default router;
