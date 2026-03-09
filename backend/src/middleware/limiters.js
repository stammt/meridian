import rateLimit from "express-rate-limit";

const rateLimitMessage = { error: "Too many requests, please try again later" };

// For auth endpoints (magic link requests) — very strict
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

// For routes that call Claude — strict limit to control API costs
export const claudeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

// For routes that only hit the database — higher limit, no Claude cost concern
export const dbLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});
