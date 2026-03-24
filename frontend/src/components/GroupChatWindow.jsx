import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import "./ChatWindow.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function GroupChatWindow({ group }) {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!group) return;
    setMessages([]);
    fetchMessages();
    if (socket) socket.emit("join_group", { groupId: group._id });
  }, [group]);

  useEffect(() => {
    if (!socket) return;
    const handleGroupMessage = (msg) => {
      if (msg.group === group?._id) {
        setMessages(prev =>
          prev.find(m => m._id === msg._id) ? prev : [...prev, msg]
        );
      }
    };
    socket.on("group_message", handleGroupMessage);
    return () => socket.off("group_message", handleGroupMessage);
  }, [socket, group]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`${API}/api/groups/${group._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit("send_group_message", {
      groupId: group._id,
      content: input.trim(),
      type: "text",
    });
    setInput("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post(`${API}/api/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (socket) {
        socket.emit("send_group_message", {
          groupId: group._id,
          content: data.fileName,
          type: "image",
          fileUrl: data.fileUrl,
          fileName: data.fileName,
        });
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || "?";

  if (!group) return null;

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-user-avatar" style={{ background: group.avatarColor || "#00a884" }}>
          {getInitials(group.name)}
        </div>
        <div className="chat-header-info">
          <div className="chat-username">{group.name}</div>
          <div className="chat-status-text">
            {group.members?.map(m => m.username).join(", ")}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((msg) => {
          const isMine = msg.sender?._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} className={`message ${isMine ? "sent" : "received"}`}>
              <div className="message-bubble">
                {!isMine && (
                  <div style={{ fontSize: "11px", color: "var(--accent)", marginBottom: "2px", fontWeight: 600 }}>
                    {msg.sender?.username}
                  </div>
                )}
                {msg.type === "image" && msg.fileUrl ? (
                  <img src={`${BASE}${msg.fileUrl}`} alt="sent" className="msg-image" />
                ) : (
                  <p>{msg.content}</p>
                )}
                <div className="msg-meta">
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="message-input-area">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <button className="attach-btn" onClick={() => fileInputRef.current.click()} disabled={uploading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
        </button>
        <input
          type="text"
          placeholder={uploading ? "Uploading..." : "Type a message"}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={uploading}
        />
        <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || uploading}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}