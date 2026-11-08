import rateLimit from "express-rate-limit";

const make = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { message } });

// Login/register: slow down brute force
export const authLimiter = make(15 * 60 * 1000, 30, "Too many attempts, try again in 15 minutes.");

// AI endpoints cost money/quota
export const aiLimiter = make(60 * 60 * 1000, 40, "AI request limit reached, try again later.");
