import { useCallback, useEffect, useState } from "react";
import { getNotes, createNote, updateNote, deleteNote, errorMessage } from "./api";
import { CATEGORIES } from "./constants";
import NoteForm from "./components/NoteForm";
import NoteCard from "./components/NoteCard";
import EditModal from "./components/EditModal";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);

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
    setLoading(true);
    setLoadError("");
    try {
      const data = await getNotes(debouncedSearch);
      setNotes(data);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  async function handleCreate(data) {
    try {
      await createNote(data);
      showToast("Note saved.");
      await loadNotes();
      return true;
    } catch (err) {
      showToast(errorMessage(err), "error");
      return false;
    }
  }

  async function handleUpdate(id, data) {
    try {
      await updateNote(id, data);
      showToast("Changes saved.");
      await loadNotes();
      return true;
    } catch (err) {
      showToast(errorMessage(err), "error");
      return false;
    }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await deleteNote(deleting._id);
      showToast("Note deleted.");
      setDeleting(null);
      await loadNotes();
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  const visibleNotes =
    categoryFilter === "All" ? notes : notes.filter((n) => n.category === categoryFilter);
  const isFiltering = debouncedSearch !== "" || categoryFilter !== "All";

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">NoteNest</h1>
        <input
          type="search"
          className="search"
          placeholder="Search notes by title or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search notes"
        />
      </header>

      <main className="main">
        <NoteForm onCreate={handleCreate} onError={(m) => showToast(m, "error")} />

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
            <button className="btn btn-primary" onClick={loadNotes}>Try again</button>
          </div>
        )}

        {!loading && !loadError && visibleNotes.length === 0 && (
          <div className="status empty">
            <h2>{isFiltering ? "No matching notes" : "No notes yet"}</h2>
            <p>
              {isFiltering
                ? "Try a different search or category."
                : "Click \u201CTake a note...\u201D above to write your first one."}
            </p>
          </div>
        )}

        {!loading && !loadError && visibleNotes.length > 0 && (
          <section className="grid">
            {visibleNotes.map((note) => (
              <NoteCard key={note._id} note={note} onEdit={setEditing} onDelete={setDeleting} />
            ))}
          </section>
        )}
      </main>

      {editing && (
        <EditModal
          note={editing}
          onSave={handleUpdate}
          onClose={() => setEditing(null)}
          onError={(m) => showToast(m, "error")}
        />
      )}

      {deleting && (
        <ConfirmDialog
          note={deleting}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
