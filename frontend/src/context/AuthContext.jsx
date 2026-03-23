import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // ✅ FIXED BASE URL
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
  try {
    const { data } = await axios.get(`${API}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setUser(data);
  } catch (err) {
    console.error("fetchMe error:", err.response?.data || err.message);
    // ❌ DO NOT logout immediately
  } finally {
    setLoading(false);
  }
};

  const login = async (email, password) => {
   const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);

    const profile = await axios.get(`${API}/api/users/me`);
    setUser(profile.data);
  };

  const register = async (username, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, {
  username,
  email,
  password,
});
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);

    const profile = await axios.get(`${API}/api/users/me`);
    setUser(profile.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);