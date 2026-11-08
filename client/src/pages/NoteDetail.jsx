import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";
import ErrorState from "../components/ErrorState.jsx";
import FlashcardsTab from "../components/FlashcardsTab.jsx";
import QuizTab from "../components/QuizTab.jsx";
import AskAITab from "../components/AskAITab.jsx";

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ask");
  const [summarizing, setSummarizing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/notes/${id}`);
      setNote(res.data.note);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const generateSummary = async () => {
    setSummarizing(true);
    try {
      const res = await api.post(`/notes/${id}/summary`);
      setNote(res.data.note);
      toast.success("Detailed chapter summary generated!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSummarizing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this study note and all its flashcards and quizzes?")) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted");
      navigate("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-1 transition"
          >
            ← Back to Notes
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {note.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Uploaded on {new Date(note.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="btn-danger !py-2 text-xs font-semibold"
        >
          Delete Note
        </button>
      </div>

      {/* Comprehensive Topic/Chapter Summary Card */}
      <div className="card space-y-5 bg-gradient-to-b from-white to-slate-50/50 border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-lg">
              📖
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Chapter & Topic Study Summary
              </h2>
              <p className="text-xs text-slate-500">
                Comprehensive breakdown with practical examples
              </p>
            </div>
          </div>
          {note.summary && (
            <button
              onClick={generateSummary}
              disabled={summarizing}
              className="btn-secondary !py-1.5 text-xs"
            >
              {summarizing ? "Regenerating..." : "Regenerate Summary"}
            </button>
          )}
        </div>

        {note.summary ? (
          <div className="space-y-5">
            {/* Main Summary Body */}
            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-3">
              {note.summary.split("\n\n").map((para, idx) => (
                <p key={idx} className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                  {para}
                </p>
              ))}
            </div>

            {/* Key Topic Points & Examples */}
            {note.keyPoints && note.keyPoints.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <span>💡</span> Key Topics & Illustrated Examples
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {note.keyPoints.map((point, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-sm flex items-start gap-2.5"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 mb-4">
              No study summary has been generated for this note yet.
            </p>
            <button
              onClick={generateSummary}
              disabled={summarizing}
              className="btn-primary"
            >
              {summarizing ? "Analyzing and Summarizing..." : "Generate Detailed Summary"}
            </button>
            {summarizing && (
              <div className="mt-3">
                <Spinner small text="Reading chapters and formulating examples..." />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs for Ask AI / Custom Commands, Flashcards & Quizzes */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto">
          <button
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === "ask"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setTab("ask")}
          >
            <span>✨</span> Ask AI / Custom Command
          </button>
          <button
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === "flashcards"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setTab("flashcards")}
          >
            <span>🃏</span> Flashcards
          </button>
          <button
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === "quiz"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setTab("quiz")}
          >
            <span>📝</span> Quizzes
          </button>
        </div>

        <div className="pt-2">
          {tab === "ask" && <AskAITab noteId={id} />}
          {tab === "flashcards" && <FlashcardsTab noteId={id} />}
          {tab === "quiz" && <QuizTab noteId={id} />}
        </div>
      </div>
    </div>
  );
}
