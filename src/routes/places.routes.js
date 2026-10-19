import { Router } from "express";
import {
  searchPlaces,
  getPlaceById,
  submitCommunityPlace,
} from "../controllers/places.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", searchPlaces);
router.post("/community", requireAuth, submitCommunityPlace);
router.get("/:id", getPlaceById);

export default router;