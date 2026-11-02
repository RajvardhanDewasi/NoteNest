
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotes,
  getCounts,
  getTags,
  deleteNote,
  pinNote,
  archiveNote,
  unarchiveNote,
  restoreNote,
  permanentDeleteNote,
  toggleChecklistItem,
  errorMessage,
} from "./api";
import { CATEGORIES, SORT_OPTIONS } from "./constants";
import usePersistentState from "./hooks/usePersistentState";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import FilterBar from "./components/FilterBar";
import NoteSection from "./components/NoteSection";
import NoteEditor from "./components/NoteEditor";
import NoteViewModal from "./components/NoteViewModal";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// "Work" and "work" are the same tag for filtering, so list it once.
function uniqueTags(tags) {
  const seen = new Set();
  return tags.filter((tag) => {
    const key = tag.toLowerCase();
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
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [loadError, setLoadError] = useState("");

  /* ---------- what the user is looking at ---------- */
  const [view, setView] = useState("all"); // "all" | "pinned" | "trash"
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [updatedWithin, setUpdatedWithin] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Remembered between visits.
  const [savedSort, setSort] = usePersistentState("notenest:sort", "updated");
  const [savedLayout, setLayout] = usePersistentState("notenest:layout", "grid");
  const sort = SORT_OPTIONS.some((option) => option.value === savedSort)
    ? savedSort
    : "updated";
  const layout = savedLayout === "list" ? "list" : "grid";

  /* ---------- screen state ---------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [permanentlyDeleting, setPermanentlyDeleting] = useState(null);
  const [permanentDeleteBusy, setPermanentDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const requestId = useRef(0);

  function showToast(text, type = "success") {
    setToast({ text, type });
  }

  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(
      () => setToast(null),
      toast.action ? 8000 : 3500
    );

    return () => clearTimeout(timeout);
  }, [toast]);

  // Global keyboard shortcuts and Escape handling.
  useEffect(() => {
    function handleKeys(event) {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "Escape") {
        if (editor) setEditor(null);
        else if (viewing) setViewing(null);
        else if (deleting && !deleteBusy) setDeleting(null);
        else if (permanentlyDeleting && !permanentDeleteBusy) {
          setPermanentlyDeleting(null);
        } else if (document.activeElement === searchRef.current && search) {
          setSearch("");
        }
      }

      if (!typing && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [
    editor,
    viewing,
    deleting,
    deleteBusy,
    permanentlyDeleting,
    permanentDeleteBusy,
    search,
  ]);

  // Wait briefly after typing before searching.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  /* ---------- loading ---------- */

  const loadNotes = useCallback(
    async (quiet = false) => {
      // Ignore responses from older requests if a newer request has started.
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

  // Sidebar counts and the list of tags.
  const loadMeta = useCallback(async () => {
    try {
      const [countData, tagData] = await Promise.all([getCounts(), getTags()]);
      setCounts(countData);
      setAllTags(uniqueTags(tagData));
    } catch {
      // The main notes list displays its own error if the server is unavailable.
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // If a selected tag no longer exists, stop filtering by it.
  useEffect(() => {
    if (
      tag &&
      !allTags.some((item) => item.toLowerCase() === tag.toLowerCase())
    ) {
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
    refreshAll();
  }

  async function handleTogglePin(note) {
    const wantPinned = !note.isPinned;

    try {
      const updated = await pinNote(note._id, wantPinned);

      setNotes((previous) =>
        previous.map((item) => (item._id === updated._id ? updated : item))
      );

      showToast(updated.isPinned ? "Note pinned." : "Note unpinned.");
      refreshAll();
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  }

  async function handleToggleChecklistItem(note, index) {
    const optimisticItems = note.checklistItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, completed: !item.completed } : item
    );
    setViewing((current) => current?._id === note._id ? { ...current, checklistItems: optimisticItems } : current);

    try {
      const updated = await toggleChecklistItem(note._id, index);
      setViewing((current) => current?._id === updated._id ? updated : current);
      setNotes((current) => current.map((item) => item._id === updated._id ? updated : item));
      return true;
    } catch (err) {
      setViewing((current) => current?._id === note._id ? { ...current, checklistItems: note.checklistItems } : current);
      showToast(errorMessage(err), "error");
      return false;
    }
  }

  // Kept available for the archive action used elsewhere in the app.
  async function handleArchive(note) {
    try {
      if (view === "archive") await unarchiveNote(note._id);
      else await archiveNote(note._id);

      refreshAll();
      showToast(
        view === "archive"
          ? "Note moved back to your notes."
          : "Note archived."
      );
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  }

  async function handleRestore(note) {
    try {
      await restoreNote(note._id);
      showToast("Note restored to All Notes.");
      refreshAll();
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  }

  async function handleDelete() {
    if (!deleting) return;

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

  async function handlePermanentDelete() {
    if (!permanentlyDeleting) return;

    setPermanentDeleteBusy(true);

    try {
      await permanentDeleteNote(permanentlyDeleting._id);
      setPermanentlyDeleting(null);
      showToast("Note permanently deleted.");
      refreshAll();
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setPermanentDeleteBusy(false);
    }
  }

  function handleNavSelect(nextView, nextCategory = "") {
    setView(nextView);
    setCategory(nextCategory);
    setTag("");
    setPinnedOnly(false);
    setUpdatedWithin("");

    // Keep the search term so it can search within the newly selected view.
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
    debouncedSearch !== "" ||
    category !== "" ||
    tag !== "" ||
    pinnedOnly ||
    updatedWithin !== "";

  const pinnedNotes = notes.filter((note) => note.isPinned);
  const otherNotes = notes.filter((note) => !note.isPinned);

  // Pinned notes get their own section above the rest on the main dashboard.
  const splitSections =
    view === "all" && !pinnedOnly && pinnedNotes.length > 0;

  const sectionProps = {
    layout,
    dim: fetching,
    isTrash: view === "trash",
    onView: setViewing,
    onEdit: (note) => setEditor({ note }),
    onDelete: setDeleting,
    onTogglePin: handleTogglePin,
    onRestore: handleRestore,
    onPermanentDelete: setPermanentlyDeleting,
  };

  let singleTitle = "All notes";

  if (view === "trash") singleTitle = "Trash";
  else if (view === "pinned") singleTitle = "Pinned notes";
  else if (isFiltering) singleTitle = "Results";

  let emptyTitle = "No notes yet";
  let emptyText = "Click ‘Take a note’ to write your first one.";

  if (view === "trash") {
    emptyTitle = isFiltering
      ? "No matching deleted notes"
      : "Your Trash is empty";

    emptyText = isFiltering
      ? "Try another search or clear the search field."
      : "Notes you delete will stay here for 30 days before being permanently deleted.";
  } else if (isFiltering) {
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
                  ? `You have ${counts.all} ${
                      counts.all === 1 ? "note" : "notes"
                    }, ${counts.pinned} pinned.`
                  : "Welcome to NoteNest."}
              </p>
            </section>
          )}

          {view === "trash" && (
            <section
              className="trash-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "26px",
                padding: "22px 26px",
                border: "1px solid var(--line)",
                borderRadius: "18px",
                background: "var(--line)",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 5px", fontSize: "1.45rem" }}>
                  Trash
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "var(--muted)",
                    fontSize: ".9rem",
                  }}
                >
                  Deleted notes are kept for 30 days before permanent deletion.
                </p>
              </div>

              <span
                className="trash-total"
                style={{
                  flexShrink: 0,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "var(--bg)",
                  color: "var(--muted)",
                  fontSize: ".82rem",
                  fontWeight: 700,
                }}
              >
                {counts?.trash ?? notes.length}{" "}
                {counts?.trash === 1 ? "item" : "items"}
              </span>
            </section>
          )}

          {view !== "trash" && (
            <div
              className="note-form collapsed"
              onClick={() => setEditor({ note: null })}
            >
              <input
                type="text"
                placeholder="Take a note..."
                readOnly
                aria-label="Create a note"
                onKeyDown={(event) => {
                  if (event.key === "Enter") setEditor({ note: null });
                }}
              />
            </div>
          )}

          {view !== "trash" && (
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
          )}

          {loading && <p className="status">Loading notes...</p>}

          {!loading && loadError && (
            <div className="status error-box">
              <p>{loadError}</p>

              <button
                type="button"
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
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!loading && !loadError && notes.length > 0 && splitSections && (
            <>
              <NoteSection
                title="Pinned"
                notes={pinnedNotes}
                {...sectionProps}
              />

              {otherNotes.length > 0 && (
                <NoteSection
                  title="Others"
                  notes={otherNotes}
                  {...sectionProps}
                />
              )}
            </>
          )}

          {!loading && !loadError && notes.length > 0 && !splitSections && (
            <NoteSection title={singleTitle} notes={notes} {...sectionProps} />
          )}
        </main>
      </div>

      {viewing && (
        <NoteViewModal
          note={viewing}
          onClose={() => setViewing(null)}
          onToggleChecklistItem={handleToggleChecklistItem}
          onDelete={(note) => {
            setViewing(null);
            setDeleting(note);
          }}
          onEdit={(note) => {
            setViewing(null);
            setEditor({ note });
          }}
        />
      )}

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
          message={`“${deleting.title}” will be moved to Trash and deleted automatically after 30 days.`}
          confirmLabel="Move to Trash"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => {
            if (!deleteBusy) setDeleting(null);
          }}
        />
      )}

      {permanentlyDeleting && (
        <ConfirmDialog
          title="Delete permanently?"
          message={`“${permanentlyDeleting.title}” will be permanently deleted. This action cannot be undone.`}
          confirmLabel="Delete permanently"
          busy={permanentDeleteBusy}
          onConfirm={handlePermanentDelete}
          onCancel={() => {
            if (!permanentDeleteBusy) setPermanentlyDeleting(null);
          }}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
