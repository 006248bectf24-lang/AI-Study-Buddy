import { Link } from "react-router-dom";

export default function NoteCard({ note, onDelete }) {
  const hasSummary = Boolean(note.summary);

  return (
    <div className="card flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 bg-white border border-slate-200/90 group">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100/60">
            📑
          </span>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
            {new Date(note.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Note Title */}
        <Link
          to={`/notes/${note._id}`}
          className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 block mb-2"
        >
          {note.title}
        </Link>

        {/* Note Summary Snippet */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100 mb-3">
          {note.summary || "No summary yet. Click open to generate chapter summary, flashcards, and quizzes."}
        </p>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
            hasSummary
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-slate-100 text-slate-500"
          }`}>
            {hasSummary ? "✓ Summary Ready" : "Unsummarized"}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100">
            🃏 Flashcards & Quizzes
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <Link
          to={`/notes/${note._id}`}
          className="btn-primary !py-2 text-xs font-semibold flex-1 text-center"
        >
          Study Note →
        </Link>
        <button
          onClick={() => onDelete(note._id)}
          className="btn-danger !py-2 text-xs font-semibold"
          title="Delete note"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
