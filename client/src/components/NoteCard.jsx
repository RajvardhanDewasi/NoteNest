import { htmlToText } from "../utils/helpers";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NoteCard({ note, onEdit, onDelete }) {
  const edited = note.updatedAt !== note.createdAt;
  const isChecklist = note.noteType === "checklist";
  const items = note.checklistItems || [];
  const done = items.filter((item) => item.completed).length;
  const tags = note.tags || [];

  // content is HTML now, so show plain text in the card
  const text = note.plainText || htmlToText(note.content);
  const preview = text.length > 180 ? text.slice(0, 180).trimEnd() + "..." : text;

  return (
    <article className="note-card" style={{ background: note.color }} onClick={() => onEdit(note)}>
      <h3>{note.title}</h3>

      {isChecklist ? (
        <div className="card-checklist">
          <ul>
            {items.slice(0, 5).map((item, index) => (
              <li key={index} className={item.completed ? "done" : ""}>
                <span aria-hidden="true">{item.completed ? "\u2611" : "\u2610"}</span> {item.text}
              </li>
            ))}
          </ul>
          {items.length > 5 && <p className="more">+{items.length - 5} more</p>}
          {items.length > 0 && (
            <div className="checklist-progress">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.round((done / items.length) * 100)}%` }}
                />
              </div>
              <span>
                {done} of {items.length} done
              </span>
            </div>
          )}
        </div>
      ) : (
        preview && <p className="preview">{preview}</p>
      )}

      {tags.length > 0 && (
        <div className="hashtags">
          {tags.slice(0, 4).map((tag) => (
            <span className="hashtag" key={tag}>
              #{tag}
            </span>
          ))}
          {tags.length > 4 && <span className="hashtag">+{tags.length - 4}</span>}
        </div>
      )}

      <div className="card-meta">
        <span className="tag">{note.category}</span>
        <span className="date">
          {edited ? "Edited " : ""}
          {formatDate(note.updatedAt)}
        </span>
      </div>
      <div className="card-actions">
        <button
          className="btn btn-small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
          aria-label={`Edit ${note.title}`}
        >
          Edit
        </button>
        <button
          className="btn btn-small btn-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
          aria-label={`Delete ${note.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}