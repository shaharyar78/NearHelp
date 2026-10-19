import { Router } from "express";
import rateLimit from "express-rate-limit";
import { askAssistant } from "../controllers/assistant.controller.js";

const router = Router();
const assistantLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

router.post("/ask", assistantLimiter, askAssistant);

export default router;
