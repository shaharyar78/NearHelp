import { supabase } from "../db/supabase.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !email.trim() || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (name.trim().length < 2 || name.trim().length > 80 || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: "Enter a valid name and email. Passwords must be 8–72 characters." });
    }

    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const passwordHash = await hashPassword(password);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role: "user",
      })
      .select("id, name, email, role")
      .single();

    if (error) throw error;

    const token = signToken({ id: user.id, role: user.role });

    return res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, password_hash")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;

    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({
        error: "Email or password is incorrect.",
      });
    }

    const token = signToken({ id: user.id, role: user.role });
    const { password_hash, ...safeUser } = user;

    return res.json({ user: safeUser, token });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, gender, location, work")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    return res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { gender = "", location = "", work = "" } = req.body;

    const allowedGenders = [
      "",
      "Woman",
      "Man",
      "Non-binary",
      "Prefer not to say",
    ];

    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({
        error: "Choose a valid gender option.",
      });
    }

    if (
      typeof location !== "string" ||
      typeof work !== "string" ||
      location.length > 120 ||
      work.length > 120
    ) {
      return res.status(400).json({
        error: "Location and work must be 120 characters or fewer.",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .update({
        gender,
        location: location.trim(),
        work: work.trim(),
      })
      .eq("id", req.user.id)
      .select("id, name, email, role, gender, location, work")
      .single();

    if (error) throw error;

    return res.json({ user });
  } catch (error) {
    next(error);
  }
}
