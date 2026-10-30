const express = require("express");
const Note = require("../models/Note");
const validateId = require("../middleware/validateId");

const router = express.Router();

// Only allow known fields from the request body
function pickFields(body) {
  const data = {};
  ["title", "content", "color", "category"].forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  return data;
}

// Basic checks before hitting Mongoose
function checkBody(data) {
  if (typeof data.title !== "string" || data.title.trim() === "") {
    return "Title is required";
  }
  if (data.content !== undefined && typeof data.content !== "string") {
    return "Content must be text";
  }
  return null;
}

// GET /api/notes  (optional ?search=term)
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.search) {
      const term = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(term, "i");
      filter.$or = [{ title: regex }, { content: regex }];
    }
    const notes = await Note.find(filter).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id
router.get("/:id", validateId, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

// POST /api/notes
router.post("/", async (req, res, next) => {
  try {
    const data = pickFields(req.body || {});
    const error = checkBody(data);
    if (error) return res.status(400).json({ message: error });
    const note = await Note.create(data);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id
router.put("/:id", validateId, async (req, res, next) => {
  try {
    const data = pickFields(req.body || {});
    const error = checkBody(data);
    if (error) return res.status(400).json({ message: error });
    const note = await Note.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id
router.delete("/:id", validateId, async (req, res, next) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
