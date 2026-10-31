import { useCallback, useEffect, useRef, useState } from "react";
import { getNotes, createNote, updateNote, deleteNote, restoreNote, errorMessage } from "./api";
import { CATEGORIES } from "./constants";
import NoteForm from "./components/NoteForm";
import NoteCard from "./components/NoteCard";
import EditModal from "./components/EditModal";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";

export default function App() {
  const savedPreferences = (() => {
    try { return JSON.parse(localStorage.getItem("notenest.preferences") || "{}"); } catch { return {}; }
  })();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(savedPreferences.categoryFilter || "All");
  const [sortOrder, setSortOrder] = useState(savedPreferences.sortOrder || "newest");
  const [view, setView] = useState(savedPreferences.view || "active");
  const [theme, setTheme] = useState(() => localStorage.getItem("notenest.theme") === "dark" ? "dark" : "light");
  const [showGuide, setShowGuide] = useState(() => localStorage.getItem("notenest.guideSeen") !== "true");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("notenest.preferences", JSON.stringify({ categoryFilter, sortOrder, view }));
  }, [categoryFilter, sortOrder, view]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("notenest.theme", theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.content = theme === "dark" ? "#151b16" : "#f7f8f6";
    });
  }, [theme]);

  function showToast(text, type = "success") {
    setToast({ text, type });
  }

  // Auto-hide toast after a few seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.action ? 8000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function handleKeys(event) {
      const target = event.target;
      const typing = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "Escape") {
        if (editing) setEditing(null);
        else if (deleting && !deleteBusy) setDeleting(null);
        else if (document.activeElement === searchRef.current && search) setSearch("");
      }
      if (!typing && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [editing, deleting, deleteBusy, search]);

  // Wait briefly after typing before searching
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getNotes(debouncedSearch, view);
      setNotes(data);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, view]);

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

  async function handlePin(note) {
    try {
      await updateNote(note._id, { ...note, pinned: !note.pinned });
      await loadNotes();
      showToast(note.pinned ? "Note unpinned." : "Note pinned.");
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  }

  async function handleArchive(note) {
    try {
      await updateNote(note._id, { ...note, archived: view !== "archive" });
      await loadNotes();
      showToast(view === "archive" ? "Note moved back to your notes." : "Note archived.");
    } catch (err) { showToast(errorMessage(err), "error"); }
  }

  async function handleRestore(note) {
    try {
      await restoreNote(note);
      await loadNotes();
      showToast("Note restored.");
    } catch (err) { showToast(errorMessage(err), "error"); }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      const { note } = await deleteNote(deleting._id);
      const wasInTrash = Boolean(deleting.deletedAt);
      setDeleting(null);
      await loadNotes();
      if (wasInTrash) {
        showToast("Note permanently deleted.");
      } else setToast({ text: "Note moved to Trash.", type: "success", action: async () => {
        try {
          await restoreNote(note);
          setToast({ text: "Note restored.", type: "success" });
          await loadNotes();
        } catch (err) {
          showToast(errorMessage(err), "error");
        }
      } });
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  const visibleNotes = (categoryFilter === "All" ? notes : notes.filter((n) => n.category === categoryFilter))
    .slice()
    .sort((a, b) => {
      if (view !== "trash" && Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      if (sortOrder === "title") return a.title.localeCompare(b.title);
      const dateDiff = new Date(a.updatedAt) - new Date(b.updatedAt);
      return sortOrder === "oldest" ? dateDiff : -dateDiff;
    });
  const isFiltering = debouncedSearch !== "" || categoryFilter !== "All" || view !== "active";
  const totalLabel = `${visibleNotes.length} ${visibleNotes.length === 1 ? "note" : "notes"}`;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 4.75h7.5L19 9.25v10A1.75 1.75 0 0 1 17.25 21h-10A1.75 1.75 0 0 1 5.5 19.25v-12A2.5 2.5 0 0 1 8 4.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M14 5v4.5h4.5M8.5 13h7M8.5 16.5h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></span>
          <h1 className="logo">NoteNest</h1>
        </div>
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <input
            type="search"
            className="search"
            ref={searchRef}
            placeholder="Search your notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notes"
            aria-describedby="search-hint"
          />
        </div>
        <span className="header-note" id="search-hint">Search · Ctrl K</span>
        <button className="theme-toggle" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "original" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "original" : "dark"} theme`}>
          {theme === "dark" ? <><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg><span>Original</span></> : <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.8 8.8 0 1 0 20.5 15.2Z"/></svg><span>Dark</span></>}
        </button>
      </header>

      <main className="main">
        <section className="intro">
          <p className="eyebrow">Your personal space</p>
          <h2>Good thoughts, gathered.</h2>
          <p>Keep the little things, big ideas, and everything in between.</p>
        </section>
        <NoteForm onCreate={handleCreate} onError={(m) => showToast(m, "error")} />

        {showGuide && (
          <aside className="first-use" aria-label="Quick start guide">
            <div><strong>A quick note about NoteNest</strong><p>Write a note, choose a category, then pin or archive it from its card. Deleted notes stay in Trash until you remove them permanently.</p></div>
            <button className="guide-dismiss" onClick={() => { localStorage.setItem("notenest.guideSeen", "true"); setShowGuide(false); }} aria-label="Dismiss getting started guide">×</button>
          </aside>
        )}

        <div className="workspace">
          <aside className="sidebar" aria-label="Note navigation">
            <p className="sidebar-label">Workspace</p>
            <nav className="sidebar-nav" aria-label="Views">
              {[{ id: "active", label: "All notes" }, { id: "pinned", label: "Pinned" }, { id: "archive", label: "Archive" }, { id: "trash", label: "Trash" }].map((item) => (
                <button key={item.id} className={`nav-item ${view === item.id ? "selected" : ""}`} aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)}><span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none">{item.id === "active" ? <><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/></> : item.id === "pinned" ? <><path d="m9 4 6 0 1 5 3 3v1H5v-1l3-3 1-5Z"/><path d="M12 13v7"/></> : item.id === "archive" ? <><path d="M4 7h16v13H4zM3 4h18v3H3z"/><path d="M9 11h6"/></> : <><path d="M4 7h16M10 11v6M14 11v6"/><path d="m6 7 1 13h10l1-13M9 7V4h6v3"/></>}</svg></span>{item.label}</button>
              ))}
            </nav>
            <p className="sidebar-label category-label">Categories</p>
            <nav className="sidebar-nav" aria-label="Categories">
              {["All", ...CATEGORIES].map((category) => (
                <button key={category} className={`nav-item ${categoryFilter === category ? "selected" : ""}`} aria-pressed={categoryFilter === category} onClick={() => setCategoryFilter(category)}><span className={`category-dot dot-${category.toLowerCase()}`} aria-hidden="true" />{category === "All" ? "All categories" : category}</button>
              ))}
            </nav>
            <div className="sidebar-tip"><span className="tip-spark" aria-hidden="true">✦</span><p><strong>A clear mind starts here.</strong><br />Keep your ideas in one calm place.</p></div>
          </aside>
          <section className="notes-area" aria-label="Notes">
            <div className="section-toolbar">
              <div><p className="eyebrow section-eyebrow">{view === "active" ? "Your space" : "Your library"}</p><h3 className="section-title">{view === "archive" ? "Archive" : view === "trash" ? "Trash" : view === "pinned" ? "Pinned notes" : "Your notes"} {!loading && !loadError && <span className="note-count">{totalLabel}</span>}</h3></div>
              <label className="sort-control"><span className="sort-label">Sort by</span><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Sort notes"><option value="newest">Last updated</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label>
            </div>

        {loading && <section className="grid" aria-label="Loading notes" aria-busy="true">{[0, 1, 2, 3, 4, 5].map((n) => <div className="skeleton-card" key={n}><span /><span /><span /></div>)}</section>}

        {!loading && loadError && (
          <div className="status error-box">
            <p>{loadError}</p>
            <button className="btn btn-primary" onClick={loadNotes}>Try again</button>
          </div>
        )}

        {!loading && !loadError && visibleNotes.length === 0 && (
          <div className="status empty">
            {!isFiltering && <div className="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 4.75h7.5L19 9.25v10A1.75 1.75 0 0 1 17.25 21h-10A1.75 1.75 0 0 1 5.5 19.25v-12A2.5 2.5 0 0 1 8 4.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 5v4.5h4.5M8.5 13h7M8.5 16.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></div>}
            <h2>{view === "trash" ? "Trash is empty" : view === "archive" ? "Nothing archived yet" : view === "pinned" ? "No pinned notes yet" : isFiltering ? "No matching notes" : "No notes yet"}</h2>
            <p>
              {view === "trash" ? "Deleted notes will appear here, where you can restore or remove them permanently." : view === "archive" ? "Archive notes to keep them without cluttering your main list." : view === "pinned" ? "Pin a note to keep it close at hand." : isFiltering
                ? "Try a different search or category."
                : "Click \u201CTake a note...\u201D above to write your first one."}
            </p>
          </div>
        )}

        {!loading && !loadError && visibleNotes.length > 0 && (
          <section className="grid">
            {visibleNotes.map((note) => (
              <NoteCard key={note._id} note={note} view={view} onEdit={setEditing} onDelete={setDeleting} onPin={handlePin} onArchive={handleArchive} onRestore={handleRestore} />
            ))}
          </section>
        )}
          </section>
        </div>
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
