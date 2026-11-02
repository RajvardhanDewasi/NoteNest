const express = require("express");
const Note = require("../models/Note");
const validateId = require("../middleware/validateId");
const { cleanHtml, toPlainText } = require("../utils/sanitize");

const router = express.Router();

// Fields the client is allowed to send. deletedAt and viewedAt are
// managed by the server only.
const ALLOWED_FIELDS = [
  "title",
  "content",
  "color",
  "category",
  "tags",
  "isPinned",
  "isArchived",
  "isDeleted",
  "reminderAt",
  "reminderFired",
  "noteType",
  "checklistItems",
];

const MAX_TAGS = 12;
const MAX_CHECKLIST_ITEMS = 200;
const BOOLEAN_FIELDS = ["isPinned", "isArchived", "isDeleted", "reminderFired"];

// Older notes may not have these fields at all, so use $ne: true
// instead of false. That matches both "false" and "missing".
const NOT_DELETED = { isDeleted: { $ne: true } };
const NOT_ARCHIVED = { isArchived: { $ne: true } };

const SORTS = {
  updated: { isPinned: -1, updatedAt: -1 },
  created: { createdAt: -1 },
  title: { title: 1 },
  viewed: { viewedAt: -1, updatedAt: -1 },
};

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Keep only allowed fields and tidy them up
function pickFields(body) {
  const data = {};

  ALLOWED_FIELDS.forEach((key) => {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  });

  // Sanitize rich text and keep a plain-text copy for searching
  if (typeof data.content === "string") {
    data.content = cleanHtml(data.content);
    data.plainText = toPlainText(data.content);
  }

  // Trim tags, remove "#", and remove duplicates (case-insensitive)
  if (Array.isArray(data.tags)) {
    const seen = new Set();
    data.tags = data.tags
      .map((tag) => String(tag).trim().replace(/^#/, "").slice(0, 24))
      .filter((tag) => {
        if (!tag) return false;
        const key = tag.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_TAGS);
  }

  // Drop empty checklist items
  if (Array.isArray(data.checklistItems)) {
    data.checklistItems = data.checklistItems
      .filter((item) => item && typeof item.text === "string" && item.text.trim())
      .map((item) => ({
        text: item.text.trim().slice(0, 300),
        completed: Boolean(item.completed),
      }))
      .slice(0, MAX_CHECKLIST_ITEMS);
  }

  // Clearing a reminder, or changing its time, resets the "already alerted" flag
  if (data.reminderAt === "") {
    data.reminderAt = null;
  }
  if (data.reminderAt !== undefined && data.reminderFired === undefined) {
    data.reminderFired = false;
  }

  // Keep note state consistent
  if (data.isArchived === true) {
    data.isPinned = false;
  }
  if (data.isDeleted === true) {
    data.isPinned = false;
    data.deletedAt = new Date();
  }
  if (data.isDeleted === false) {
    data.deletedAt = null;
  }

  return data;
}

// Returns an error message, or null if the data is fine
function checkBody(data, requireTitle = true) {
  if (requireTitle && (typeof data.title !== "string" || data.title.trim() === "")) {
    return "Title is required";
  }

  if (data.title !== undefined && (typeof data.title !== "string" || data.title.trim() === "")) {
    return "Title cannot be empty";
  }

  if (data.content !== undefined && typeof data.content !== "string") {
    return "Content must be text";
  }

  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    return "Tags must be a list";
  }

  if (data.checklistItems !== undefined && !Array.isArray(data.checklistItems)) {
    return "Checklist items must be a list";
  }

  for (const key of BOOLEAN_FIELDS) {
    if (data[key] !== undefined && typeof data[key] !== "boolean") {
      return `${key} must be true or false`;
    }
  }

  if (
    data.reminderAt !== undefined &&
    data.reminderAt !== null &&
    Number.isNaN(new Date(data.reminderAt).getTime())
  ) {
    return "Reminder must be a valid date and time";
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Meta routes (must stay above "/:id")                                */
/* ------------------------------------------------------------------ */

// Numbers for the sidebar badges
router.get("/meta/counts", async (req, res, next) => {
  try {
    const [all, pinned, archive, trash, reminders, byCategory] = await Promise.all([
      Note.countDocuments({ ...NOT_DELETED, ...NOT_ARCHIVED }),
      Note.countDocuments({ ...NOT_DELETED, ...NOT_ARCHIVED, isPinned: true }),
      Note.countDocuments({ ...NOT_DELETED, isArchived: true }),
      Note.countDocuments({ isDeleted: true }),
      Note.countDocuments({ ...NOT_DELETED, ...NOT_ARCHIVED, reminderAt: { $ne: null } }),
      Note.aggregate([
        { $match: { ...NOT_DELETED, ...NOT_ARCHIVED } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const categories = {};
    byCategory.forEach((row) => {
      categories[row._id] = row.count;
    });

    res.json({ all, pinned, archive, trash, reminders, categories });
  } catch (err) {
    next(err);
  }
});

// Every tag in use, for the tag filter
router.get("/meta/tags", async (req, res, next) => {
  try {
    const tags = await Note.distinct("tags", { ...NOT_DELETED });
    tags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* List notes                                                          */
/* ------------------------------------------------------------------ */
// Query params:
//   view          all | pinned | recent | reminders | archive | trash
//   search        text matched against title, content, tags, checklist items
//   category      one category name
//   tag           one tag (case-insensitive)
//   pinned        "true" to show only pinned notes
//   updatedWithin number of days (e.g. 7)
//   sort          updated | created | title | viewed
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    const view = String(req.query.view || "all");

    if (view === "trash") {
      filter.isDeleted = true;
    } else if (view === "archive") {
      Object.assign(filter, NOT_DELETED, { isArchived: true });
    } else {
      Object.assign(filter, NOT_DELETED, NOT_ARCHIVED);

      if (view === "pinned") filter.isPinned = true;
      if (view === "recent") filter.viewedAt = { $ne: null };
      if (view === "reminders") filter.reminderAt = { $ne: null };
    }

    if (req.query.pinned === "true") {
      filter.isPinned = true;
    }

    if (req.query.search) {
      const term = escapeRegex(String(req.query.search).trim().slice(0, 100));
      if (term) {
        const regex = new RegExp(term, "i");
        filter.$or = [
          { title: regex },
          { plainText: regex },
          { tags: regex },
          { "checklistItems.text": regex },
        ];
      }
    }

    if (req.query.category) {
      filter.category = String(req.query.category);
    }

    if (req.query.tag) {
      filter.tags = new RegExp(`^${escapeRegex(String(req.query.tag))}$`, "i");
    }

    const days = Number(req.query.updatedWithin);
    if (days > 0) {
      filter.updatedAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    const sortBy = String(req.query.sort || "updated");
    let sort = SORTS[sortBy] || SORTS.updated;

    // These two views have a natural order of their own
    if (view === "recent") sort = { viewedAt: -1 };
    if (view === "reminders" && !req.query.sort) sort = { reminderAt: 1 };

    let query = Note.find(filter).sort(sort);

    if (sortBy === "title") {
      query = query.collation({ locale: "en", strength: 2 }); // case-insensitive A-Z
    }
    if (view === "recent") {
      query = query.limit(Math.min(Number(req.query.limit) || 10, 50));
    }

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* Single note                                                         */
/* ------------------------------------------------------------------ */

router.get("/:id", validateId, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    next(err);
  }
});

// Create a note
router.post("/", async (req, res, next) => {
  try {
    const data = pickFields(req.body || {});
    const error = checkBody(data);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const note = await Note.create(data);

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// Update a note (used by Edit and by autosave)
router.put("/:id", validateId, async (req, res, next) => {
  try {
    const data = pickFields(req.body || {});
    const error = checkBody(data, false);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const note = await Note.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    next(err);
  }
});

// Toggle one checklist row without opening the full note editor.
router.patch("/:id/checklist/:index", validateId, async (req, res, next) => {
  try {
    const index = Number(req.params.index);
    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({ message: "Invalid checklist item" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.isDeleted || note.isArchived) {
      return res.status(400).json({ message: "Restore this note before changing its checklist" });
    }
    if (note.noteType !== "checklist" || index >= note.checklistItems.length) {
      return res.status(404).json({ message: "Checklist item not found" });
    }

    note.checklistItems[index].completed = !note.checklistItems[index].completed;
    await note.save();
    res.json(note);
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

// Mark a note as recently viewed.
// timestamps:false so that just opening a note does not change "updated" time.
router.post("/:id/view", validateId, async (req, res, next) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { viewedAt: new Date() },
      { new: true, timestamps: false }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    next(err);
  }
});

// Pin or unpin. Send { "pinned": true/false }, or send nothing to toggle.
router.patch("/:id/pin", validateId, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.isDeleted || note.isArchived) {
      return res.status(400).json({ message: "Archived or trashed notes cannot be pinned" });
    }

    const pinned =
      req.body && typeof req.body.pinned === "boolean" ? req.body.pinned : !note.isPinned;

    note.isPinned = pinned;
    await note.save({ timestamps: false }); // pinning is not an edit

    res.json(note);
  } catch (err) {
    next(err);
  }
});

// Move a note to the Archive (also unpins it)
router.patch("/:id/archive", validateId, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.isDeleted) {
      return res.status(400).json({ message: "Restore the note from Trash first" });
    }

    note.isArchived = true;
    note.isPinned = false;
    await note.save({ timestamps: false });

    res.json(note);
  } catch (err) {
    next(err);
  }
});

// Bring a note back from the Archive
router.patch("/:id/unarchive", validateId, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    note.isArchived = false;
    await note.save({ timestamps: false });

    res.json(note);
  } catch (err) {
    next(err);
  }
});

// Restore a note from Trash (it returns to the main dashboard)
router.patch("/:id/restore", validateId, async (req, res, next) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, isArchived: false, deletedAt: null },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    next(err);
  }
});

// Permanently delete. Only allowed for notes that are already in Trash.
// (Declared before "/:id" so "/:id/permanent" is never mistaken for a plain delete.)
router.delete("/:id/permanent", validateId, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (!note.isDeleted) {
      return res.status(400).json({
        message: "Move the note to Trash before deleting it permanently",
      });
    }

    await note.deleteOne();

    res.json({ message: "Note permanently deleted" });
  } catch (err) {
    next(err);
  }
});

// Move a note to Trash (same URL and response shape as before)
router.delete("/:id", validateId, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.isDeleted) {
      return res.json({ message: "Note is already in Trash", note });
    }

    note.isDeleted = true;
    note.deletedAt = new Date();
    note.isPinned = false;
    await note.save();

    res.json({ message: "Note moved to Trash", note });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
