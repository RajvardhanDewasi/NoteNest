
const mongoose = require("mongoose");

const COLORS = [
  "#ffffff",
  "#fff3b0",
  "#ffd6d6",
  "#d6f5d6",
  "#d6e8ff",
  "#e9dcff",
  "#ffe2c6",
  "#d5f5ef",
  "#f6d9f0",
  "#e8edf2",
];

const CATEGORIES = [
  "Personal",
  "College",
  "Work",
  "Ideas",
  "Study",
  "Projects",
  "Other",
];

const TRASH_DAYS = 30;

const checklistItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    // Owner of this note
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    content: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50000,
    },

    plainText: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      enum: COLORS,
      default: "#ffffff",
    },

    category: {
      type: String,
      enum: CATEGORIES,
      default: "Personal",
    },

    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => value.length <= 12,
        message: "A note can have at most 12 tags",
      },
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    reminderAt: {
      type: Date,
      default: null,
    },

    reminderFired: {
      type: Boolean,
      default: false,
    },

    viewedAt: {
      type: Date,
      default: null,
    },

    noteType: {
      type: String,
      enum: ["standard", "checklist"],
      default: "standard",
    },

    checklistItems: {
      type: [checklistItemSchema],
      default: [],
      validate: {
        validator: (value) => value.length <= 200,
        message: "A checklist can have at most 200 items",
      },
    },

    // Legacy compatibility fields
    pinned: {
      type: Boolean,
      default: false,
    },

    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Owner-based indexes for separate user dashboards.
noteSchema.index({
  owner: 1,
  isDeleted: 1,
  isArchived: 1,
  isPinned: -1,
  updatedAt: -1,
});

// Automatically delete notes after 30 days in Trash.
noteSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * TRASH_DAYS }
);

module.exports = mongoose.model("Note", noteSchema);
