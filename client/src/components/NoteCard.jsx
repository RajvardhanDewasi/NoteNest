function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NoteCard({ note, onEdit, onDelete }) {
  const edited = note.updatedAt !== note.createdAt;
  const preview =
    note.content.length > 180 ? note.content.slice(0, 180).trimEnd() + "..." : note.content;

  return (
    <article className="note-card" style={{ background: note.color }}>
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
        <button className="btn btn-small" onClick={() => onEdit(note)} aria-label={`Edit ${note.title}`}>
          Edit
        </button>
        <button
          className="btn btn-small btn-danger"
          onClick={() => onDelete(note)}
          aria-label={`Delete ${note.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
