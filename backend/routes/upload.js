const express = require("express");
const multer = require("multer");
const path = require("path");
const { auth } = require("./users");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("File type not allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl, fileName: req.file.originalname, mimetype: req.file.mimetype });
});

module.exports = router;
