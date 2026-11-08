import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "./Spinner.jsx";
import ErrorState from "./ErrorState.jsx";
import EmptyState from "./EmptyState.jsx";

const PRESET_COUNTS = [5, 10, 20, 30];
const QUIZ_TYPES = [
  { id: "mcq", label: "MCQ", desc: "4 options" },
  { id: "short", label: "Short Answer", desc: "1-3 sentences" },
  { id: "long", label: "Long Questions", desc: "Detailed essay" },
  { id: "mixed", label: "Mixed", desc: "MCQ + Written" },
];

export default function QuizTab({ noteId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(10);
  const [type, setType] = useState("mcq");
  const [isCustomCount, setIsCustomCount] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/notes/${noteId}/quizzes`);
      setQuizzes(res.data.quizzes);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    const targetCount = Math.max(1, Math.min(50, Number(count) || 10));
    setGenerating(true);
    try {
      await api.post(`/notes/${noteId}/quizzes/generate`, {
        count: targetCount,
        type,
      });
      toast.success(`Generated ${targetCount} ${type.toUpperCase()} questions!`);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Spinner text="Loading quizzes..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const quizOptionsPanel = (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-4">
      {/* Question Type Selection */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
          Select Question Type:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUIZ_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                type === t.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40"
              }`}
            >
              <div className="font-semibold text-xs">{t.label}</div>
              <div
                className={`text-[11px] truncate ${
                  type === t.id ? "text-indigo-100" : "text-slate-400"
                }`}
              >
                {t.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Question Count Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
            Questions:
          </span>
          {PRESET_COUNTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCount(c);
                setIsCustomCount(false);
              }}
              className={
                !isCustomCount && count === c ? "chip-active" : "chip-inactive"
              }
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustomCount(true)}
            className={isCustomCount ? "chip-active" : "chip-inactive"}
          >
            Custom
          </button>
          {isCustomCount && (
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className="btn-primary"
        >
          {generating ? "Generating..." : `Generate ${count} Questions`}
        </button>
      </div>
    </div>
  );

  if (quizzes.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No quizzes yet"
        message="Customize your quiz: pick the number of questions (10, 20, 30) and choose MCQs, Short, or Long questions."
      >
        <div className="w-full max-w-lg mt-2">
          {quizOptionsPanel}
          {generating && (
            <div className="mt-4">
              <Spinner small text="Generating quiz questions with AI..." />
            </div>
          )}
        </div>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-5">
      {quizOptionsPanel}

      {generating && (
        <Spinner small text="Creating new customized quiz..." />
      )}

      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
          Available Quizzes ({quizzes.length})
        </h3>
        {quizzes.map((q, i) => (
          <div
            key={q._id}
            className="card flex flex-wrap items-center justify-between gap-4 hover:border-indigo-200 transition"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  Quiz #{quizzes.length - i}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 uppercase">
                  {q.type || "quiz"}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                <span>{q.total} questions</span>
                <span>•</span>
                <span>Created {new Date(q.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>
                  {q.attempts} attempt{q.attempts === 1 ? "" : "s"}
                </span>
                {q.bestScore !== null && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Best: {q.bestScore}/{q.total}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Link
              to={`/quiz/${q._id}`}
              className="btn-primary !py-2 text-xs font-semibold shadow-sm"
            >
              {q.attempts ? "Retake Quiz" : "Start Quiz →"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
