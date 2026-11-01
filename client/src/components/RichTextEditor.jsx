
import { useEffect, useRef, useState } from "react";
import { sanitizeHtml } from "../utils/helpers";

// Detect the current paragraph or heading.
function currentBlock(root) {
  const selection = window.getSelection();
  let node = selection ? selection.anchorNode : null;

  while (node && node !== root) {
    if (
      node.nodeType === 1 &&
      /^(H1|H2|H3|P|DIV|LI)$/.test(node.nodeName)
    ) {
      return node.nodeName.toLowerCase();
    }
    node = node.parentNode;
  }

  return "";
}

// Check that the current selection belongs to this editor.
function selectionIsInside(root, selection) {
  return Boolean(
    root &&
    selection &&
    selection.rangeCount > 0 &&
    selection.anchorNode &&
    root.contains(selection.anchorNode)
  );
}

// Toolbar button. Preserve the editor selection on mouse click.
function Tool({ label, title, isActive, onClick, children }) {
  return (
    <button
      type="button"
      className={`tool ${isActive ? "active" : ""}`}
      aria-label={label}
      aria-pressed={Boolean(isActive)}
      title={title || label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ initialHtml, onChange }) {
  const editorRef = useRef(null);

  const [isEmpty, setIsEmpty] = useState(true);
  const [active, setActive] = useState({});

  // Refresh toolbar indicators from the actual browser selection.
  function refreshActive() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!selectionIsInside(editor, selection)) return;

    const next = {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
      block: currentBlock(editor),
    };

    setActive((previous) =>
      JSON.stringify(previous) === JSON.stringify(next)
        ? previous
        : next
    );
  }

  // Load saved note content.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.innerHTML = sanitizeHtml(initialHtml);

    setIsEmpty(
      !editor.textContent.trim() &&
      !editor.querySelector("li")
    );

    // Use semantic HTML tags such as <b>, <i> and <u>.
    document.execCommand("styleWithCSS", false, false);
    document.execCommand(
      "defaultParagraphSeparator",
      false,
      "p"
    );
  }, []);

  // Watch selection changes to update toolbar buttons.
  useEffect(() => {
    document.addEventListener("selectionchange", refreshActive);

    return () => {
      document.removeEventListener(
        "selectionchange",
        refreshActive
      );
    };
  }, []);

  // Save editor contents to the parent component.
  function emit() {
    const editor = editorRef.current;
    if (!editor) return;

    const hasText = Boolean(editor.textContent.trim());
    const hasList = Boolean(editor.querySelector("li"));

    setIsEmpty(!hasText && !hasList);

    onChange(
      hasText || hasList
        ? sanitizeHtml(editor.innerHTML)
        : ""
    );
  }

  // Execute a native formatting command.
  function run(command, value = null) {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    // Keep formatting as semantic HTML, not inline CSS.
    document.execCommand("styleWithCSS", false, false);

    // Execute only the requested command.
    document.execCommand(command, false, value);

    emit();
    refreshActive();

    requestAnimationFrame(refreshActive);
  }

  // Toggle paragraph or heading.
  function toggleHeading(tag) {
    const alreadyActive =
      currentBlock(editorRef.current) === tag;

    run(
      "formatBlock",
      alreadyActive ? "<p>" : `<${tag}>`
    );
  }

  // Keyboard shortcuts.
  function handleKeyDown(event) {
    if (!(event.ctrlKey || event.metaKey)) return;

    const key = event.key.toLowerCase();

    const shortcuts = {
      b: "bold",
      i: "italic",
      u: "underline",
    };

    if (shortcuts[key]) {
      event.preventDefault();
      run(shortcuts[key]);
    }
  }

  // Paste plain text only.
  function handlePaste(event) {
    event.preventDefault();

    const text = event.clipboardData.getData("text/plain");
    const editor = editorRef.current;

    if (!editor) return;

    editor.focus();
    document.execCommand("insertText", false, text);

    emit();
    refreshActive();
  }

  return (
    <div className="rte-wrap">
      <div
        className="toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        <Tool
          label="Bold"
          title="Bold (Ctrl+B)"
          isActive={active.bold}
          onClick={() => run("bold")}
        >
          <b>B</b>
        </Tool>

        <Tool
          label="Italic"
          title="Italic (Ctrl+I)"
          isActive={active.italic}
          onClick={() => run("italic")}
        >
          <i>I</i>
        </Tool>

        <Tool
          label="Underline"
          title="Underline (Ctrl+U)"
          isActive={active.underline}
          onClick={() => run("underline")}
        >
          <u>U</u>
        </Tool>

        <span className="tool-divider" />

        <Tool
          label="Heading 1"
          isActive={active.block === "h1"}
          onClick={() => toggleHeading("h1")}
        >
          H1
        </Tool>

        <Tool
          label="Heading 2"
          isActive={active.block === "h2"}
          onClick={() => toggleHeading("h2")}
        >
          H2
        </Tool>

        <span className="tool-divider" />

        <Tool
          label="Bullet list"
          isActive={active.ul}
          onClick={() => run("insertUnorderedList")}
        >
          &bull; List
        </Tool>

        <Tool
          label="Numbered list"
          isActive={active.ol}
          onClick={() => run("insertOrderedList")}
        >
          1. List
        </Tool>
      </div>

      <div
        ref={editorRef}
        className={`rte ${isEmpty ? "is-empty" : ""}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Note body"
        data-placeholder="Take a note..."
        onInput={emit}
        onKeyDown={handleKeyDown}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        onFocus={refreshActive}
        onPaste={handlePaste}
      />
    </div>
  );
}
