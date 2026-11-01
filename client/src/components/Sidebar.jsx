
import { CATEGORIES } from "../constants";

const NOTES_ICON = "M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z";
const PIN_ICON =
  "M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z";
const TRASH_ICON =
  "M3 6h18v2H3V6zm2 3h14l-1 12H6L5 9zm4-6h6l1 2H8l1-2z";

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d={path} />
    </svg>
  );
}

function NavItem({ icon, label, count, active, onClick }) {
  return (
    <button
      type="button"
      className={`nav-item ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </button>
  );
}

// view: "all" | "pinned" | "trash"
export default function Sidebar({
  open,
  onClose,
  view,
  category,
  counts,
  onSelect,
}) {
  const numbers = counts || {};
  const perCategory = numbers.categories || {};

  // Include older categories that are no longer in the current category list.
  const extra = Object.keys(perCategory).filter(
    (name) => !CATEGORIES.includes(name) && perCategory[name] > 0
  );

  function pick(nextView, nextCategory) {
    onSelect(nextView, nextCategory);
    onClose();
  }

  return (
    <>
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Sidebar">
        <nav>
          <NavItem
            icon={<Icon path={NOTES_ICON} />}
            label="All Notes"
            count={numbers.all ?? 0}
            active={view === "all" && !category}
            onClick={() => pick("all", "")}
          />

          <NavItem
            icon={<Icon path={PIN_ICON} />}
            label="Pinned"
            count={numbers.pinned ?? 0}
            active={view === "pinned"}
            onClick={() => pick("pinned", "")}
          />

          <NavItem
            icon={<Icon path={TRASH_ICON} />}
            label="Trash"
            count={numbers.trash ?? 0}
            active={view === "trash"}
            onClick={() => pick("trash", "")}
          />

          <h2 className="nav-heading">Categories</h2>

          {[...CATEGORIES, ...extra].map((name) => (
            <NavItem
              key={name}
              icon={<span className="cat-dot" aria-hidden="true" />}
              label={name}
              count={perCategory[name] ?? 0}
              active={view === "all" && category === name}
              onClick={() => pick("all", name)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
