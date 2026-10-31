import { useEffect, useState } from "react";
import ColorPicker from "./ColorPicker";
import { CATEGORIES } from "../constants";

export default function NoteForm({ onCreate, onError }) {
  const [draft] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notenest.draft") || "null"); } catch { return null; }
  });
  const [expanded, setExpanded] = useState(Boolean(draft));
  const [title, setTitle] = useState(draft?.title || "");
  const [content, setContent] = useState(draft?.content || "");
  const [color, setColor] = useState(draft?.color || "#ffffff");
  const [category, setCategory] = useState(draft?.category || "Personal");
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(Boolean(draft));

  useEffect(() => {
    if (!expanded || (!title.trim() && !content.trim())) return;
    setDraftSaved(false);
    const timer = setTimeout(() => {
      localStorage.setItem("notenest.draft", JSON.stringify({ title, content, color, category }));
      setDraftSaved(true);
    }, 450);
    return () => clearTimeout(timer);
  }, [expanded, title, content, color, category]);

  function reset() {
    setTitle("");
    setContent("");
    setColor("#ffffff");
    setCategory("Personal");
    setExpanded(false);
    localStorage.removeItem("notenest.draft");
    setDraftSaved(false);
  }

  function closeComposer() {
    setExpanded(false);
    if (title.trim() || content.trim()) {
      localStorage.setItem("notenest.draft", JSON.stringify({ title, content, color, category }));
      setDraftSaved(true);
    }
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
      <div className="note-form collapsed" onClick={() => setExpanded(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(true); } }}>
        <input type="text" placeholder={draft ? "Continue your saved draft..." : "Take a note..."} readOnly aria-label={draft ? "Continue saved note draft" : "Create a note"} />
      </div>
    );
  }

  return (
    <form className="note-form" style={{ "--note-accent": color === "#ffffff" ? "#c7d6cb" : color }} onSubmit={handleSubmit}>
      <input
        type="text"
        className="title-input"
        placeholder="Title"
        aria-label="Note title"
        value={title}
        maxLength={100}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Take a note..."
        aria-label="Note content"
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
        <span className="draft-status" role="status">{draftSaved ? "Draft saved on this device" : "Saving draft…"}</span>
        <button type="button" className="btn btn-text" onClick={closeComposer}>Close</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save note"}
        </button>
      </div>
    </form>
  );
}
