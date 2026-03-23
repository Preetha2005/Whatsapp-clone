import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import AIChat from "../components/AIChat";
import ProfileModal from "../components/ProfileModal";
import "./Chat.css";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

 useEffect(() => {
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  if (token) fetchUsers(); // IMPORTANT
}, [token]);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setShowAI(false);
  };

  const handleOpenAI = () => {
    setShowAI(true);
    setSelectedUser(null);
  };

  return (
    <div className="chat-layout">
      <Sidebar
        users={users}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        onOpenProfile={() => setShowProfile(true)}
        onOpenAI={handleOpenAI}
      />
      {showAI ? (
        <AIChat />
      ) : (
        <ChatWindow selectedUser={selectedUser} />
      )}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
