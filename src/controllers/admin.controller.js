import { supabase } from "../db/supabase.js";

export async function getDashboard(req, res, next) {
  try {
    const [usersResult, placesResult] = await Promise.all([
      supabase
        .from("users")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("community_places")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    if (usersResult.error) throw usersResult.error;
    if (placesResult.error) throw placesResult.error;

    return res.json({
      dashboard: {
        userCount: usersResult.count ?? 0,
        pendingPlacesCount: placesResult.count ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req, res, next) {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const allowedRoles = ["user", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Role must be user or admin." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", req.params.id)
      .select("id, name, email, role")
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: "User not found." });

    return res.json({ user });
  } catch (error) {
    next(error);
  }
}
export async function getPendingPlaces(req, res, next) {
  try {
    const { data: places, error } = await supabase
      .from("community_places")
      .select("id, name, category, address, lat, lon, submitted_by, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.json({ places });
  } catch (error) {
    next(error);
  }
}

export async function reviewCommunityPlace(req, res, next) {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Status must be approved or rejected.",
      });
    }

    const { data: place, error } = await supabase
      .from("community_places")
      .update({ status })
      .eq("id", req.params.id)
      .eq("status", "pending")
      .select("id, name, category, address, lat, lon, status")
      .maybeSingle();

    if (error) throw error;

    if (!place) {
      return res.status(404).json({
        error: "Pending place not found. It may have already been reviewed.",
      });
    }

    return res.json({ message: `Place ${status}.`, place });
  } catch (error) {
    next(error);
  }
}
