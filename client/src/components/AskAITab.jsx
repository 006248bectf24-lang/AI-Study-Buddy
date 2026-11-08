import { useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "./Spinner.jsx";

// Simple plain-text renderer — no extra package needed
function renderText(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trimStart();
    // Numbered list line: "1. something"
    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, "");
      return (
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-indigo-500 font-bold min-w-[18px]">{trimmed.match(/^\d+/)[0]}.</span>
          <span>{renderInline(content)}</span>
        </div>
      );
    }
    // Bullet line: "- something" or "* something"
    if (/^[-*]\s/.test(trimmed)) {
      const content = trimmed.slice(2);
      return (
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-indigo-400 font-bold">•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
    }
    // Empty line = spacing
    if (trimmed === "") return <div key={i} className="h-2" />;
    // Normal line
    return <div key={i} className="py-0.5">{renderInline(line)}</div>;
  });
}

function renderInline(text) {
  // Bold: **text** or __text__
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
      const inner = part.replace(/^\*\*|\*\*$|^__|__$/g, "");
      return <strong key={i} className="font-semibold text-slate-900">{inner}</strong>;
    }
    return part;
  });
}

const SUGGESTED_COMMANDS = [
  { icon: "🧠", label: "Explain like I'm 5", cmd: "Explain the core concepts of this study material in very simple terms like I am 5 years old, using easy everyday analogies." },
  { icon: "📝", label: "Exam Cheat Sheet", cmd: "Create a condensed, high-yield 1-page exam cheat sheet summarizing all formulas, facts, and key rules." },
  { icon: "💡", label: "Mnemonics & Memory Tricks", cmd: "Provide clever, memorable mnemonics and memory shortcuts to easily remember the key terms and steps in this material." },
  { icon: "🔍", label: "Key Terms & Definitions", cmd: "Extract all important definitions, technical vocabulary, and key terms with clear explanations." },
  { icon: "🌐", label: "Translate to Urdu/Hindi", cmd: "Explain the main summary and key concepts in clear, easy-to-understand Urdu/Hindi roman text." },
  { icon: "🎯", label: "5 Tricky Exam Questions", cmd: "Give me 5 challenging conceptual exam questions that professors love to ask about this topic, with model answers." },
];

export default function AskAITab({ noteId }) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleRunCommand = async (cmdText) => {
    const promptToRun = String(cmdText || command).trim();
    if (!promptToRun) {
      toast.error("Please enter a question or command");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/notes/${noteId}/ask`, { command: promptToRun });
      const newEntry = {
        prompt: promptToRun,
        reply: res.data.reply,
        timestamp: new Date(),
      };
      setConversations((prev) => [newEntry, ...prev]);
      setCommand("");
      toast.success("AI response ready!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Command Panel */}
      <div className="card bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 border border-indigo-100 shadow-md space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-lg shadow-sm">
            ✨
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">
              Custom AI Study Partner
            </h3>
            <p className="text-xs text-slate-500">
              Run any custom command, question, translation, or revision request on this material
            </p>
          </div>
        </div>

        {/* Quick Command Chips */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
            Popular One-Click Commands:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUGGESTED_COMMANDS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleRunCommand(s.cmd)}
                className="p-2.5 rounded-xl text-left border border-slate-200 bg-white/80 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-xs font-medium text-slate-700 flex items-center gap-2 shadow-xs group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">
                  {s.icon}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Command Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCommand();
          }}
          className="space-y-2 pt-2 border-t border-slate-200/60"
        >
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Or Type Any Command or Question:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input text-sm"
              placeholder="e.g. 'Explain topic 2 in simple Urdu', 'Give 3 real-world applications', 'Create a study plan'..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !command.trim()}
              className="btn-primary !px-5 whitespace-nowrap text-xs font-bold"
            >
              {loading ? "Running..." : "Run AI →"}
            </button>
          </div>
        </form>

        {loading && (
          <div className="py-2">
            <Spinner small text="Analyzing study material and generating your custom answer..." />
          </div>
        )}
      </div>

      {/* Response Stream / History */}
      {conversations.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              AI Responses ({conversations.length})
            </h4>
            <button
              onClick={() => setConversations([])}
              className="text-xs text-slate-400 hover:text-rose-600 transition"
            >
              Clear History
            </button>
          </div>

          {conversations.map((c, i) => (
            <div
              key={i}
              className="card bg-white border border-slate-200/90 shadow-sm space-y-3"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                  <span>💬 Prompt:</span>
                  <span className="text-slate-800 font-semibold">{c.prompt}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(c.reply, i)}
                  className="btn-secondary !py-1 !px-2.5 text-[11px] font-semibold"
                >
                  {copiedIndex === i ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>

              {/* AI Response — renders bullets, numbers, bold */}
              <div className="text-xs md:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100 font-sans space-y-0.5">
                {renderText(c.reply)}
              </div>

              <div className="text-[10px] text-slate-400 text-right">
                {new Date(c.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
