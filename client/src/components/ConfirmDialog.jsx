export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal confirm"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="form-actions">
          <button className="btn btn-text" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}