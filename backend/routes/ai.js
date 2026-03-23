const express = require("express");
const { auth } = require("./users");

const router = express.Router();

router.post("/chat", auth, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Message required" });

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return res.status(500).json({ message: "AI API key not configured" });

  try {
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: "You are Meta AI, a helpful and friendly AI assistant integrated into WhatsApp. Be concise, helpful, and conversational. Keep responses brief unless detail is needed.",
        messages
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "AI API error");
    }

    const data = await response.json();
    const reply = data.content[0].text;
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
