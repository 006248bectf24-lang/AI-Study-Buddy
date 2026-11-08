import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getAnalytics } from "../controllers/analyticsController.js";

const router = Router();
router.use(protect);

router.get("/", getAnalytics);

export default router;
