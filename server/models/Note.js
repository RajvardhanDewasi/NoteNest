const mongoose = require("mongoose");

const COLORS = ["#ffffff", "#fff3b0", "#ffd6d6", "#d6f5d6", "#d6e8ff", "#e9dcff"];
const CATEGORIES = ["Personal", "College", "Work"];

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    content: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "Content cannot exceed 5000 characters"],
    },
    color: {
      type: String,
      enum: { values: COLORS, message: "Invalid color" },
      default: "#ffffff",
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: "Invalid category" },
      default: "Personal",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("Note", noteSchema);
