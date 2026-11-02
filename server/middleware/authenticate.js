
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Please sign in to continue",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!payload.sub) {
      return res.status(401).json({
        message: "Invalid session. Please sign in again.",
      });
    }

    const user = await User.findById(payload.sub)
      .select("_id name email");

    if (!user) {
      return res.status(401).json({
        message: "Account not found. Please sign in again.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (
      err.name === "TokenExpiredError" ||
      err.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Your session has expired. Please sign in again.",
      });
    }

    next(err);
  }
};
