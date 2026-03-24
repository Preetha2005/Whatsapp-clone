const express = require("express");
const { auth } = require("./users");

const router = express.Router();

router.post("/chat", auth, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Message required" });

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return res.status(500).json({ message: "AI API key not configured" });

  try {
    // Filter valid history roles only
    const validHistory = history
      .filter(h => h.role === "user" || h.role === "assistant")
      .filter(h => h.content?.trim());

    // Ensure history starts with user message (Groq requirement)
    const trimmedHistory = validHistory[0]?.role === "assistant"
      ? validHistory.slice(1)
      : validHistory;

    const messages = [
      ...trimmedHistory.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: "You are Meta AI, a helpful and friendly AI assistant integrated into WhatsApp. Be concise, helpful, and conversational. Keep responses brief unless detail is needed."
          },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your AI_API_KEY in backend .env");
      }
      if (response.status === 429) {
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      }
      if (response.status === 500) {
        throw new Error("Groq service temporarily unavailable. Please try again shortly.");
      }
      throw new Error(err.error?.message || "AI API error");
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;