import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./ProfileModal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AVATAR_COLORS = [
  "#00a884","#FF6B35","#9B59B6","#3498DB",
  "#E74C3C","#F39C12","#1ABC9C","#E91E63",
  "#2ECC71","#E67E22","#1565C0","#AD1457"
];

export default function ProfileModal({ onClose }) {
  const { user, token } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#00a884");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || "?";

  const handleSave = async () => {
    setError(""); setSuccess("");
    setSaving(true);
    try {
      await axios.put(`${API}/users/profile`, { username, bio, avatarColor });
      setSuccess("Profile updated! Refresh the page to see changes.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <h2>Profile</h2>
          <button className="profile-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="profile-avatar-section">
          <div className="profile-avatar-big" style={{ background: avatarColor }}>
            {getInitials(username)}
          </div>
          <p className="profile-avatar-hint">Choose your color</p>
          <div className="color-grid">
            {AVATAR_COLORS.map(c => (
              <button
                key={c}
                className={`color-swatch ${avatarColor === c ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => setAvatarColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="profile-fields">
          <div className="profile-field">
            <label>Your Name</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={30}
              placeholder="Enter your name"
            />
            <span className="char-count">{username.length}/30</span>
          </div>

          <div className="profile-field">
            <label>About</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={140}
              placeholder="Write something about yourself..."
              rows={3}
            />
            <span className="char-count">{bio.length}/140</span>
          </div>

          <div className="profile-info-row">
            <span className="profile-info-label">Email</span>
            <span className="profile-info-value">{user?.email}</span>
          </div>

          <div className="profile-info-row">
            <span className="profile-info-label">Member since</span>
            <span className="profile-info-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
            </span>
          </div>
        </div>

        {error && <p className="profile-error">{error}</p>}
        {success && <p className="profile-success">{success}</p>}

        <div className="profile-footer">
          <button className="profile-save-btn" onClick={handleSave} disabled={saving || !username.trim()}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
