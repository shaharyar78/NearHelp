import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import config from "./src/config.js";
import authRoutes from "./src/routes/auth.routes.js";
import placesRoutes from "./src/routes/places.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import assistantRoutes from "./src/routes/assistant.routes.js";
import { errorHandler, notFoundHandler } from "./src/middleware/error.middleware.js";

const app = express();

const capacitorOrigins = new Set([
  "https://localhost",
  "capacitor://localhost",
  "https://near-by-help-1.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || capacitorOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by CORS."));
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://unpkg.com https://*.tile.openstreetmap.org; connect-src 'self' https://near-by-help-1.onrender.com; font-src 'self' https://unpkg.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  });
  next();
});
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false });
app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// Serve the static application assets.
app.use(express.static("public"));

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assistant", assistantRoutes);

// Unknown routes and errors.
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`NearHelp server is running on port ${config.port}`);
});
