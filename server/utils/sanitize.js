const sanitizeHtml = require("sanitize-html");

// Only the tags our editor toolbar can produce. No attributes at all,
// so no onclick, style, href, src, etc.
const RICH_TEXT_OPTIONS = {
  allowedTags: ["p", "br", "div", "b", "strong", "i", "em", "u", "h1", "h2", "h3", "ul", "ol", "li"],
  allowedAttributes: {},
};

const TEXT_ONLY_OPTIONS = { allowedTags: [], allowedAttributes: {} };

// Clean HTML before saving it to MongoDB
function cleanHtml(html) {
  return sanitizeHtml(String(html || ""), RICH_TEXT_OPTIONS).trim();
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

// Turn HTML into plain text (used for search, previews and word count)
function toPlainText(html) {
  const spaced = String(html || "").replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, " ");
  const stripped = sanitizeHtml(spaced, TEXT_ONLY_OPTIONS);
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

module.exports = { cleanHtml, toPlainText };