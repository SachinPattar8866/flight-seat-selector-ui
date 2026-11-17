export function LoadingState() {
  return (
    <div className="state-box" role="status">
      <div className="skeleton-cabin" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => <span key={i} />)}
      </div>
      <p>Loading the seat map…</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box" role="alert">
      <h2>The seat map didn’t load</h2>
      <p>{message} Check your connection and try again.</p>
      <button type="button" className="primary" onClick={onRetry}>Try again</button>
    </div>
  )
}

export function Toast({ notice, onDismiss }) {
  return (
    <div className="toast-region" aria-live="assertive">
      {notice && (
        <div key={notice.id} className={`toast ${notice.type}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={onDismiss} aria-label="Dismiss message">×</button>
        </div>
      )}
    </div>
  )
}
