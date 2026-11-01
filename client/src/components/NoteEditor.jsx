import { useEffect, useMemo, useRef, useState } from "react";
import ColorPicker from "./ColorPicker";
import RichTextEditor from "./RichTextEditor";
import ChecklistEditor from "./ChecklistEditor";
import useAutosave from "../hooks/useAutosave";
import { CATEGORIES } from "../constants";
import {
  countWords,
  fromLocalInput,
  htmlToText,
  legacyToHtml,
  makeUid,
  toLocalInput,
} from "../utils/helpers";

const STATUS_TEXT = {
  idle: "Saves automatically",
  unsaved: "Unsaved changes...",
  saving: "Saving...",
  saved: "Saved",
  error: "Save failed",
  "needs-title": "Add a title to save",
};

// note = null  -> create a new note
// note = {...} -> edit that note
export default function NoteEditor({ note, onClose }) {
  const [title, setTitle] = useState(note ? note.title : "");
  const [html, setHtml] = useState(() => legacyToHtml(note ? note.content : ""));
  const [noteType, setNoteType] = useState(note ? note.noteType || "standard" : "standard");
  const [items, setItems] = useState(() =>
    ((note && note.checklistItems) || []).map((item) => ({
      uid: makeUid(),
      text: item.text,
      completed: Boolean(item.completed),
    }))
  );
  const [color, setColor] = useState(note ? note.color : "#ffffff");
  const [category, setCategory] = useState(note ? note.category : "Personal");
  const [tags, setTags] = useState(note ? note.tags || [] : []);
  const [tagInput, setTagInput] = useState("");
  const [tagMessage, setTagMessage] = useState("");
  const [reminder, setReminder] = useState(note ? note.reminderAt || null : null);
  const [closing, setClosing] = useState(false);

  const autosave = useAutosave(note);
  const baselineSet = useRef(false);

  // Everything that gets saved to MongoDB
  function buildPayload() {
    return {
      title: title.trim(),
      content: html,
      color,
      category,
      tags,
      noteType,
      checklistItems: items
        .filter((item) => item.text.trim())
        .map((item) => ({ text: item.text.trim(), completed: item.completed })),
      reminderAt: reminder,
    };
  }

  // Runs after every change. The first run only records how the note looked
  // when it was opened, so just opening a note never causes a save.
  useEffect(() => {
    const payload = buildPayload();
    if (!baselineSet.current) {
      baselineSet.current = true;
      if (note) autosave.setBaseline(payload);
      return;
    }
    autosave.queueSave(payload);
  }, [title, html, noteType, items, color, category, tags, reminder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Word and character count of the note body
  const bodyText = useMemo(
    () => (noteType === "checklist" ? items.map((i) => i.text).join(" ") : htmlToText(html)),
    [noteType, items, html]
  );
  const words = countWords(bodyText);
  const characters = bodyText.length;

  /* ---------- closing ---------- */

  async function handleClose() {
    if (closing) return;
    setClosing(true);
    const result = await autosave.flushNow();

    if (
      result === "blocked" &&
      !window.confirm("This note has no title, so it has not been saved. Close and discard it?")
    ) {
      setClosing(false);
      return;
    }
    if (
      result === "failed" &&
      !window.confirm("Your latest changes could not be saved. Close anyway and lose them?")
    ) {
      setClosing(false);
      return;
    }
    onClose();
  }

  // Escape closes the editor (the ref always points at the newest handleClose)
  const closeRef = useRef(handleClose);
  closeRef.current = handleClose;
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- checklist toggle ---------- */

  function toggleType(event) {
    const next = event.target.checked ? "checklist" : "standard";
    setNoteType(next);
    if (next === "checklist" && items.length === 0) {
      setItems([{ uid: makeUid(), text: "", completed: false }]);
    }
  }

  /* ---------- tags ---------- */

  // Add one or more tags. Duplicates (any capitalization) are rejected.
  function addTags(rawList) {
    const next = [...tags];
    let message = "";
    rawList.forEach((raw) => {
      const tag = raw.trim().replace(/^#+/, "").trim().slice(0, 24);
      if (!tag) return;
      if (next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        message = `"${tag}" is already added`;
        return;
      }
      if (next.length >= 12) {
        message = "A note can have up to 12 tags";
        return;
      }
      next.push(tag);
    });
    if (next.length !== tags.length) setTags(next);
    setTagMessage(message);
    setTagInput("");
  }

  function handleTagChange(event) {
    const value = event.target.value;
    if (value.includes(",")) {
      addTags(value.split(","));
    } else {
      setTagInput(value);
      setTagMessage("");
    }
  }

  function handleTagKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTags([tagInput]);
    }
    if (event.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  const categoryOptions = CATEGORIES.includes(category) ? CATEGORIES : [...CATEGORIES, category];

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        className="modal editor-modal"
        style={{ background: color }}
        role="dialog"
        aria-modal="true"
        aria-label={note ? "Edit note" : "New note"}
      >
        <div className="editor-top">
          <input
            type="text"
            className="title-input editor-title"
            value={title}
            maxLength={100}
            placeholder="Title"
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            aria-label="Close editor"
            title="Close (Esc)"
          >
            &times;
          </button>
        </div>

        <label className="type-toggle">
          <input type="checkbox" checked={noteType === "checklist"} onChange={toggleType} />
          Checklist
        </label>

        {noteType === "checklist" ? (
          <ChecklistEditor items={items} onChange={setItems} />
        ) : (
          <RichTextEditor initialHtml={html} onChange={setHtml} />
        )}

        <div className="meta-grid">
          <label className="field">
            <span>Category</span>
            <select
              className="field-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Reminder</span>
            <span className="reminder-row">
              <input
                type="datetime-local"
                className="field-input"
                value={toLocalInput(reminder)}
                onChange={(e) => setReminder(fromLocalInput(e.target.value))}
              />
              {reminder && (
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => setReminder(null)}
                >
                  Clear
                </button>
              )}
            </span>
          </label>
        </div>

        <div className="field">
          <span>Tags</span>
          <div className="tag-editor">
            {tags.map((tag) => (
              <span className="tag-chip" key={tag}>
                #{tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                >
                  &times;
                </button>
              </span>
            ))}
            <input
              type="text"
              className="field-input tag-input"
              value={tagInput}
              maxLength={24}
              placeholder={tags.length ? "Add tag" : "Type a tag, press Enter"}
              onChange={handleTagChange}
              onKeyDown={handleTagKeyDown}
              onBlur={() => addTags([tagInput])}
            />
          </div>
          {tagMessage && <span className="field-hint">{tagMessage}</span>}
        </div>

        <div className="field">
          <span>Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="editor-footer">
          <div className="editor-status" aria-live="polite">
            <span className={`save-state ${autosave.status}`}>{STATUS_TEXT[autosave.status]}</span>
            {autosave.status === "error" && (
              <>
                <span className="save-error">{autosave.errorText}</span>
                <button type="button" className="btn btn-small" onClick={() => autosave.retry()}>
                  Retry
                </button>
              </>
            )}
            <span className="counts">
              {words} {words === 1 ? "word" : "words"} &middot; {characters}{" "}
              {characters === 1 ? "character" : "characters"}
            </span>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleClose} disabled={closing}>
            {closing ? "Saving..." : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}