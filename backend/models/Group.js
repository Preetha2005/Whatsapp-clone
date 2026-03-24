const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  avatarColor: { type: String, default: "#00a884" },
  lastMessage: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);