import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import storyRoutes from "./routes/story.js";
import worldRoutes from "./routes/worlds.js";
import { dbLimiter, authLimiter } from "./middleware/limiters.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // required for cookies
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes — claudeLimiter is applied per-route in each router for Claude-backed endpoints
app.use("/auth/send-link", authLimiter);
app.use("/auth", authRoutes);
app.use("/stories", dbLimiter, storyRoutes);
app.use("/worlds", dbLimiter, worldRoutes);

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Meridian backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
