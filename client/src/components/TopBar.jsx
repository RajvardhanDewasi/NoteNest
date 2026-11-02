
import { SORT_OPTIONS } from "../constants";

const GRID_ICON = "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z";

const LIST_ICON = "M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z";

const MENU_ICON = "M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z";

const LOGOUT_ICON = "M10 17l5-5-5-5v3H3v4h7v3zm9-14H5a2 2 0 0 0-2 2v3h2V5h14v14H5v-3H3v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z";

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d={path} />
    </svg>
  );
}

function initials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
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
  user,
  onLogout,
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
        <span className="brand-mark" aria-hidden="true">N</span>
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

        <button
          type="button"
          className="btn btn-primary add-btn"
          onClick={onAdd}
          aria-label="Add note"
        >
          <span aria-hidden="true">+</span>
          <span className="add-label"> Add note</span>
        </button>

        <div className="account-actions">
          <span className="account-avatar" aria-hidden="true">
            {initials(user?.name || user?.email)}
          </span>

          <span className="account-name" title={user?.email}>
            {user?.name || user?.email}
          </span>

          <button
            type="button"
            className="account-logout"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <Icon path={LOGOUT_ICON} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
