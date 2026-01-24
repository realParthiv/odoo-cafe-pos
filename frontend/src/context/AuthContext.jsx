import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../services/apiService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("auth");
  const [lastSession, setLastSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("userRole");

    if (storedUser && storedRole) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      console.log("Login response:", response);
      if (response.success) {
        return handleLoginSuccess(response.data);
      }
    } catch (error) {
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const handleLoginSuccess = (data) => {
    const { user, tokens, last_session } = data;

    localStorage.setItem("accessToken", tokens.access);
    localStorage.setItem("refreshToken", tokens.refresh);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("userRole", user.role);
    if (last_session) {
      localStorage.setItem("lastSession", JSON.stringify(last_session));
    }

    setUser(user);
    setRole(user.role);
    setLastSession(last_session);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setUser(null);
    setRole("auth");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        lastSession,
        login,
        logout,
        loading,
        handleLoginSuccess,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
