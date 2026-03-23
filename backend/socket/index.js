const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);

    // Update DB online status
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Broadcast online status to everyone
    io.emit("user_status", { userId, isOnline: true, lastSeen: new Date() });

    // Send current online users list to the newly connected user
    const onlineList = {};
    onlineUsers.forEach((_, uid) => { onlineList[uid] = true; });
    socket.emit("online_users", onlineList);

    // Send message
    socket.on("send_message", async ({ receiverId, content, type, fileUrl, fileName }) => {
      if (!content?.trim() && !fileUrl) return;
      try {
        const isReceiverOnline = onlineUsers.has(receiverId);
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content: content?.trim() || "",
          type: type || "text",
          fileUrl: fileUrl || "",
          fileName: fileName || "",
          status: isReceiverOnline ? "delivered" : "sent",
        });

        const populated = await message.populate([
          { path: "sender", select: "username avatarColor" },
          { path: "receiver", select: "username avatarColor" },
        ]);

        // Deliver to receiver
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", populated);
          // Mark delivered
          io.to(receiverSocketId).emit("message_delivered", { messageId: message._id, senderId: userId });
        }

        // Confirm to sender
        socket.emit("message_sent", populated);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // Mark messages as read when user opens a chat
    socket.on("mark_read", async ({ senderId }) => {
      try {
        await Message.updateMany(
          { sender: senderId, receiver: userId, status: { $ne: "read" } },
          { status: "read" }
        );
        // Notify sender their messages were read
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_read", { by: userId, from: senderId });
        }
      } catch (err) {
        console.error("mark_read error:", err);
      }
    });

    // Typing
    socket.on("typing", ({ receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", { senderId: userId, isTyping });
      }
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      io.emit("user_status", { userId, isOnline: false, lastSeen });
    });
  });
};
