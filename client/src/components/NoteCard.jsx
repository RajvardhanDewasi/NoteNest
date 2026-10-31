function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NoteCard({ note, view = "active", onEdit, onDelete, onPin, onArchive, onRestore }) {
  const edited = note.updatedAt !== note.createdAt;
  const content = note.content || "";
  const preview = content.length > 180 ? content.slice(0, 180).trimEnd() + "..." : content;

  return (
    <article className="note-card" style={{ "--note-accent": note.color === "#ffffff" ? "#c7d6cb" : note.color }}>
      <h3>{note.title}</h3>
      {preview && <p className="preview">{preview}</p>}
      <div className="card-meta">
        <span className="tag">{note.category}</span>
        <span className="date">
          {edited ? "Edited " : ""}
          {formatDate(note.updatedAt)}
        </span>
      </div>
      <div className="card-actions">
        {view === "trash" ? <>
          <button className="btn btn-small" onClick={() => onRestore(note)} aria-label={`Restore ${note.title}`}>Restore</button>
          <button className="btn btn-small btn-danger" onClick={() => onDelete(note)} aria-label={`Delete ${note.title} permanently`}>Delete forever</button>
        </> : <>
          <button className={`btn btn-small ${note.pinned ? "pin-active" : ""}`} onClick={() => onPin(note)} aria-label={`${note.pinned ? "Unpin" : "Pin"} ${note.title}`} aria-pressed={Boolean(note.pinned)}>{note.pinned ? "Pinned" : "Pin"}</button>
          <button className="btn btn-small" onClick={() => onEdit(note)} aria-label={`Edit ${note.title}`}>Edit</button>
          <button className="btn btn-small" onClick={() => onArchive(note)} aria-label={`${view === "archive" ? "Unarchive" : "Archive"} ${note.title}`}>{view === "archive" ? "Unarchive" : "Archive"}</button>
          <button className="btn btn-small btn-danger" onClick={() => onDelete(note)} aria-label={`Move ${note.title} to trash`}>Delete</button>
        </>}
      </div>
    </article>
  );
}
