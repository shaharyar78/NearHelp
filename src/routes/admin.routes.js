import { Router } from "express";
import {
  getDashboard,
  getUsers,
  updateUserRole,
  getPendingPlaces,
  reviewCommunityPlace,
} from "../controllers/admin.controller.js";
import {
  requireAuth,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

// Admin-only endpoints
router.get("/dashboard", requireAuth, requireAdmin, getDashboard);
router.get("/users", requireAuth, requireAdmin, getUsers);
router.patch("/users/:id/role", requireAuth, requireAdmin, updateUserRole);

// Community place review
router.get(
  "/community-places",
  requireAuth,
  requireAdmin,
  getPendingPlaces
);
router.patch(
  "/community-places/:id",
  requireAuth,
  requireAdmin,
  reviewCommunityPlace
);

export default router;