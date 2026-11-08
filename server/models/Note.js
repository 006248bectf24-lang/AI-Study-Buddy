import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true },
  extractedText: { type: String, required: true, select: false }, // large, only loaded when needed
  summary: { type: String, default: "" },
  keyPoints: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

// Don't send the full text to the client
noteSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.extractedText;
    return ret;
  },
});

export default mongoose.model("Note", noteSchema);
