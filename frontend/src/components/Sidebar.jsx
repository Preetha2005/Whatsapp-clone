import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import "./Sidebar.css";

export default function Sidebar({ users, selectedUser, onSelectUser, onOpenProfile, onOpenAI }) {
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
    if (diff < 86400) return `Today ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">
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
            <svg viewBox="0 0 32 32" fill="currentColor" width="20" height="20">
              <path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm0 19.2a10.4 10.4 0 0 1-8-3.8c.04-2.65 5.34-4.1 8-4.1s7.96 1.45 8 4.1a10.4 10.4 0 0 1-8 3.8z"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .38-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.38.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            )}
          </button>
          <button className="icon-btn" onClick={logout} title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>

          <button className="icon-btn" onClick={onCreateGroup} title="New Group">
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
</button>
        </div>
      </div>

      <div className="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="search-icon">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      <div className="users-list">
        {/* AI Entry */}
        <div
          className={`user-item ai-item ${selectedUser === "ai" ? "active" : ""}`}
          onClick={onOpenAI}
        >
          <div className="user-avatar ai-avatar"><span>AI</span></div>
          <div className="user-info">
            <span className="username">Meta AI</span>
            <span className="user-status ai-status">● Ask me anything</span>
          </div>
        </div>

        {/* Groups */}
{groups?.length > 0 && (
  <>
    <div style={{ padding: "8px 16px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}>
      GROUPS
    </div>
    {groups.map((g) => (
      <div
        key={g._id}
        className={`user-item ${selectedGroup?._id === g._id ? "active" : ""}`}
        onClick={() => onSelectGroup(g)}
      >
        <div className="user-avatar" style={{ background: g.avatarColor || "#00a884" }}>
          <span>{g.name?.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="user-info">
          <span className="username">{g.name}</span>
          <span className="user-status">
            {g.members?.length} members
          </span>
        </div>
      </div>
    ))}
  </>
)}

        {filteredUsers.length === 0 && search && (
          <p className="no-users">No users found for "{search}"</p>
        )}
        {filteredUsers.length === 0 && !search && (
          <p className="no-users">No other users yet.<br/>Register another account!</p>
        )}

        {filteredUsers.map((u) => (
          <div
            key={u._id}
            className={`user-item ${selectedUser?._id === u._id ? "active" : ""}`}
            onClick={() => onSelectUser(u)}
          >
            <div className="user-avatar" style={{ background: u.avatarColor || "#2a3942" }}>
              <span>{getInitials(u.username)}</span>
              <span className={`status-dot ${onlineUsers[u._id] ? "online" : "offline"}`} />
            </div>
            <div className="user-info">
              <div className="user-row-top">
                <span className="username">{u.username}</span>
              </div>
              <span className={`user-status ${onlineUsers[u._id] ? "online-text" : ""}`}>
                {formatLastSeen(u._id)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
