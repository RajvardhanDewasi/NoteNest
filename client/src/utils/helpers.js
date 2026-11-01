import DOMPurify from "dompurify";

// The only tags the editor toolbar can create.
// This list must match server/utils/sanitize.js
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: ["p", "br", "div", "b", "strong", "i", "em", "u", "h1", "h2", "h3", "ul", "ol", "li"],
  ALLOWED_ATTR: [],
};

// Remove anything unsafe (scripts, event handlers, links, images...) from HTML
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(String(html || ""), SANITIZE_OPTIONS);
}

const HTML_TAG = /<\/?(p|div|br|b|strong|i|em|u|h[1-3]|ul|ol|li)\b/i;

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Notes saved before the rich text editor are plain text with line breaks.
// This turns them into paragraphs so the lines still show up in the editor.
export function legacyToHtml(content) {
  const text = String(content || "");
  if (!text.trim()) return "";
  if (HTML_TAG.test(text)) return text;
  return text
    .split(/\r?\n/)
    .map((line) => `<p>${line ? escapeHtml(line) : "<br>"}</p>`)
    .join("");
}

// HTML -> plain text (for word count and card previews)
export function htmlToText(html) {
  const spaced = String(html || "").replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, " ");
  // DOMParser builds an inert document: scripts do not run, images do not load
  const doc = new DOMParser().parseFromString(spaced, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

export function countWords(text) {
  const trimmed = String(text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ...and we store an ISO string (UTC) in MongoDB
export function fromLocalInput(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Unique key for checklist rows (only used by React, never saved)
let uidCounter = 0;
export function makeUid() {
  uidCounter += 1;
  return `row-${Date.now()}-${uidCounter}`;
}