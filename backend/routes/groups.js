const express = require("express");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const { auth } = require("./users");

const router = express.Router();

// Create group
router.post("/", auth, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !members?.length)
      return res.status(400).json({ message: "Name and members required" });

    const group = await Group.create({
      name,
      members: [...new Set([...members, req.user.id])],
      admin: req.user.id,
      avatarColor: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
    });

    const populated = await group.populate("members", "-password");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all groups for current user
router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate("members", "-password")
      .populate("admin", "-password")
      .sort({ updatedAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get group messages
router.get("/:groupId/messages", auth, async (req, res) => {
  try {
    const messages = await GroupMessage.find({ group: req.params.groupId })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;