import { Router } from "express";
import {
  getPublicMessages,
  sendPublicMessage,
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Logged-in users ke liye shared public chat room
router.get("/public/messages", requireAuth, getPublicMessages);
router.post("/public/messages", requireAuth, sendPublicMessage);

export default router;