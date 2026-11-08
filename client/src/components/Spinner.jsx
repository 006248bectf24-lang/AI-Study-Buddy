export default function Spinner({ text = "Loading...", small = false }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-slate-500 ${small ? "py-2" : "py-16"}`}>
      <div
        className={`animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 ${
          small ? "h-4 w-4" : "h-8 w-8"
        }`}
      />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}
