import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./ProfileModal.css";

// ✅ FIXED
const API = import.meta.env.VITE_API_URL;

const AVATAR_COLORS = [
  "#00a884","#FF6B35","#9B59B6","#3498DB",
  "#E74C3C","#F39C12","#1ABC9C","#E91E63",
  "#2ECC71","#E67E22","#1565C0","#AD1457"
];

export default function ProfileModal({ onClose }) {
  const { user, token } = useAuth(); // ✅ token added

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
      await axios.put(
        `${API}/api/users/profile`, // ✅ FIXED
        { username, bio, avatarColor },
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ FIXED
          },
        }
      );

      setSuccess("Profile updated!");
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
          <button className="profile-close" onClick={onClose}>✕</button>
        </div>

        <div className="profile-avatar-section">
          <div className="profile-avatar-big" style={{ background: avatarColor }}>
            {getInitials(username)}
          </div>

          <div className="color-grid">
            {AVATAR_COLORS.map(c => (
              <button
                key={c}
                className={`color-swatch ${avatarColor === c ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => setAvatarColor(c)}
              />
            ))}
          </div>
        </div>

        <input value={username} onChange={e => setUsername(e.target.value)} />
        <textarea value={bio} onChange={e => setBio(e.target.value)} />

        {error && <p>{error}</p>}
        {success && <p>{success}</p>}

        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}