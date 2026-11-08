import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api/axios.js";

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
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
            AI Study Buddy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to access your notes, flashcards, and quizzes
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card space-y-4 bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xl p-8 rounded-3xl"
        >
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
            <label className="label">Password</label>
            <input
              type="password"
              required
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
            {loading ? "Signing in..." : "Sign in →"}
          </button>

          <p className="text-xs text-center text-slate-500 pt-2 border-t border-slate-100">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
