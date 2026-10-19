import { verifyToken } from "../utils/jwt.js";
import { supabase } from "../db/supabase.js";

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  try {
    req.user = verifyToken(token);
    if (typeof req.user.id !== "string") throw new Error("Invalid token subject.");
    return next();
  } catch {
    return res.status(401).json({ error: "Your session is invalid or has expired. Please sign in again." });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .maybeSingle();
    if (error) throw error;
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Administrator access is required." });
    }
    req.user.role = user.role;
    return next();
  } catch (error) {
    return next(error);
  }
}
