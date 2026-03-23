const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// 🔐 Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // should contain _id
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ GET all users (except logged-in user)
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id }, // ✅ FIXED
    }).select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id) // ✅ FIXED
      .select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { username, bio, avatarColor } = req.body;

    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatarColor) updates.avatarColor = avatarColor;

    // ✅ Check username uniqueness
    if (username) {
      const existing = await User.findOne({
        username,
        _id: { $ne: req.user._id }, // ✅ FIXED
      });

      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id, // ✅ FIXED
      updates,
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = { router, auth };