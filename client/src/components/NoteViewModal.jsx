import { countWords, htmlToText, legacyToHtml, sanitizeHtml } from "../utils/helpers";
import { useState } from "react";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatReminder(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function NoteViewModal({ note, onClose, onEdit, onDelete, onToggleChecklistItem }) {
  const [pendingIndex, setPendingIndex] = useState(null);
  const isChecklist = note.noteType === "checklist";
  const items = note.checklistItems || [];
  const bodyHtml = sanitizeHtml(legacyToHtml(note.content || ""));
  const bodyText = note.plainText || htmlToText(bodyHtml);
  const words = countWords(bodyText);
  const reminder = formatReminder(note.reminderAt);

  async function toggleItem(index) {
    if (pendingIndex !== null) return;
    setPendingIndex(index);
    try {
      await onToggleChecklistItem(note, index);
    } finally {
      setPendingIndex(null);
    }
  }

  return (
    <div
      className="modal-backdrop note-view-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal note-view-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-view-title"
        style={{ "--note-accent": note.color && note.color !== "#ffffff" ? note.color : "#c7d6cb" }}
      >
        <header className="note-view-header">
          <div className="note-view-meta">
            <span className="tag">{note.category}</span>
            <span>{formatDate(note.updatedAt || note.createdAt)}</span>
            {note.isPinned && <span className="note-view-pinned">Pinned</span>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close note" title="Close (Esc)">
            &times;
          </button>
        </header>

        <h2 id="note-view-title" className="note-view-title">{note.title}</h2>

        {isChecklist ? (
          <ul className="note-view-checklist">
            {items.map((item, index) => (
              <li className={item.completed ? "done" : ""} key={item._id || index}>
                <button
                  type="button"
                  className="checklist-view-toggle"
                  role="checkbox"
                  aria-checked={Boolean(item.completed)}
                  aria-label={`${item.completed ? "Mark unfinished" : "Mark finished"}: ${item.text}`}
                  disabled={pendingIndex !== null}
                  onClick={() => toggleItem(index)}
                >
                  <span aria-hidden="true">{item.completed ? "☑" : "☐"}</span>
                </button>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="note-view-body">
            {bodyText ? <div dangerouslySetInnerHTML={{ __html: bodyHtml }} /> : <p className="note-view-empty">No note content.</p>}
          </div>
        )}

        {note.tags?.length > 0 && (
          <div className="note-view-tags" aria-label="Tags">
            {note.tags.map((tag) => <span className="hashtag" key={tag}>#{tag}</span>)}
          </div>
        )}

        {reminder && <p className="note-view-reminder"><span aria-hidden="true">◷</span> Reminder · {reminder}</p>}

        <footer className="note-view-footer">
          <span role="status" aria-live="polite">{pendingIndex !== null ? "Saving checklist…" : bodyText ? `${words} ${words === 1 ? "word" : "words"}` : ""}</span>
          <div>
            <button type="button" className="btn btn-danger" onClick={() => onDelete(note)}>Delete</button>
            <button type="button" className="btn btn-primary" onClick={() => onEdit(note)}>Edit note</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
