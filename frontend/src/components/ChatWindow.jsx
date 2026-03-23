import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import "./ChatWindow.css";

// ✅ FIXED API
const API = import.meta.env.VITE_API_URL;
const BASE = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Tick mark component
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
          <path d="M1 9l4 4L17 3" stroke="currentColor" strokeWidth="2"/>
          <path d="M5 9l4 4L17 7" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="ticks sent-tick">
      <svg viewBox="0 0 18 18" width="14" height="14" fill="none">
        <path d="M1 9l4 4L17 3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    </span>
  );
}

export default function ChatWindow({ selectedUser }) {
  const { user, token } = useAuth(); // ✅ token added
  const { socket, onlineUsers, lastSeen } = useSocket();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);
  const msgRefs = useRef({});

  useEffect(() => {
    if (!selectedUser || selectedUser === "ai") return;
    setMessages([]);
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ✅ FIXED FETCH
  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(
        `${API}/api/messages/${selectedUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!socket || !selectedUser || selectedUser === "ai") return;

    const handleReceive = (msg) => {
      if (msg.sender._id === selectedUser?._id || msg.receiver._id === selectedUser?._id) {
        setMessages((prev) => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
      }
    };

    socket.on("receive_message", handleReceive);

    return () => socket.off("receive_message", handleReceive);
  }, [socket, selectedUser]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;

    socket.emit("send_message", {
      receiverId: selectedUser._id,
      content: input.trim(),
      type: "text",
    });

    setInput("");
  };

  // ✅ FIXED UPLOAD
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(
        `${API}/api/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("send_message", {
        receiverId: selectedUser._id,
        content: data.fileName,
        type,
        fileUrl: data.fileUrl,
      });

    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!selectedUser) {
    return <div className="chat-window empty">Select a chat</div>;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{selectedUser.username}</h3>
        <span>{onlineUsers[selectedUser._id] ? "Online" : "Offline"}</span>
      </div>

      <div className="messages-container">
        {messages.map((msg) => {
          const isMine = msg.sender._id === user._id;

          return (
            <div key={msg._id} className={`message ${isMine ? "sent" : "received"}`}>
              <div className="message-bubble">
                {msg.type === "image" ? (
                  <img src={`${BASE}${msg.fileUrl}`} alt="sent" />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFileUpload(e, "image")}
        />

        <button onClick={() => fileInputRef.current.click()}>+</button>

        <input
          type="text"
          value={input}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}