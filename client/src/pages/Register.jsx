import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api/axios.js";

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md mb-3">
            📚
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Start generating smart summaries, flashcards, and quizzes
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card space-y-4 bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xl p-8 rounded-3xl"
        >
          <div>
            <label className="label">Full Name</label>
            <input
              required
              minLength={2}
              className="input"
              placeholder="e.g. Alex Johnson"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Password (at least 6 characters)</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3 text-sm font-bold shadow-md mt-2"
          >
            {loading ? "Creating your account..." : "Get Started Free →"}
          </button>

          <p className="text-xs text-center text-slate-500 pt-2 border-t border-slate-100">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
