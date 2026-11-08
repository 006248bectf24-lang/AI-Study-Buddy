import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 text-base font-extrabold text-slate-900 group">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-base shadow-sm group-hover:scale-105 transition-transform">
            📚
          </span>
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            AI Study Buddy
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/upload" className={linkClass}>
            + Upload Note
          </NavLink>
          <NavLink to="/analytics" className={linkClass}>
            Analytics
          </NavLink>
          {user?.name && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60 ml-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{user.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn-secondary !py-1 !px-3 text-xs font-semibold ml-1 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
