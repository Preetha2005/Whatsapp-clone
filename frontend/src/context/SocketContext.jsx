import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [lastSeen, setLastSeen] = useState({});

  useEffect(() => {
    if (!token) return;

    const s = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
    });

    // Initial online users list
    s.on("online_users", (list) => {
      setOnlineUsers(list);
    });

    // Real-time status updates
    s.on("user_status", ({ userId, isOnline, lastSeen: ls }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: isOnline }));
      if (ls) setLastSeen((prev) => ({ ...prev, [userId]: ls }));
    });

    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, lastSeen }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
