export default function EmptyState({ icon = "📭", title, message, children }) {
  return (
    <div className="card text-center py-10">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="text-slate-500 mt-1 mb-4">{message}</p>}
      {children}
    </div>
  );
}
