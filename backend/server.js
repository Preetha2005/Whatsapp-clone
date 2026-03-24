require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth");
const { router: userRoutes } = require("./routes/users");
const messageRoutes = require("./routes/messages");
const uploadRoutes = require("./routes/upload");
const aiRoutes = require("./routes/ai");
const socketHandler = require("./socket");
const groupsRouter = require("./routes/groups");

const app = express();
const server = http.createServer(app);

// ✅ PORT FIX (important for Render)
const PORT = process.env.PORT || 5000;

app.use("/api/groups", groupsRouter);
// ✅ CORS setup
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);

// ✅ Health check route (useful for deployment)
app.get("/api/health", (_, res) => {
  res.json({ status: "OK" });
});

// ❌ 404 handler
app.use((_, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Group chat socket events
socket.on("join_group", ({ groupId }) => {
  socket.join(`group_${groupId}`);
});

socket.on("send_group_message", async ({ groupId, content, type, fileUrl, fileName }) => {
  try {
    const GroupMessage = require("./models/GroupMessage");
    const msg = await GroupMessage.create({
      group: groupId,
      sender: socket.userId,
      content,
      type: type || "text",
      fileUrl,
      fileName,
    });
    const populated = await msg.populate("sender", "-password");
    io.to(`group_${groupId}`).emit("group_message", populated);

    // Update group lastMessage
    const Group = require("./models/Group");
    await Group.findByIdAndUpdate(groupId, { lastMessage: content });
  } catch (err) {
    console.error("Group message error:", err);
  }
});

// WebRTC call signaling
socket.on("call_user", ({ to, type, offer, username, avatarColor }) => {
  io.to(to).emit("incoming_call", {
    from: socket.userId,
    type,
    offer,
    username,
    avatarColor,
  });
});

socket.on("call_accepted", async ({ to, answer }) => {
  // Create answer on receiver side
  io.to(to).emit("call_accepted", { answer });
});

socket.on("call_rejected", ({ to }) => {
  io.to(to).emit("call_rejected");
});

socket.on("ice_candidate", ({ to, candidate }) => {
  io.to(to).emit("ice_candidate", { candidate });
}); 

socketHandler(io);

// ✅ MongoDB connection + server start
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Error:", err);
    process.exit(1); // exit if DB fails
  });