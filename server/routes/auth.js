
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      issuer: "notenest",
    }
  );
}

// REGISTER
router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        message: "Name must be between 2 and 50 characters",
      });
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters",
      });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password is too long",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;

    try {
      user = await User.create({
        name,
        email,
        passwordHash,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          message: "An account with this email already exists",
        });
      }

      throw err;
    }

    return res.status(201).json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!EMAIL_PATTERN.test(email) || !password) {
      return res.status(400).json({
        message: "Enter your email and password",
      });
    }

    const user = await User.findOne({ email })
      .select("+passwordHash");

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Incorrect email or password",
      });
    }

    return res.json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// CURRENT USER
router.get("/me", authenticate, (req, res) => {
  res.json({
    user: publicUser(req.user),
  });
});

module.exports = router;
