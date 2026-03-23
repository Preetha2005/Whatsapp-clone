const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    type: { type: String, enum: ["text", "image", "audio"], default: "text" },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model("Message", messageSchema);
