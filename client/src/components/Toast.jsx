export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`} role="status">
      <span>{toast.text}</span>
      <button onClick={onClose} aria-label="Dismiss message">×</button>
    </div>
  );
}
