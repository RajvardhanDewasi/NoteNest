import { useEffect, useRef } from "react";
import { makeUid } from "../utils/helpers";

// items: [{ uid, text, completed }]   (uid is only used by React as a key)
export default function ChecklistEditor({ items, onChange }) {
  const inputRefs = useRef({});
  const focusUid = useRef(null);

  // Move the cursor to a row we just added (or the row above a deleted one)
  useEffect(() => {
    if (focusUid.current) {
      const input = inputRefs.current[focusUid.current];
      if (input) input.focus();
      focusUid.current = null;
    }
  });

  // When a checklist is first created, start with the cursor in its empty row
  useEffect(() => {
    if (items.length === 1 && !items[0].text) {
      const input = inputRefs.current[items[0].uid];
      if (input) input.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filled = items.filter((item) => item.text.trim());
  const done = filled.filter((item) => item.completed).length;
  const percent = filled.length ? Math.round((done / filled.length) * 100) : 0;

  function updateItem(uid, changes) {
    onChange(items.map((item) => (item.uid === uid ? { ...item, ...changes } : item)));
  }

  function removeItem(uid) {
    onChange(items.filter((item) => item.uid !== uid));
  }

  // Add an empty row after the given row (or at the end when uid is null)
  function addItemAfter(uid) {
    const fresh = { uid: makeUid(), text: "", completed: false };
    focusUid.current = fresh.uid;
    if (uid === null) {
      onChange([...items, fresh]);
      return;
    }
    const next = [...items];
    next.splice(items.findIndex((item) => item.uid === uid) + 1, 0, fresh);
    onChange(next);
  }

  function handleKeyDown(event, item, index) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (item.text.trim()) addItemAfter(item.uid);
    }
    if (event.key === "Backspace" && item.text === "") {
      event.preventDefault();
      if (items[index - 1]) focusUid.current = items[index - 1].uid;
      removeItem(item.uid);
    }
  }

  return (
    <div className="checklist">
      {filled.length > 0 && (
        <div className="checklist-progress" aria-live="polite">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <span>
            {done} of {filled.length} done
          </span>
        </div>
      )}

      <ul className="checklist-items">
        {items.map((item, index) => (
          <li key={item.uid} className={item.completed ? "done" : ""}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(e) => updateItem(item.uid, { completed: e.target.checked })}
              aria-label="Mark item as done"
            />
            <input
              type="text"
              className="checklist-text"
              ref={(el) => {
                inputRefs.current[item.uid] = el;
              }}
              value={item.text}
              maxLength={300}
              placeholder="List item"
              onChange={(e) => updateItem(item.uid, { text: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, item, index)}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => removeItem(item.uid)}
              aria-label="Delete item"
              title="Delete item"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="btn btn-text add-item" onClick={() => addItemAfter(null)}>
        + Add item
      </button>
    </div>
  );
}