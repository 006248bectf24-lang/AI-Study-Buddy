import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Line chart of quiz scores (in %) over time
export default function ScoreChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-10 text-center">
        Take a quiz to see your score trend here.
      </p>
    );
  }

  const chartData = data.map((d, i) => ({
    name: `${new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} #${i + 1}`,
    percent: d.percent,
    note: d.noteTitle,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 15, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(v, n, item) => [`${v}% (${item.payload.note})`, "Score"]} />
          <Line type="monotone" dataKey="percent" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
