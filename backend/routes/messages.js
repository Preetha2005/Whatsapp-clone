const express = require("express");
const Message = require("../models/Message");
const { auth } = require("./users");

const router = express.Router();

// Get conversation
router.get("/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    })
      .populate("sender", "username avatarColor")
      .populate("receiver", "username avatarColor")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search messages in a conversation
router.get("/:userId/search", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { q } = req.query;
    const myId = req.user.id;

    if (!q?.trim()) return res.json([]);

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
      type: "text",
      content: { $regex: q.trim(), $options: "i" },
    })
      .populate("sender", "username avatarColor")
      .populate("receiver", "username avatarColor")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message (REST)
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId, content, type, fileUrl, fileName } = req.body;
    if (!receiverId || (!content?.trim() && !fileUrl))
      return res.status(400).json({ message: "Receiver and content or file required" });

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      content: content?.trim() || "",
      type: type || "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
    });

    const populated = await message.populate([
      { path: "sender", select: "username avatarColor" },
      { path: "receiver", select: "username avatarColor" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
