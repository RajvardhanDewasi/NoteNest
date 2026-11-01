import { UPDATED_OPTIONS } from "../constants";

export default function FilterBar({
  categories,
  category,
  onCategory,
  tags,
  tag,
  onTag,
  updatedWithin,
  onUpdatedWithin,
  pinnedOnly,
  onPinnedOnly,
  showPinnedToggle,
  isFiltering,
  onClear,
}) {
  // Make sure the selected tag is always one of the options
  const tagOptions = tag && !tags.some((t) => t.toLowerCase() === tag.toLowerCase()) ? [...tags, tag] : tags;

  return (
    <div className="filter-bar">
      <div className="chip-row" role="group" aria-label="Filter by category">
        {["", ...categories].map((name) => (
          <button
            key={name || "all"}
            type="button"
            className={`chip ${category === name ? "active" : ""}`}
            aria-pressed={category === name}
            onClick={() => onCategory(name)}
          >
            {name || "All"}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <label>
          Tag
          <select
            className="filter-select"
            value={tag}
            onChange={(e) => onTag(e.target.value)}
            disabled={tagOptions.length === 0}
          >
            <option value="">{tagOptions.length === 0 ? "No tags yet" : "All tags"}</option>
            {tagOptions.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </label>

        <label>
          Updated
          <select
            className="filter-select"
            value={updatedWithin}
            onChange={(e) => onUpdatedWithin(e.target.value)}
          >
            {UPDATED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {showPinnedToggle && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={pinnedOnly}
              onChange={(e) => onPinnedOnly(e.target.checked)}
            />
            Pinned only
          </label>
        )}

        {isFiltering && (
          <button type="button" className="btn btn-small" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}