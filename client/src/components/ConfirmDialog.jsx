export default function ConfirmDialog({ note, onConfirm, onCancel, busy }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal confirm" onClick={(e) => e.stopPropagation()}>
        <h2>Delete this note?</h2>
        <p>
          &ldquo;{note.title}&rdquo; will be permanently deleted. This cannot be undone.
        </p>
        <div className="form-actions">
          <button className="btn btn-text" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : "Delete note"}
          </button>
        </div>
      </div>
    </div>
  );
}
