import Note from "../models/Note.js";
import QuizAttempt from "../models/QuizAttempt.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/analytics
export const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [totalNotes, attempts, weak] = await Promise.all([
    Note.countDocuments({ userId }),
    QuizAttempt.find({ userId })
      .sort({ createdAt: 1 })
      .populate({ path: "quizId", select: "noteId", populate: { path: "noteId", select: "title" } }),
    // Count how often each topic was answered wrong
    QuizAttempt.aggregate([
      { $match: { userId } },
      { $unwind: "$wrongTopics" },
      { $group: { _id: "$wrongTopics", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const rows = attempts.map((a) => ({
    _id: a._id,
    noteTitle: a.quizId?.noteId?.title || "Deleted note",
    score: a.score,
    total: a.total,
    percent: a.total ? Math.round((a.score / a.total) * 100) : 0,
    createdAt: a.createdAt,
  }));

  const averageScore = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.percent, 0) / rows.length)
    : 0;

  res.json({
    totalNotes,
    quizzesTaken: rows.length,
    averageScore,
    scoreOverTime: rows.slice(-30).map((r) => ({
      date: r.createdAt,
      percent: r.percent,
      noteTitle: r.noteTitle,
    })),
    weakTopics: weak.map((w) => ({ topic: w._id, count: w.count })),
    recentAttempts: [...rows].reverse().slice(0, 10),
  });
});
