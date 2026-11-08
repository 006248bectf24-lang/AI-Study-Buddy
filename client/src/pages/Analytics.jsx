import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatCard from "../components/StatCard.jsx";
import ScoreChart from "../components/ScoreChart.jsx";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/analytics");
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (data.quizzesTaken === 0) {
    return (
      <EmptyState icon="📊" title="No analytics yet" message="Take a quiz and your performance will show up here.">
        <Link to="/" className="btn-primary">Go to dashboard</Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="📄" label="Total notes" value={data.totalNotes} />
        <StatCard icon="📝" label="Quizzes taken" value={data.quizzesTaken} />
        <StatCard icon="🎯" label="Average score" value={`${data.averageScore}%`} />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Score over time</h2>
        <ScoreChart data={data.scoreOverTime} />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Weak topics (most wrong answers)</h2>
        {data.weakTopics.length === 0 ? (
          <p className="text-slate-500 text-sm">No wrong answers yet — perfect!</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weakTopics} layout="vertical" margin={{ left: 20, right: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="topic" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, "Wrong answers"]} />
                <Bar dataKey="count" fill="#f87171" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold mb-3">Recent attempts</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-4">Note</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {data.recentAttempts.map((a) => (
              <tr key={a._id} className="border-b last:border-0">
                <td className="py-2 pr-4">{a.noteTitle}</td>
                <td className="py-2 pr-4">{a.score}/{a.total} ({a.percent}%)</td>
                <td className="py-2 pr-4">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="py-2">
                  <Link to={`/result/${a._id}`} className="text-indigo-600 font-medium">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
