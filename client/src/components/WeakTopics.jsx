// Simple list of weak topics with proportional bars
export default function WeakTopics({ topics }) {
  if (!topics || topics.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-6 text-center">
        No weak topics yet. Great job — or take a quiz first!
      </p>
    );
  }
  const max = Math.max(...topics.map((t) => t.count));

  return (
    <ul className="space-y-3">
      {topics.map((t) => (
        <li key={t.topic}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{t.topic}</span>
            <span className="text-slate-500">{t.count} wrong</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full">
            <div
              className="h-2 bg-red-400 rounded-full"
              style={{ width: `${(t.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
