import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import storyRoutes from "./routes/story.js";
import worldRoutes from "./routes/worlds.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 magic link requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// TODO: separate limiter for Claude endpoints vs db - maybe 20 per minute for Claude, but higher for db since not all requests will hit Claude
const claudeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 Claude-backed requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // required for cookies
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth/send-link", authLimiter);
app.use("/auth", authRoutes);
app.use("/stories", claudeLimiter, storyRoutes);
app.use("/worlds", claudeLimiter, worldRoutes);

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Meridian backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
