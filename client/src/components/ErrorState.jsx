export default function ErrorState({ message, onRetry }) {
  return (
    <div className="card text-center py-10 border-red-200 bg-red-50">
      <div className="text-4xl mb-2">⚠️</div>
      <p className="text-red-700 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  );
}
