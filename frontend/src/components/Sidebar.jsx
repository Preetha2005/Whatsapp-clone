import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import "./Sidebar.css";

export default function Sidebar({
  users = [], // ✅ fallback to prevent crash
  selectedUser,
  onSelectUser,
  onOpenProfile,
  onOpenAI,
}) {
  const { user, logout } = useAuth();
  const { onlineUsers, lastSeen } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || "?";

  const formatLastSeen = (userId) => {
    if (onlineUsers[userId]) return "Online";
    const ls = lastSeen[userId];
    if (!ls) return "Offline";

    const date = new Date(ls);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)
      return `Today ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  // ✅ Prevent crash if users undefined
  const filteredUsers = (users || []).filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">
      {/* HEADER */}
      <div className="sidebar-header">
        <div
          className="my-avatar clickable"
          style={{ background: user?.avatarColor || "#00a884" }}
          onClick={onOpenProfile}
          title="View Profile"
        >
          <span>{getInitials(user?.username)}</span>
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={onOpenAI} title="Meta AI Assistant">
            <span>AI</span>
          </button>

          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button className="icon-btn" onClick={logout} title="Logout">
            ⎋
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* USERS LIST */}
      <div className="users-list">
        {/* AI */}
        <div
          className={`user-item ${selectedUser === "ai" ? "active" : ""}`}
          onClick={onOpenAI}
        >
          <div className="user-avatar">AI</div>
          <div className="user-info">
            <span className="username">Meta AI</span>
            <span className="user-status">Ask anything</span>
          </div>
        </div>

        {/* EMPTY STATE */}
        {filteredUsers.length === 0 && (
          <p className="no-users">
            {search ? `No users found for "${search}"` : "No users available"}
          </p>
        )}

        {/* USERS */}
        {filteredUsers.map((u) => (
          <div
            key={u._id}
            className={`user-item ${
              selectedUser?._id === u._id ? "active" : ""
            }`}
            onClick={() => onSelectUser(u)}
          >
            <div
              className="user-avatar"
              style={{ background: u.avatarColor || "#2a3942" }}
            >
              <span>{getInitials(u.username)}</span>
            </div>

            <div className="user-info">
              <span className="username">{u.username}</span>
              <span className="user-status">
                {formatLastSeen(u._id)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}