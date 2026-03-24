import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import "./ChatWindow.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function Ticks({ status }) {
  if (status === "read") {
    return (
      <span className="ticks read">
        <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
          <path d="M1 9l4 4L17 3" stroke="#53bdeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 9l4 4L17 7" stroke="#53bdeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (status === "delivered") {
    return (
      <span className="ticks delivered">
        <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
          <path d="M1 9l4 4L17 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 9l4 4L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="ticks sent-tick">
      <svg viewBox="0 0 18 18" width="14" height="14" fill="none">
        <path d="M1 9l4 4L17 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

// ✅ ADDED: onCall prop
export default function ChatWindow({ selectedUser, onCall }) {
  const { user, token } = useAuth();
  const { socket, onlineUsers, lastSeen } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIdx, setSearchIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);
  const msgRefs = useRef({});

  useEffect(() => {
    if (!selectedUser || selectedUser === "ai") return;
    setMessages([]);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!socket || !selectedUser || selectedUser === "ai") return;
    socket.emit("mark_read", { senderId: selectedUser._id });
  }, [socket, selectedUser]);

  useEffect(() => {
    if (!socket || !selectedUser || selectedUser === "ai") return;

    const handleReceive = (msg) => {
      if (msg.sender._id === selectedUser?._id || msg.receiver._id === selectedUser?._id) {
        setMessages((prev) => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
        socket.emit("mark_read", { senderId: selectedUser._id });
      }
    };

    const handleSent = (msg) => {
      setMessages((prev) => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
    };

    const handleDelivered = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: "delivered" } : m));
    };

    const handleRead = ({ from }) => {
      if (from === selectedUser?._id) {
        setMessages(prev => prev.map(m => m.sender?._id === user._id ? { ...m, status: "read" } : m));
      }
    };

    const handleTypingEvt = ({ senderId, isTyping }) => {
      if (senderId === selectedUser?._id) setTyping(isTyping);
    };

    socket.on("receive_message", handleReceive);
    socket.on("message_sent", handleSent);
    socket.on("message_delivered", handleDelivered);
    socket.on("messages_read", handleRead);
    socket.on("user_typing", handleTypingEvt);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("message_sent", handleSent);
      socket.off("message_delivered", handleDelivered);
      socket.off("messages_read", handleRead);
      socket.off("user_typing", handleTypingEvt);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`${API}/api/messages/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const { data } = await axios.get(
        `${API}/api/messages/${selectedUser._id}/search?q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(data);
      setSearchIdx(0);
      if (data.length > 0) scrollToMessage(data[0]._id);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToMessage = (id) => {
    const el = msgRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const navigateSearch = (dir) => {
    if (!searchResults.length) return;
    const newIdx = (searchIdx + dir + searchResults.length) % searchResults.length;
    setSearchIdx(newIdx);
    scrollToMessage(searchResults[newIdx]._id);
  };

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit("send_message", { receiverId: selectedUser._id, content: input.trim(), type: "text" });
    setInput("");
    socket.emit("typing", { receiverId: selectedUser._id, isTyping: false });
    setIsTyping(false);
  };

  const handleFileUpload = async (e, type) => {
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
        socket.emit("send_message", {
          receiverId: selectedUser._id,
          content: data.fileName,
          type,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
        });
      }
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
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
            socket.emit("send_message", {
              receiverId: selectedUser._id,
              content: "Voice message",
              type: "audio",
              fileUrl: data.fileUrl,
              fileName: data.fileName,
            });
          }
        } catch (err) {
          alert("Failed to send voice message");
        } finally {
          setUploading(false);
        }
      };
      mr.start();
      setRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      setRecording(false);
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      clearInterval(recordingTimerRef.current);
      setRecording(false);
      setRecordingTime(0);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: selectedUser._id, isTyping: true });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { receiverId: selectedUser._id, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatRecTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const getStatusText = () => {
    if (!selectedUser) return "";
    if (onlineUsers[selectedUser._id]) return "Online";
    const ls = lastSeen[selectedUser._id];
    if (!ls) return "Offline";
    const date = new Date(ls);
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return "Last seen just now";
    if (diff < 3600) return `Last seen ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Last seen today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  };

  if (!selectedUser) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <h2>WhatsApp Web</h2>
          <p>Select a chat to start messaging<br/>or click <strong>Meta AI</strong> to chat with AI</p>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers[selectedUser._id];

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-user-avatar" style={{ background: selectedUser.avatarColor || "#2a3942" }}>
          {selectedUser.username?.slice(0, 2).toUpperCase()}
          <span className={`header-status-dot ${isOnline ? "online" : "offline"}`} />
        </div>
        <div className="chat-header-info">
          <div className="chat-username">{selectedUser.username}</div>
          <div className={`chat-status-text ${isOnline ? "online" : ""}`}>
            {typing ? <span className="typing-indicator">typing...</span> : getStatusText()}
          </div>
        </div>

        {/* ✅ ADDED: Audio + Video call buttons */}
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={() => onCall && onCall("audio")} title="Voice Call">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={() => onCall && onCall("video")} title="Video Call">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </button>
          <button
            className="icon-btn"
            onClick={() => { setShowSearch(s => !s); setSearchQuery(""); setSearchResults([]); }}
            title="Search messages"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="19" height="19">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Message Search Bar */}
      {showSearch && (
        <div className="msg-search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ color: "var(--text-secondary)" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <span className="search-count">{searchIdx + 1}/{searchResults.length}</span>
          )}
          <button className="icon-btn" onClick={() => navigateSearch(-1)} disabled={!searchResults.length} title="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button className="icon-btn" onClick={() => navigateSearch(1)} disabled={!searchResults.length} title="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button className="icon-btn" onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {messages.map((msg) => {
          const isMine = msg.sender._id === user._id || msg.sender === user._id;
          const isHighlighted = searchResults.some(r => r._id === msg._id);
          return (
            <div
              key={msg._id}
              ref={el => msgRefs.current[msg._id] = el}
              className={`message ${isMine ? "sent" : "received"} ${isHighlighted ? "highlighted" : ""}`}
            >
              <div className="message-bubble">
                {msg.type === "image" && msg.fileUrl ? (
                  <img
                    src={`${BASE}${msg.fileUrl}`}
                    alt="sent"
                    className="msg-image"
                    onClick={() => setLightboxImg(`${BASE}${msg.fileUrl}`)}
                  />
                ) : msg.type === "audio" && msg.fileUrl ? (
                  <audio controls className="msg-audio">
                    <source src={`${BASE}${msg.fileUrl}`} />
                  </audio>
                ) : (
                  <p>{msg.content}</p>
                )}
                <div className="msg-meta">
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                  {isMine && <Ticks status={msg.status || "sent"} />}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="message received">
            <div className="message-bubble typing-bubble">
              <span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="message-input-area">
        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "image")} />
        <input type="file" ref={audioFileInputRef} accept="audio/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "audio")} />

        {recording ? (
          <div className="recording-bar">
            <button className="rec-cancel-btn" onClick={cancelRecording} title="Cancel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <span className="rec-dot" />
            <span className="rec-time">{formatRecTime(recordingTime)}</span>
            <span className="rec-label">Recording...</span>
            <button className="rec-send-btn" onClick={stopRecording} title="Send voice message">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        ) : (
          <>
            <button className="attach-btn" onClick={() => fileInputRef.current.click()} title="Send Image" disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
              </svg>
            </button>
            <button className="attach-btn" onClick={() => audioFileInputRef.current.click()} title="Send Audio File" disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </button>
            <input
              type="text"
              placeholder={uploading ? "Uploading..." : "Type a message"}
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              disabled={uploading}
            />
            {!input.trim() ? (
              <button className="mic-btn" onMouseDown={startRecording} onTouchStart={startRecording} title="Hold to record">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            ) : (
              <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || uploading}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="preview" />
        </div>
      )}
    </div>
  );
}