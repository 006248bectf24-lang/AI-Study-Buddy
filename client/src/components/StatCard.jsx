export default function StatCard({ label, value, icon }) {
  return (
    <div className="card flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-200 border border-slate-200/90 shadow-sm bg-gradient-to-br from-white to-slate-50/60">
      <div className="w-13 h-13 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-2xl shadow-xs">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900 tracking-tight">
          {value}
        </div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}
