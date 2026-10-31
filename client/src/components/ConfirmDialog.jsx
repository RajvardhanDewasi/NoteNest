export default function ConfirmDialog({ note, onConfirm, onCancel, busy }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal confirm" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="delete-title">{note.deletedAt ? "Delete permanently?" : "Move to Trash?"}</h2>
        <p>
          {note.deletedAt ? <>&ldquo;{note.title}&rdquo; will be permanently deleted and cannot be recovered.</> : <>&ldquo;{note.title}&rdquo; will be moved to Trash. You can restore it or undo this action.</>}
        </p>
        <div className="form-actions">
          <button className="btn btn-text" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : note.deletedAt ? "Delete forever" : "Move to Trash"}
          </button>
        </div>
      </div>
    </div>
  );
}
