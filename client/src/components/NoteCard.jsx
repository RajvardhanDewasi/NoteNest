import { htmlToText } from "../utils/helpers";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PinIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"
      />
    </svg>
  );
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
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
      <button
        type="button"
        className={`pin-btn ${note.isPinned ? "pinned" : ""}`}
        aria-pressed={Boolean(note.isPinned)}
        aria-label={`${note.isPinned ? "Unpin" : "Pin"} ${note.title}`}
        title={note.isPinned ? "Unpin" : "Pin to top"}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(note);
        }}
      >
        <PinIcon filled={note.isPinned} />
      </button>

      <div className="card-main">
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
      </div>

      <div className="card-side">
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
      </div>
    </article>
  );
}