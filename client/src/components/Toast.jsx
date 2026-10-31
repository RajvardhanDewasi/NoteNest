export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`} role="status">
      <span>{toast.text}</span>
      {toast.action && <button className="toast-action" onClick={toast.action}>Undo</button>}
      <button onClick={onClose} aria-label="Dismiss message">×</button>
    </div>
  );
}
