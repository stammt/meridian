import "./instrument.js";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import storyRoutes from "./routes/story.js";
import worldRoutes from "./routes/worlds.js";
import { dbLimiter, authLimiter } from "./middleware/limiters.js";
import * as Sentry from "@sentry/node";

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

// Test error endpoint for verifying Sentry integration
app.get("/test-error", (req, res) => {
  throw new Error("Sentry Test Backend Error");
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

app.listen(PORT, () => {
  console.log(`Meridian backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
