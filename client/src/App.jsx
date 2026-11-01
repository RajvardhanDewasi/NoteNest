import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotes,
  getCounts,
  getTags,
  deleteNote,
  pinNote,
  errorMessage,
} from "./api";
import { CATEGORIES, SORT_OPTIONS } from "./constants";
import usePersistentState from "./hooks/usePersistentState";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import FilterBar from "./components/FilterBar";
import NoteSection from "./components/NoteSection";
import NoteEditor from "./components/NoteEditor";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// "Work" and "work" are the same tag for filtering, so list it once
function uniqueTags(tags) {
  const seen = new Set();
  return tags.filter((t) => {
    const key = t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function App() {
  /* ---------- data from the server ---------- */
  const [notes, setNotes] = useState([]);
  const [counts, setCounts] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true); // first load only
  const [fetching, setFetching] = useState(false); // later reloads (dims the list)
  const [loadError, setLoadError] = useState("");

  /* ---------- what the user is looking at ---------- */
  const [view, setView] = useState("all"); // "all" | "pinned"
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [updatedWithin, setUpdatedWithin] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Remembered between visits
  const [savedSort, setSort] = usePersistentState("notenest:sort", "updated");
  const [savedLayout, setLayout] = usePersistentState("notenest:layout", "grid");
  const sort = SORT_OPTIONS.some((o) => o.value === savedSort) ? savedSort : "updated";
  const layout = savedLayout === "list" ? "list" : "grid";

  /* ---------- screen state ---------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef(null);
  const [editor, setEditor] = useState(null); // null = closed, { note } = open (note null = new)
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const requestId = useRef(0);

  function showToast(text, type = "success") {
    setToast({ text, type });
  }

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
        if (editor) setEditor(null);
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
  }, [editor, deleting, deleteBusy, search]);

  // Wait briefly after typing before searching
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------- loading ---------- */

  // quiet = true reloads without dimming the list (used after pin, edit, delete)
  const loadNotes = useCallback(
    async (quiet = false) => {
      // If a newer request starts, answers to older ones are ignored
      const id = ++requestId.current;
      setLoadError("");
      if (!quiet) setFetching(true);
      try {
        const data = await getNotes({
          view,
          search: debouncedSearch,
          category,
          tag,
          pinned: pinnedOnly,
          updatedWithin,
          sort,
        });
        if (id !== requestId.current) return;
        setNotes(data);
      } catch (err) {
        if (id !== requestId.current) return;
        setLoadError(errorMessage(err));
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setFetching(false);
        }
      }
    },
    [view, debouncedSearch, category, tag, pinnedOnly, updatedWithin, sort]
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Sidebar numbers and the list of tags
  const loadMeta = useCallback(async () => {
    try {
      const [countData, tagData] = await Promise.all([getCounts(), getTags()]);
      setCounts(countData);
      setAllTags(uniqueTags(tagData));
    } catch {
      // These are extras. The main list shows its own error if the server is down.
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // If the selected tag no longer exists on any note, stop filtering by it
  useEffect(() => {
    if (tag && !allTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setTag("");
    }
  }, [allTags]); // eslint-disable-line react-hooks/exhaustive-deps

  function refreshAll() {
    loadNotes(true);
    loadMeta();
  }

  /* ---------- actions ---------- */

  function handleEditorClose() {
    setEditor(null);
    refreshAll(); // show whatever was created or changed
  }

  async function handleTogglePin(note) {
    const wantPinned = !note.isPinned;
    try {
      const updated = await pinNote(note._id, wantPinned);
      // Update the card straight away, then fetch the properly ordered list
      setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
      showToast(updated.isPinned ? "Note pinned." : "Note unpinned.");
      refreshAll();
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  }

  async function handlePin(note) {
    try {
      await pinNote(note._id, !note.isPinned);
      await loadNotes();
      showToast(note.isPinned ? "Note unpinned." : "Note pinned.");
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  }

  async function handleArchive(note) {
    try {
      if (view === "archive") await unarchiveNote(note._id);
      else await archiveNote(note._id);
      await loadNotes();
      showToast(view === "archive" ? "Note moved back to your notes." : "Note archived.");
    } catch (err) { showToast(errorMessage(err), "error"); }
  }

  async function handleRestore(note) {
    try {
      await restoreNote(note._id);
      await loadNotes();
      showToast("Note restored.");
    } catch (err) { showToast(errorMessage(err), "error"); }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await deleteNote(deleting._id);
      showToast("Note moved to Trash.");
      setDeleting(null);
      refreshAll();
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  function handleNavSelect(nextView, nextCategory) {
    setView(nextView);
    setCategory(nextCategory);
    setPinnedOnly(false);
  }

  function clearFilters() {
    setCategory("");
    setTag("");
    setPinnedOnly(false);
    setUpdatedWithin("");
    setSearch("");
    setDebouncedSearch("");
  }

  /* ---------- what to show ---------- */

  const isFiltering =
    debouncedSearch !== "" || category !== "" || tag !== "" || pinnedOnly || updatedWithin !== "";

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);
  // On the main list, pinned notes get their own section above the rest
  const splitSections = view === "all" && !pinnedOnly && pinnedNotes.length > 0;

  const sectionProps = {
    layout,
    dim: fetching,
    onEdit: (note) => setEditor({ note }),
    onDelete: setDeleting,
    onTogglePin: handleTogglePin,
  };

  let singleTitle = "All notes";
  if (view === "pinned") singleTitle = "Pinned notes";
  else if (isFiltering) singleTitle = "Results";

  let emptyTitle = "No notes yet";
  let emptyText = "Click \u201CAdd note\u201D to write your first one.";
  if (isFiltering) {
    emptyTitle = "No matching notes";
    emptyText = "Try a different search or filter.";
  } else if (view === "pinned") {
    emptyTitle = "No pinned notes";
    emptyText = "Click the pin icon on a note to keep it at the top.";
  }

  const showWelcome = view === "all" && !isFiltering;

  return (
    <div className="app-shell">
      <TopBar
        search={search}
        onSearch={setSearch}
        sort={sort}
        onSort={setSort}
        layout={layout}
        onLayout={setLayout}
        onAdd={() => setEditor({ note: null })}
        onMenu={() => setSidebarOpen(true)}
      />

      <div className="shell">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          view={view}
          category={category}
          counts={counts}
          onSelect={handleNavSelect}
        />

        <main className="content">
          {showWelcome && (
            <section className="welcome">
              <h2>{greeting()}</h2>
              <p>
                {counts
                  ? `You have ${counts.all} ${counts.all === 1 ? "note" : "notes"}, ${counts.pinned} pinned.`
                  : "Welcome to NoteNest."}
              </p>
            </section>
          )}

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

          <FilterBar
            categories={CATEGORIES}
            category={category}
            onCategory={setCategory}
            tags={allTags}
            tag={tag}
            onTag={setTag}
            updatedWithin={updatedWithin}
            onUpdatedWithin={setUpdatedWithin}
            pinnedOnly={pinnedOnly}
            onPinnedOnly={setPinnedOnly}
            showPinnedToggle={view === "all"}
            isFiltering={isFiltering}
            onClear={clearFilters}
          />

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
              <h2>{emptyTitle}</h2>
              <p>{emptyText}</p>
              {isFiltering && (
                <button className="btn btn-primary" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!loading && !loadError && notes.length > 0 && splitSections && (
            <>
              <NoteSection title="Pinned" notes={pinnedNotes} {...sectionProps} />
              {otherNotes.length > 0 && (
                <NoteSection title="Others" notes={otherNotes} {...sectionProps} />
              )}
            </>
          )}

          {!loading && !loadError && notes.length > 0 && !splitSections && (
            <NoteSection title={singleTitle} notes={notes} {...sectionProps} />
          )}
        </main>
      </div>

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