import { Router } from "express";
import {
  signup,
  login,
  getMe,
  updateProfile,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.patch("/profile", requireAuth, updateProfile);

export default router;