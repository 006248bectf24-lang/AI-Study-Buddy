import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatCard from "../components/StatCard.jsx";
import NoteCard from "../components/NoteCard.jsx";
import ScoreChart from "../components/ScoreChart.jsx";
import WeakTopics from "../components/WeakTopics.jsx";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [notesRes, statsRes] = await Promise.all([
        api.get("/notes"),
        api.get("/analytics"),
      ]);
      setNotes(notesRes.data.notes);
      setStats(statsRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this study note and all its flashcards and quizzes?")) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner text="Loading study dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-7 md:p-9 shadow-lg">
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-indigo-200 border border-white/10">
            ✨ AI-Powered Study Assistant
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Master your subjects faster with instant summaries, custom flashcards & quizzes.
          </h1>
          <p className="text-xs md:text-sm text-indigo-200/90 leading-relaxed">
            Upload course material or lecture slides to automatically generate in-depth chapter summaries, custom flashcards, and quizzes.
          </p>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs md:text-sm shadow-md hover:bg-indigo-50 hover:shadow-lg transition-all"
            >
              <span>+</span> Upload New Note
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-gradient-to-tr from-violet-500/20 to-indigo-400/20 blur-2xl pointer-events-none"></div>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon="📚" label="Total Notes" value={stats.totalNotes || 0} />
          <StatCard icon="🎯" label="Quizzes Taken" value={stats.quizzesTaken || 0} />
          <StatCard
            icon="🏆"
            label="Average Score"
            value={stats.averageScore !== null ? `${stats.averageScore}%` : "0%"}
          />
        </div>
      )}

      {/* Analytics Charts & Weak Topics */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                📈 Score Progress Over Time
              </h2>
              <span className="text-xs text-slate-400">Recent Quizzes</span>
            </div>
            <ScoreChart data={stats.scoreOverTime} />
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                ⚠️ Topics Needing Review
              </h2>
            </div>
            <WeakTopics topics={stats.weakTopics} />
          </div>
        </div>
      )}

      {/* Study Notes Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Your Study Notes
            </h2>
            <p className="text-xs text-slate-500">
              All your lecture notes, summaries, and revision decks
            </p>
          </div>
          <Link to="/upload" className="btn-primary !py-2 text-xs font-semibold">
            + New Note
          </Link>
        </div>

        {notes.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No study notes yet"
            message="Upload a PDF or paste your study text to get started."
          >
            <Link to="/upload" className="btn-primary mt-2">
              Upload Your First Note
            </Link>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((n) => (
              <NoteCard key={n._id} note={n} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
