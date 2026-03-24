import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import AIChat from "../components/AIChat";
import ProfileModal from "../components/ProfileModal";
import CreateGroupModal from "../components/CreateGroupModal";
import GroupChatWindow from "../components/GroupChatWindow";
import CallModal from "../components/CallModal";
import "./Chat.css";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Chat() {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Call state
  const [callModal, setCallModal] = useState(null);
  const [isIncoming, setIsIncoming] = useState(false);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setUsers(data))
      .catch(err => console.error(err));

    axios.get(`${API}/api/groups`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setGroups(data))
      .catch(err => console.error(err));
  }, [token]);

  // WebRTC call handlers
  useEffect(() => {
    if (!socket) return;

    socket.on("incoming_call", ({ from, type, username, avatarColor, offer }) => {
      setIsIncoming(true);
      setCallModal({ from, type, username, avatarColor, offer });
    });

    socket.on("call_accepted", async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
      }
    });

    socket.on("call_rejected", () => {
      endCall();
    });

    socket.on("ice_candidate", async ({ candidate }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    });

    return () => {
      socket.off("incoming_call");
      socket.off("call_accepted");
      socket.off("call_rejected");
      socket.off("ice_candidate");
    };
  }, [socket]);

  const startCall = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice_candidate", {
            to: selectedUser._id,
            candidate: e.candidate,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call_user", {
        to: selectedUser._id,
        type,
        offer,
        username: selectedUser.username,
        avatarColor: selectedUser.avatarColor,
      });

      setIsIncoming(false);
      setCallModal({
        to: selectedUser._id,
        type,
        username: selectedUser.username,
        avatarColor: selectedUser.avatarColor,
      });
    } catch (err) {
      alert("Could not access camera/microphone: " + err.message);
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    localStreamRef.current = null;
    peerConnectionRef.current = null;
    setCallModal(null);
    setIsIncoming(false);
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setSelectedGroup(null);
    setShowAI(false);
  };

  const handleSelectGroup = (g) => {
    setSelectedGroup(g);
    setSelectedUser(null);
    setShowAI(false);
  };

  const handleOpenAI = () => {
    setShowAI(true);
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  const handleGroupCreated = (group) => {
    setGroups(prev => [group, ...prev]);
    handleSelectGroup(group);
  };

  return (
    <div className="chat-layout">
      <Sidebar
        users={users}
        groups={groups}
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
        onSelectUser={handleSelectUser}
        onSelectGroup={handleSelectGroup}
        onOpenProfile={() => setShowProfile(true)}
        onOpenAI={handleOpenAI}
        onCreateGroup={() => setShowCreateGroup(true)}
      />
      {showAI ? (
        <AIChat />
      ) : selectedGroup ? (
        <GroupChatWindow group={selectedGroup} />
      ) : (
        <ChatWindow selectedUser={selectedUser} onCall={startCall} />
      )}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showCreateGroup && (
        <CreateGroupModal
          users={users}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
      {callModal && (
        <CallModal
          call={callModal}
          isIncoming={isIncoming}
          localStream={localStreamRef.current}
          peerConnection={peerConnectionRef.current}
          onClose={endCall}
        />
      )}
    </div>
  );
}