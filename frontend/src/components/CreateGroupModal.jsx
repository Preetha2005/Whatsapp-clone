import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./ProfileModal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CreateGroupModal({ users, onClose, onGroupCreated }) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleUser = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return setError("Group name is required");
    if (selected.length < 1) return setError("Select at least 1 member");
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(
        `${API}/api/groups`,
        { name: name.trim(), members: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onGroupCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Group</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <input
            type="text"
            placeholder="Group name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: "100%", padding: "10px", borderRadius: "8px",
              border: "1px solid var(--border)", background: "var(--input-bg)",
              color: "var(--text-primary)", marginBottom: "16px", fontSize: "14px"
            }}
          />
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "10px" }}>
            Select members:
          </p>
          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            {users.map(u => (
              <div
                key={u._id}
                onClick={() => toggleUser(u._id)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "8px", borderRadius: "8px", cursor: "pointer",
                  background: selected.includes(u._id) ? "var(--hover-bg)" : "transparent",
                  marginBottom: "4px"
                }}
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: u.avatarColor || "#2a3942",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: "13px"
                }}>
                  {u.username?.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                  {u.username}
                </span>
                {selected.includes(u._id) && (
                  <span style={{ marginLeft: "auto", color: "var(--accent)" }}>✓</span>
                )}
              </div>
            ))}
          </div>
          {error && (
            <p style={{ color: "#ff6b6b", fontSize: "13px", marginTop: "10px" }}>{error}</p>
          )}
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              width: "100%", padding: "12px", marginTop: "16px",
              background: "var(--accent)", color: "#fff", border: "none",
              borderRadius: "8px", fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}