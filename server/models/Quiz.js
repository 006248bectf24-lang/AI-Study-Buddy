
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["mcq", "short", "long"],
    default: "mcq",
    required: true,
  },

  question: {
    type: String,
    required: true,
    trim: true,
  },

  options: {
    type: [String],
    default: undefined,
    validate: {
      validator: function (value) {
        // MCQs must have exactly 4 options.
        // Short and long questions do not need options.
        if (this.type === "mcq") {
          return Array.isArray(value) && value.length === 4;
        }

        return !value || value.length === 0;
      },
      message: "MCQs need exactly 4 options.",
    },
  },

  correctAnswer: {
    type: String,
    required: true,
    trim: true,
  },

  explanation: {
    type: String,
    default: "",
  },

  topic: {
    type: String,
    default: "General",
  },
});

const quizSchema = new mongoose.Schema({
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    required: true,
    index: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  questions: [questionSchema],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Quiz", quizSchema);
