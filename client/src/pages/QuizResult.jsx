
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function QuizResult() {
  const { id } = useParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/attempts/${id}`);
      setResult(res.data.result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner text="Loading result..." />;

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!result) {
    return <ErrorState message="Result not found." onRetry={load} />;
  }

  const review = result.review || [];

  const weakTopics = [
    ...new Set(
      review
        .filter((item) => !item.isCorrect)
        .map((item) => item.topic || "General")
    ),
  ];

  const color =
    result.percent >= 80
      ? "text-green-600"
      : result.percent >= 50
      ? "text-amber-600"
      : "text-red-600";

  const correctCount = review.filter((item) => item.isCorrect).length;
  const incorrectCount = review.length - correctCount;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Result Summary */}
      <div className="card text-center space-y-3">
        <p className="text-slate-500 font-medium">
          Your Quiz Result
        </p>

        <p className={`text-5xl font-bold ${color}`}>
          {Number(result.score).toFixed(1)}/{result.total}
        </p>

        <p className={`text-2xl font-bold ${color}`}>
          {result.percent}%
        </p>

        <div className="flex justify-center flex-wrap gap-5 text-sm">
          <span className="text-green-600 font-medium">
            ✓ Correct: {correctCount}
          </span>

          <span className="text-red-600 font-medium">
            ✗ Incorrect: {incorrectCount}
          </span>
        </div>

        {weakTopics.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              Topics to Review
            </p>

            <p className="text-sm text-amber-700">
              {weakTopics.join(", ")}
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 pt-3">
          <Link
            to={`/quiz/${result.quizId}`}
            className="btn-primary"
          >
            Retake Quiz
          </Link>

          <Link
            to={`/notes/${result.noteId}`}
            className="btn-secondary"
          >
            Back to Note
          </Link>

          <Link
            to="/analytics"
            className="btn-secondary"
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Question Review */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Question Review
          </h2>

          <p className="text-sm text-slate-500">
            Check your answers and read the feedback.
          </p>
        </div>

        {review.map((item, index) => {
          const type = item.type || "mcq";
          const isMCQ = type === "mcq";

          const marks = Number(item.marks || 0);

          return (
            <div
              key={index}
              className={`card border-l-4 ${
                item.isCorrect
                  ? "border-l-green-500"
                  : "border-l-red-500"
              } space-y-4`}
            >
              {/* Question Header */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">
                  Question {index + 1}
                </span>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                    {type === "mcq"
                      ? "Multiple Choice"
                      : type === "short"
                      ? "Short Answer"
                      : "Long Answer"}
                  </span>

                  <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                    {item.topic || "General"}
                  </span>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      item.isCorrect
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.isCorrect ? "Correct" : "Needs Improvement"}
                  </span>
                </div>
              </div>

              {/* Question */}
              <h3 className="font-semibold text-slate-800">
                {item.question}
              </h3>

              {/* MCQ Review */}
              {isMCQ && (
                <div className="space-y-2">
                  {(item.options || []).map((option, optionIndex) => {
                    const isCorrect =
                      option === item.correctAnswer;

                    const isSelected =
                      optionIndex === item.selectedIndex;

                    let style =
                      "border-slate-200 bg-white";

                    if (isCorrect) {
                      style =
                        "border-green-500 bg-green-50";
                    } else if (isSelected) {
                      style =
                        "border-red-500 bg-red-50";
                    }

                    return (
                      <div
                        key={optionIndex}
                        className={`px-3 py-3 rounded-lg border text-sm ${style}`}
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <span>
                            <span className="font-semibold mr-2">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>

                            {option}
                          </span>

                          <span className="font-medium">
                            {isCorrect && (
                              <span className="text-green-700">
                                ✓ Correct Answer
                              </span>
                            )}

                            {isSelected && !isCorrect && (
                              <span className="text-red-700">
                                Your Answer
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {item.selectedIndex === -1 && (
                    <p className="text-sm text-red-600">
                      You did not answer this question.
                    </p>
                  )}
                </div>
              )}

              {/* Written Answer Review */}
              {!isMCQ && (
                <div className="space-y-3">

                  {/* Student Answer */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      YOUR ANSWER
                    </p>

                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {item.selectedAnswer &&
                      item.selectedAnswer !== "Not answered"
                        ? item.selectedAnswer
                        : "Not answered"}
                    </p>
                  </div>

                  {/* Correct / Model Answer */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-700 mb-2">
                      CORRECT / MODEL ANSWER
                    </p>

                    <p className="text-sm text-green-800 whitespace-pre-wrap">
                      {item.correctAnswer || "No model answer available."}
                    </p>
                  </div>

                  {/* AI Marks */}
                  <div className="flex items-center justify-between bg-indigo-50 rounded-lg p-3">
                    <span className="text-sm font-semibold text-indigo-800">
                      AI Evaluation
                    </span>

                    <span className="text-sm font-bold text-indigo-700">
                      {marks.toFixed(2)} / 1
                    </span>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {item.explanation && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">
                    EXPLANATION
                  </p>

                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {item.explanation}
                  </p>
                </div>
              )}

              {/* AI Feedback */}
              {item.feedback && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-700 mb-1">
                    FEEDBACK
                  </p>

                  <p className="text-sm text-purple-800 whitespace-pre-wrap">
                    {item.feedback}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
