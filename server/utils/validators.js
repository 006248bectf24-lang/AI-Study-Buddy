
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  text: z.string().optional().default(""),
});

export const reviewSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
});

// Supports both MCQ indexes and written answers
export const attemptSchema = z.object({
  quizId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid quiz id"),

  answers: z.array(
    z.union([
      z.number().int().min(-1).max(3),
      z.string().max(10000),
    ])
  ).min(1).max(50),
});

// Flashcard generation settings
export const generationSchema = z.object({
  count: z.coerce.number().int().min(1).max(100).default(10),
});

// Quiz generation settings
export const quizGenerationSchema = z.object({
  count: z.coerce.number().int().min(1).max(50).default(10),

  type: z.enum([
    "mcq",
    "short",
    "long",
    "mixed",
  ]).default("mcq"),
});
