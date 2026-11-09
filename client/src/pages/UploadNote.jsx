import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "application/pdf") return toast.error("Please choose a PDF file");
    if (f.size > 4 * 1024 * 1024) return toast.error("PDF must be under 4 MB");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "pdf" && !file) return toast.error("Please choose a PDF file");
    if (mode === "text" && text.trim().length < 50) {
      return toast.error("Please paste at least 50 characters");
    }

    const formData = new FormData();
    formData.append("title", title);
    if (mode === "pdf") formData.append("file", file);
    else formData.append("text", text);

    setLoading(true);
    try {
      const res = await api.post("/notes", formData);
      if (res.data.warning) toast(res.data.warning, { icon: "⚠️", duration: 6000 });
      else toast.success("Note created with AI summary!");
      navigate(`/notes/${res.data.note._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  };

  const tabClass = (active) =>
    `px-4 py-2 rounded-lg text-sm font-medium ${
      active ? "bg-indigo-600 text-white" : "bg-white border border-slate-300 text-slate-600"
    }`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add a note</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            required
            maxLength={150}
            className="input"
            placeholder="e.g. Chapter 3 - Photosynthesis"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button type="button" className={tabClass(mode === "text")} onClick={() => setMode("text")}>
            Paste text
          </button>
          <button type="button" className={tabClass(mode === "pdf")} onClick={() => setMode("pdf")}>
            Upload PDF
          </button>
        </div>

        {mode === "text" ? (
          <div>
            <label className="label">Your notes</label>
            <textarea
              rows={12}
              className="input"
              placeholder="Paste your study notes here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">{text.length} characters</p>
          </div>
        ) : (
          <div>
            <label className="label">PDF file (max 4 MB)</label>
            <input type="file" accept="application/pdf" onChange={handleFile} className="input" />
            {file && <p className="text-sm text-slate-500 mt-1">Selected: {file.name}</p>}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Uploading..." : "Save & generate summary"}
        </button>
        {loading && <Spinner small text="Extracting text and asking the AI. This may take a while for large files..." />}
      </form>
    </div>
  );
}