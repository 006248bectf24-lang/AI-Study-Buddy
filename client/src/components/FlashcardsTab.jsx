import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "./Spinner.jsx";
import ErrorState from "./ErrorState.jsx";
import EmptyState from "./EmptyState.jsx";

const PRESET_COUNTS = [10, 20, 30, 50];

export default function FlashcardsTab({ noteId }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [count, setCount] = useState(10);
  const [isCustom, setIsCustom] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/notes/${noteId}/flashcards`);
      setCards(res.data.flashcards);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async (overrideCount) => {
    const targetCount = Math.max(1, Math.min(100, Number(overrideCount ?? count) || 10));
    setGenerating(true);
    try {
      const res = await api.post(`/notes/${noteId}/flashcards/generate`, {
        count: targetCount,
      });
      setCards(res.data.flashcards);
      setIndex(0);
      setFlipped(false);
      toast.success(`${res.data.flashcards.length} flashcards generated!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const go = (next) => {
    setFlipped(false);
    setIndex(next);
  };

  const rate = async (difficulty) => {
    try {
      const res = await api.patch(`/flashcards/${cards[index]._id}/review`, { difficulty });
      setCards((prev) =>
        prev.map((c) => (c._id === res.data.flashcard._id ? res.data.flashcard : c))
      );
      toast.success(`Marked as ${difficulty}`);
      if (index < cards.length - 1) go(index + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const countSelector = (
    <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
        Cards:
      </span>
      {PRESET_COUNTS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => {
            setCount(c);
            setIsCustom(false);
          }}
          className={!isCustom && count === c ? "chip-active" : "chip-inactive"}
        >
          {c} cards
        </button>
      ))}
      <button
        type="button"
        onClick={() => setIsCustom(true)}
        className={isCustom ? "chip-active" : "chip-inactive"}
      >
        Custom
      </button>

      {isCustom && (
        <div className="flex items-center gap-1.5 ml-1">
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-400">(1-100)</span>
        </div>
      )}
    </div>
  );

  if (loading) return <Spinner text="Loading flashcards..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (cards.length === 0) {
    return (
      <EmptyState
        icon="🃏"
        title="No flashcards yet"
        message="Choose how many cards you want to generate from this note (10, 20, 30, or custom)."
      >
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          {countSelector}
          <button
            onClick={() => generate()}
            disabled={generating}
            className="btn-primary w-full"
          >
            {generating ? "Generating flashcards..." : `Generate ${count} flashcards`}
          </button>
          {generating && (
            <Spinner small text="Creating high-yield flashcards with AI..." />
          )}
        </div>
      </EmptyState>
    );
  }

  const card = cards[index];

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            Card {index + 1} of {cards.length}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
            card.difficulty === "easy"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : card.difficulty === "hard"
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {card.difficulty || "medium"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {countSelector}
          <button
            onClick={() => generate()}
            disabled={generating}
            className="btn-secondary !py-2 text-xs"
          >
            {generating ? "Generating..." : `Regenerate (${count})`}
          </button>
        </div>
      </div>

      {/* 3D Flip Card */}
      <div
        className="flip-card h-72 cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
          {/* Front (Question) */}
          <div className="flip-face card flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 border border-slate-200 shadow-md">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 mb-4">
              Question
            </span>
            <p className="text-xl font-medium text-slate-800 leading-relaxed max-w-lg">
              {card.question}
            </p>
            <span className="text-xs font-medium text-slate-400 mt-6 inline-flex items-center gap-1">
              🔄 Tap anywhere to flip
            </span>
          </div>

          {/* Back (Answer) */}
          <div className="flip-face flip-back card flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-indigo-50/90 via-violet-50/80 to-purple-50/90 border border-indigo-200/80 shadow-md">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100 mb-4">
              Answer
            </span>
            <p className="text-xl font-semibold text-indigo-950 leading-relaxed max-w-lg">
              {card.answer}
            </p>
            <span className="text-xs font-medium text-indigo-400 mt-6 inline-flex items-center gap-1">
              🔄 Tap to flip back
            </span>
          </div>
        </div>
      </div>

      {/* Navigation and Rating Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="btn-secondary"
        >
          ← Prev
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">
            Rate recall:
          </span>
          <button
            onClick={() => rate("hard")}
            className="btn bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 !py-1.5 text-xs font-semibold"
          >
            Hard (1d)
          </button>
          <button
            onClick={() => rate("medium")}
            className="btn bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 !py-1.5 text-xs font-semibold"
          >
            Medium (3d)
          </button>
          <button
            onClick={() => rate("easy")}
            className="btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 !py-1.5 text-xs font-semibold"
          >
            Easy (7d)
          </button>
        </div>

        <button
          onClick={() => go(index + 1)}
          disabled={index === cards.length - 1}
          className="btn-secondary"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
