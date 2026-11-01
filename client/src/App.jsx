import { useCallback, useEffect, useRef, useState } from "react";
import { getNotes, deleteNote, errorMessage } from "./api";
import { CATEGORIES } from "./constants";
import NoteCard from "./components/NoteCard";
import NoteEditor from "./components/NoteEditor";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editor, setEditor] = useState(null); // null = closed, { note } = open (note null = new)
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const requestId = useRef(0);

  function showToast(text, type = "success") {
    setToast({ text, type });
  }

  // Auto-hide toast after a few seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Wait briefly after typing before searching
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadNotes = useCallback(async () => {
    // If a newer request starts, answers to older ones are ignored
    const id = ++requestId.current;
    setLoadError("");
    try {
      const data = await getNotes({
        search: debouncedSearch,
        category: categoryFilter === "All" ? "" : categoryFilter,
      });
      if (id !== requestId.current) return;
      setNotes(data);
    } catch (err) {
      if (id !== requestId.current) return;
      setLoadError(errorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [debouncedSearch, categoryFilter]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  function handleEditorClose() {
    setEditor(null);
    loadNotes(); // show whatever was created or changed
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await deleteNote(deleting._id);
      showToast("Note moved to Trash.");
      setDeleting(null);
      await loadNotes();
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  const isFiltering = debouncedSearch !== "" || categoryFilter !== "All";

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">NoteNest</h1>
        <input
          type="search"
          className="search"
          placeholder="Search notes by title, text or tag"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search notes"
        />
      </header>

      <main className="main">
        <div className="note-form collapsed" onClick={() => setEditor({ note: null })}>
          <input
            type="text"
            placeholder="Take a note..."
            readOnly
            aria-label="Create a note"
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditor({ note: null });
            }}
          />
        </div>

        <div className="filters">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={`chip ${categoryFilter === c ? "active" : ""}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && <p className="status">Loading notes...</p>}

        {!loading && loadError && (
          <div className="status error-box">
            <p>{loadError}</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setLoading(true);
                loadNotes();
              }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && notes.length === 0 && (
          <div className="status empty">
            <h2>{isFiltering ? "No matching notes" : "No notes yet"}</h2>
            <p>
              {isFiltering
                ? "Try a different search or category."
                : "Click \u201CTake a note...\u201D above to write your first one."}
            </p>
          </div>
        )}

        {!loading && !loadError && notes.length > 0 && (
          <section className="grid">
            {notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onEdit={(n) => setEditor({ note: n })}
                onDelete={setDeleting}
              />
            ))}
          </section>
        )}
      </main>

      {editor && (
        <NoteEditor
          key={editor.note ? editor.note._id : "new"}
          note={editor.note}
          onClose={handleEditorClose}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Move this note to Trash?"
          message={`\u201C${deleting.title}\u201D will be moved to Trash and deleted automatically after 30 days.`}
          confirmLabel="Move to Trash"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}