import { SORT_OPTIONS } from "../constants";

const GRID_ICON = "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z";
const LIST_ICON = "M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z";
const MENU_ICON = "M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z";

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d={path} />
    </svg>
  );
}

export default function TopBar({
  search,
  onSearch,
  sort,
  onSort,
  layout,
  onLayout,
  onAdd,
  onMenu,
}) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn menu-btn"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Icon path={MENU_ICON} />
      </button>

      <h1 className="brand">
        <span className="brand-mark" aria-hidden="true">
          N
        </span>
        NoteNest
      </h1>

      <input
        type="search"
        className="search"
        placeholder="Search by title, text or tag"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search notes"
      />

      <div className="topbar-controls">
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          aria-label="Sort notes"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="segmented" role="group" aria-label="Layout">
          <button
            type="button"
            className={layout === "grid" ? "active" : ""}
            aria-pressed={layout === "grid"}
            aria-label="Grid view"
            title="Grid view"
            onClick={() => onLayout("grid")}
          >
            <Icon path={GRID_ICON} />
          </button>
          <button
            type="button"
            className={layout === "list" ? "active" : ""}
            aria-pressed={layout === "list"}
            aria-label="List view"
            title="List view"
            onClick={() => onLayout("list")}
          >
            <Icon path={LIST_ICON} />
          </button>
        </div>

        <button type="button" className="btn btn-primary add-btn" onClick={onAdd} aria-label="Add note">
          <span aria-hidden="true">+</span>
          <span className="add-label" aria-hidden="true">
            {" "}
            Add note
          </span>
        </button>
      </div>
    </header>
  );
}