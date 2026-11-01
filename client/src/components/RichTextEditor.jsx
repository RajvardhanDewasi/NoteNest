import { useEffect, useRef, useState } from "react";
import { sanitizeHtml } from "../utils/helpers";

// Which block (paragraph, heading, list item) the cursor is in
function currentBlock(root) {
  const selection = window.getSelection();
  let node = selection ? selection.anchorNode : null;
  while (node && node !== root) {
    if (node.nodeType === 1 && /^(H1|H2|H3|P|DIV|LI)$/.test(node.nodeName)) {
      return node.nodeName.toLowerCase();
    }
    node = node.parentNode;
  }
  return "";
}

// One toolbar button. onMouseDown stops the button from taking focus away
// from the text, so the selection stays where the user put it.
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

  // Put the saved note into the editor once, when it first appears.
  // After that the browser owns the text, so the cursor never jumps.
  useEffect(() => {
    const el = editorRef.current;
    el.innerHTML = sanitizeHtml(initialHtml);
    setIsEmpty(!el.textContent.trim() && !el.querySelector("li"));
    // New lines become <p> instead of <div>
    document.execCommand("defaultParagraphSeparator", false, "p");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the toolbar buttons that match the text under the cursor
  useEffect(() => {
    function refreshActive() {
      const el = editorRef.current;
      const selection = window.getSelection();
      if (!el || !selection || selection.rangeCount === 0 || !el.contains(selection.anchorNode)) {
        return;
      }
      const next = {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        block: currentBlock(el),
      };
      setActive((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    }
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, []);

  // Tell the parent what the note looks like now
  function emit() {
    const el = editorRef.current;
    const hasText = Boolean(el.textContent.trim());
    setIsEmpty(!hasText && !el.querySelector("li"));
    onChange(hasText ? sanitizeHtml(el.innerHTML) : "");
  }

  function run(command, value) {
    editorRef.current.focus();
    document.execCommand(command, false, value);
    emit();
  }

  function toggleHeading(tag) {
    const isAlready = currentBlock(editorRef.current) === tag;
    run("formatBlock", isAlready ? "<p>" : `<${tag}>`);
  }

  // Paste as plain text so no foreign HTML or styles get into the note
  function handlePaste(event) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  return (
    <div className="rte-wrap">
      <div className="toolbar" role="toolbar" aria-label="Text formatting">
        <Tool label="Bold" title="Bold (Ctrl+B)" isActive={active.bold} onClick={() => run("bold")}>
          <b>B</b>
        </Tool>
        <Tool label="Italic" title="Italic (Ctrl+I)" isActive={active.italic} onClick={() => run("italic")}>
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
        <Tool label="Heading 1" isActive={active.block === "h1"} onClick={() => toggleHeading("h1")}>
          H1
        </Tool>
        <Tool label="Heading 2" isActive={active.block === "h2"} onClick={() => toggleHeading("h2")}>
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
        onPaste={handlePaste}
      />
    </div>
  );
}