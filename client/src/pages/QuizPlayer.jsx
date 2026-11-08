
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function QuizPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/quizzes/${id}`);
      const loadedQuiz = res.data.quiz;

      setQuiz(loadedQuiz);

      setAnswers(
        loadedQuiz.questions.map((q) =>
          (q.type || "mcq") === "mcq" ? -1 : ""
        )
      );

      setCurrent(0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const q = quiz?.questions?.[current];
  const total = quiz?.questions?.length || 0;
  const isLast = current === total - 1;

  const questionType = q?.type || "mcq";

  const updateAnswer = (value) => {
    setAnswers((previous) =>
      previous.map((answer, index) =>
        index === current ? value : answer
      )
    );
  };

  const isAnswered = (answer, question) => {
    const type = question.type || "mcq";

    if (type === "mcq") {
      return typeof answer === "number" && answer >= 0;
    }

    return typeof answer === "string" && answer.trim().length > 0;
  };

  const answeredCount = quiz
    ? answers.filter((answer, index) =>
        isAnswered(answer, quiz.questions[index])
      ).length
    : 0;

  const unansweredCount = total - answeredCount;

  const submit = async () => {
    if (
      unansweredCount > 0 &&
      !window.confirm(
        `${unansweredCount} question(s) are unanswered. Do you want to submit anyway?`
      )
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post("/attempts", {
        quizId: id,
        answers,
      });

      navigate(`/result/${res.data.result._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner text="Loading quiz..." />;

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!quiz || !q || total === 0) {
    return <ErrorState message="No quiz questions found." onRetry={load} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Back to note */}
      <Link
        to={`/notes/${quiz.noteId}`}
        className="text-sm text-slate-500 hover:text-indigo-600"
      >
        ← {quiz.noteTitle}
      </Link>

      {/* Quiz heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quiz Player
          </h1>
          <p className="text-sm text-slate-500">
            Answer the questions and submit your quiz.
          </p>
        </div>

        <div className="text-sm font-medium text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg">
          {answeredCount} / {total} Answered
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>
            Question {current + 1} of {total}
          </span>

          <span>
            {Math.round(((current + 1) / total) * 100)}%
          </span>
        </div>

        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{
              width: `${((current + 1) / total) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question navigation */}
      <div className="card space-y-3">
        <p className="text-sm font-semibold text-slate-600">
          Question Navigation
        </p>

        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((question, index) => {
            const answered = isAnswered(
              answers[index],
              question
            );

            return (
              <button
                key={index}
                type="button"
                onClick={() => setCurrent(index)}
                className={`w-10 h-10 rounded-lg border text-sm font-semibold transition ${
                  current === index
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : answered
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
                title={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span>
            <span className="inline-block w-3 h-3 rounded bg-indigo-600 mr-1" />
            Current
          </span>

          <span>
            <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300 mr-1" />
            Answered
          </span>

          <span>
            <span className="inline-block w-3 h-3 rounded bg-white border border-slate-300 mr-1" />
            Unanswered
          </span>
        </div>
      </div>

      {/* Question card */}
      <div className="card space-y-5">

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-indigo-600">
            Question {current + 1}
          </span>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
              {questionType === "mcq"
                ? "Multiple Choice"
                : questionType === "short"
                ? "Short Answer"
                : "Long Answer"}
            </span>

            <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              {q.topic || "General"}
            </span>
          </div>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold text-slate-800 leading-relaxed">
          {q.question}
        </h2>

        {/* MCQ */}
        {questionType === "mcq" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Select one correct option:
            </p>

            {q.options?.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => updateAnswer(index)}
                className={`w-full flex items-start gap-3 text-left px-4 py-3 rounded-xl border transition ${
                  answers[current] === index
                    ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                    : "border-slate-300 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${
                    answers[current] === index
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="pt-1">
                  {option}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Short answer */}
        {questionType === "short" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-600">
              Write your short answer:
            </label>

            <textarea
              value={answers[current]}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder="Write your answer here..."
              rows={4}
              maxLength={10000}
              className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />

            <p className="text-xs text-slate-400 text-right">
              {answers[current].length} / 10000 characters
            </p>
          </div>
        )}

        {/* Long answer */}
        {questionType === "long" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-600">
              Write your detailed answer:
            </label>

            <textarea
              value={answers[current]}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder="Explain your answer in detail..."
              rows={9}
              maxLength={10000}
              className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />

            <p className="text-xs text-slate-400 text-right">
              {answers[current].length} / 10000 characters
            </p>
          </div>
        )}

      </div>

      {/* Bottom navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">

        <button
          type="button"
          onClick={() => setCurrent((previous) => previous - 1)}
          disabled={current === 0 || submitting}
          className="btn-secondary disabled:opacity-50"
        >
          ← Previous
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrent((previous) => previous + 1)}
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            Next →
          </button>
        )}
      </div>

      {isLast && (
        <p className="text-center text-sm text-slate-500">
          {unansweredCount === 0
            ? "All questions answered. You can submit your quiz."
            : `${unansweredCount} question(s) still unanswered.`}
        </p>
      )}

    </div>
  );
}
