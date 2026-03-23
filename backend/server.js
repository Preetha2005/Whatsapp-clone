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

const app = express();
const server = http.createServer(app);

// ✅ PORT FIX (important for Render)
const PORT = process.env.PORT || 5000;

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