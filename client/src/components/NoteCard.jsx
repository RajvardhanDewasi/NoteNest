
import { htmlToText } from "../utils/helpers";

function formatDate(iso) {
  if (!iso) return "Unknown date";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString(undefined, {
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

export default function NoteCard({
  note,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
  isTrash = false,
  onRestore,
  onPermanentDelete,
}) {
  const edited = note.updatedAt !== note.createdAt;
  const isChecklist = note.noteType === "checklist";
  const items = note.checklistItems || [];
  const done = items.filter((item) => item.completed).length;
  const tags = note.tags || [];

  // Content is HTML, so display plain text in the card preview.
  const text = note.plainText || htmlToText(note.content);
  const preview =
    text.length > 180 ? `${text.slice(0, 180).trimEnd()}...` : text;

  function openNote() {
    if (!isTrash) onView(note);
  }

  return (
    <article
      className={`note-card ${isTrash ? "trash-card" : ""}`}
      style={{
        "--note-card-color": note.color || "#ffffff",
        "--note-accent":
          note.color && note.color !== "#ffffff"
            ? note.color
            : "#c7d6cb",
        cursor: isTrash ? "default" : "pointer",
      }}
      onClick={openNote}
      tabIndex={isTrash ? undefined : 0}
      aria-label={isTrash ? undefined : `Open ${note.title}`}
      onKeyDown={(event) => {
        if (!isTrash && event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openNote();
        }
      }}
    >
      {!isTrash && (
        <button
          type="button"
          className={`pin-btn ${note.isPinned ? "pinned" : ""}`}
          aria-pressed={Boolean(note.isPinned)}
          aria-label={`${note.isPinned ? "Unpin" : "Pin"} ${note.title}`}
          title={note.isPinned ? "Unpin" : "Pin to top"}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(note);
          }}
        >
          <PinIcon filled={note.isPinned} />
        </button>
      )}

      <div className="card-main">
        <h3>{note.title}</h3>

        {isChecklist ? (
          <div className="card-checklist">
            <ul>
              {items.slice(0, 5).map((item, index) => (
                <li key={index} className={item.completed ? "done" : ""}>
                  <span aria-hidden="true">
                    {item.completed ? "\u2611" : "\u2610"}
                  </span>{" "}
                  {item.text}
                </li>
              ))}
            </ul>

            {items.length > 5 && (
              <p className="more">+{items.length - 5} more</p>
            )}

            {items.length > 0 && (
              <div className="checklist-progress">
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.round((done / items.length) * 100)}%`,
                    }}
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

            {tags.length > 4 && (
              <span className="hashtag">+{tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      <div className="card-side">
        <div className="card-meta">
          <span className="tag">{note.category}</span>

          <span className="date">
            {isTrash
              ? `Deleted ${formatDate(note.deletedAt || note.updatedAt)}`
              : `${edited ? "Edited " : ""}${formatDate(note.updatedAt)}`}
          </span>
        </div>

        <div
          className={`card-actions ${isTrash ? "trash-card-actions" : ""}`}
          style={isTrash ? { opacity: 1, transform: "none" } : undefined}
        >
          {isTrash ? (
            <>
              <button
                type="button"
                className="btn btn-small"
                onClick={(event) => {
                  event.stopPropagation();
                  onRestore(note);
                }}
                aria-label={`Restore ${note.title}`}
              >
                Restore
              </button>

              <button
                type="button"
                className="btn btn-small btn-danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onPermanentDelete(note);
                }}
                aria-label={`Permanently delete ${note.title}`}
              >
                Delete permanently
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-small"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(note);
                }}
                aria-label={`Edit ${note.title}`}
              >
                Edit
              </button>

              <button
                type="button"
                className="btn btn-small btn-danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(note);
                }}
                aria-label={`Delete ${note.title}`}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
