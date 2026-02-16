import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120, // 120 req/min per IP for MVP
  standardHeaders: true,
  legacyHeaders: false,
});
