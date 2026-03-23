import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import "./ChatWindow.css";

// ✅ FIXED
const API = import.meta.env.VITE_API_URL;
const BASE = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function ChatWindow({ selectedUser }) {
  const { user, token } = useAuth(); // ✅ include token
  const { socket, onlineUsers, lastSeen } = useSocket();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser || selectedUser === "ai") return;
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ FETCH MESSAGES FIXED
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

  // ✅ SOCKET RECEIVE
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive_message", handleReceive);

    return () => socket.off("receive_message", handleReceive);
  }, [socket]);

  // ✅ SEND MESSAGE
  const sendMessage = () => {
    if (!input.trim() || !socket) return;

    socket.emit("send_message", {
      receiverId: selectedUser._id,
      content: input,
      type: "text",
    });

    setInput("");
  };

  // ✅ FILE UPLOAD FIXED
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
    }
  };

  if (!selectedUser) {
    return <div className="chat-window empty">Select a chat</div>;
  }

  return (
    <div className="chat-window">
      {/* HEADER */}
      <div className="chat-header">
        <h3>{selectedUser.username}</h3>
        <span>
          {onlineUsers[selectedUser._id] ? "Online" : "Offline"}
        </span>
      </div>

      {/* MESSAGES */}
      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`message ${
              msg.sender._id === user._id ? "sent" : "received"
            }`}
          >
            {msg.type === "image" ? (
              <img src={`${BASE}${msg.fileUrl}`} alt="" />
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="message-input-area">
        <input
          type="file"
          onChange={(e) => handleFileUpload(e, "image")}
        />

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message"
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}