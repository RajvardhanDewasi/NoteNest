import { useState } from "react";
import ColorPicker from "./ColorPicker";
import { CATEGORIES } from "../constants";

export default function EditModal({ note, onSave, onClose, onError }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color);
  const [category, setCategory] = useState(note.category);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      onError("Title cannot be empty.");
      return;
    }
    setSaving(true);
    const ok = await onSave(note._id, { title: title.trim(), content: content.trim(), color, category });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        style={{ "--note-accent": color === "#ffffff" ? "#c7d6cb" : color }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="edit-title">Edit note</h2>
        <input
          type="text"
          className="title-input"
          value={title}
          maxLength={100}
          placeholder="Title"
          aria-label="Note title"
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          rows={7}
          value={content}
          maxLength={5000}
          placeholder="Description"
          aria-label="Note description"
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="form-row">
          <ColorPicker value={color} onChange={setColor} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-text" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
