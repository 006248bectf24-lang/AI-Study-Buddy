
import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
    index: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  score: {
    type: Number,
    required: true,
  },

  total: {
    type: Number,
    required: true,
  },

  wrongTopics: {
    type: [String],
    default: [],
  },

  // Supports both old MCQ indexes and new written answers.
  answers: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },

  // Stores question-wise evaluation and feedback.
  questionResults: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("QuizAttempt", attemptSchema);
