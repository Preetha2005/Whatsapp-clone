import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./ProfileModal.css";

// ✅ FIXED
const API = import.meta.env.VITE_API_URL;

export default function ProfileModal({ onClose }) {
  const { user, token } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#00a884");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await axios.put(
        `${API}/api/users/profile`, // ✅ FIXED
        { username, bio, avatarColor },
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ IMPORTANT
          },
        }
      );

      setSuccess("Profile updated!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    // UI remains same (no change needed)
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Profile</h2>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        {error && <p>{error}</p>}
        {success && <p>{success}</p>}

        <button onClick={handleSave}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}