import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import AIChat from "../components/AIChat";
import ProfileModal from "../components/ProfileModal";
import "./Chat.css";
 import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const { token } = useAuth();

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

 useEffect(() => {
  if (!token) return;

  axios.get(`${API}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  .then(({ data }) => setUsers(data))
  .catch(err => console.error(err));
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
