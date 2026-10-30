require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const notesRouter = require("./routes/notes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/notes", notesRouter);

// Unknown routes
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Central error handler
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid value provided" });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

async function start() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing. Copy .env.example to .env and try again.");
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`NoteNest API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    console.error("Make sure MongoDB is running and MONGODB_URI in .env is correct.");
    process.exit(1);
  }
}

start();
