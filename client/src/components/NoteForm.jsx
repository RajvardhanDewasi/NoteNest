import { useState } from "react";
import ColorPicker from "./ColorPicker";
import { CATEGORIES } from "../constants";

export default function NoteForm({ onCreate, onError }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [category, setCategory] = useState("Personal");
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle("");
    setContent("");
    setColor("#ffffff");
    setCategory("Personal");
    setExpanded(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      onError("Please enter a title for your note.");
      return;
    }
    setSaving(true);
    const ok = await onCreate({ title: title.trim(), content: content.trim(), color, category });
    setSaving(false);
    if (ok) reset();
  }

  if (!expanded) {
    return (
      <div className="note-form collapsed" onClick={() => setExpanded(true)}>
        <input type="text" placeholder="Take a note..." readOnly aria-label="Create a note" />
      </div>
    );
  }

  return (
    <form className="note-form" style={{ background: color }} onSubmit={handleSubmit}>
      <input
        type="text"
        className="title-input"
        placeholder="Title"
        value={title}
        maxLength={100}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Take a note..."
        rows={4}
        value={content}
        maxLength={5000}
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
        <button type="button" className="btn btn-text" onClick={reset}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save note"}
        </button>
      </div>
    </form>
  );
}
