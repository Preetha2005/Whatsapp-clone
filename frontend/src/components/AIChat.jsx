import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./AIChat.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Meta AI, your intelligent assistant. Ask me anything — I'm here to help! 🤖" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const history = messages.filter(m => m.role !== "system");
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/ai/chat`, {
        message: text,
        history: history.slice(-10),
      });
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to reach AI. Check your API key in backend .env";
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatText = (text) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>{line}{i < text.split("\n").length - 1 && <br/>}</span>
    ));
  };

  return (
    <div className="ai-chat">
      <div className="ai-header">
        <div className="ai-header-avatar">AI</div>
        <div className="ai-header-info">
          <div className="ai-header-name">Meta AI</div>
          <div className="ai-header-sub">Powered by Claude · Always available</div>
        </div>
      </div>

      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`}>
            {msg.role === "assistant" && (
              <div className="ai-msg-avatar">AI</div>
            )}
            <div className="ai-msg-bubble">
              {formatText(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message assistant">
            <div className="ai-msg-avatar">AI</div>
            <div className="ai-msg-bubble ai-typing">
              <span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-input-area">
        <input
          type="text"
          placeholder="Ask Meta AI anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading} className="ai-send-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
