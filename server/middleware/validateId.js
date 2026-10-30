const mongoose = require("mongoose");

module.exports = function validateId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid note ID" });
  }
  next();
};
