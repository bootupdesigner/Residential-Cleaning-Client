import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";

// ✅ Create Auth Context
const AuthContext = createContext();

// ✅ Auth Provider
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // ✅ Check Authentication Status
  const checkAuthStatus = async () => {
    const token = await SecureStore.getItemAsync("authToken");

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setIsAuthenticated(true);
        setUser(response.data);
      } else {
        handleLogout();
      }
    } catch (error) {
      handleLogout();
    }
  };

  // ✅ Refresh User Profile
  const refreshUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setUser(response.data);
      }
    } catch (error) {
    }
  };

  // ✅ Login Function
  const login = async (token) => {
    try {
      await SecureStore.setItemAsync("authToken", token);
    
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, { headers });
  
      if (response.status === 200) {
        setIsAuthenticated(true);
        setUser(response.data);
        console.log("✅ User logged in successfully:", response.data);
      }
    } catch (error) {
    }
  };
  

  // ✅ Logout Function
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("authToken");
    setIsAuthenticated(false);
    setUser(null);
    router.replace("/");
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, handleLogout, checkAuthStatus, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom Hook
export const useAuth = () => useContext(AuthContext);
