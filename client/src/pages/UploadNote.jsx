import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";

export default function UploadNote() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("text"); // "text" or "pdf"
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") return toast.error("Please choose a PDF file");
    if (f.size > 10 * 1024 * 1024) return toast.error("PDF must be under 10 MB");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "pdf" && !file) return toast.error("Please choose a PDF file");
    if (mode === "text" && text.trim().length < 50) {
      return toast.error("Please paste at least 50 characters of study material");
    }

    const formData = new FormData();
    formData.append("title", title);
    if (mode === "pdf") formData.append("file", file);
    else formData.append("text", text);

    setLoading(true);
    try {
      const res = await api.post("/notes", formData);
      if (res.data.warning) toast(res.data.warning, { icon: "⚠️", duration: 6000 });
      else toast.success("Study note created with AI summary!");
      navigate(`/notes/${res.data.note._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-1 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Add New Study Note
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload your notes or PDF slides to automatically generate in-depth chapter summaries, flashcards, and quizzes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8">
        {/* Title Input */}
        <div>
          <label className="label">Note Title</label>
          <input
            required
            maxLength={150}
            className="input"
            placeholder="e.g. Chapter 3: Cellular Respiration & ATP"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Input Mode Switcher */}
        <div>
          <label className="label">Input Method</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "text"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setMode("text")}
            >
              ✍️ Paste Text
            </button>
            <button
              type="button"
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "pdf"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setMode("pdf")}
            >
              📄 Upload PDF
            </button>
          </div>
        </div>

        {/* Mode-specific Input */}
        {mode === "text" ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Study Notes Content</label>
              <span className="text-[11px] font-semibold text-slate-400">
                {text.length} characters (min 50)
              </span>
            </div>
            <textarea
              rows={10}
              className="input font-mono text-xs leading-relaxed"
              placeholder="Paste your lecture notes, textbook chapters, or summary notes here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label className="label">PDF Document (Max 10 MB)</label>
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition bg-indigo-50/20">
              <div className="text-3xl mb-2">📁</div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Choose a PDF file from your computer
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                Lecture slides, textbook pages, or handouts
              </p>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFile}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="btn-secondary !py-1.5 !px-4 text-xs cursor-pointer inline-block"
              >
                Browse File
              </label>

              {file && (
                <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                  <span>✓</span> Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3 text-sm font-bold shadow-md"
          >
            {loading ? "Analyzing Material & Generating Summary..." : "Save Note & Generate Study Materials →"}
          </button>
          {loading && (
            <div className="mt-3">
              <Spinner small text="Reading text and using AI to formulate chapter summaries..." />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
