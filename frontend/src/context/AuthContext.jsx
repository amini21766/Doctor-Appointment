import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { TOKEN_KEY } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, verify it and hydrate the user.
  useEffect(() => {
    let active = true;
    const init = async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        if (active) setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        if (active) {
          setUser(data.data.user);
          setToken(stored);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (active) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  // React to a globally-detected 401 (expired/invalid token).
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const persist = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setToken(nextToken || null);
    setUser(nextUser || null);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.data.token, data.data.user);
    return data.data.user;
  }, [persist]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persist(data.data.token, data.data.user);
    return data.data.user;
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem(TOKEN_KEY)) await api.post("/auth/logout");
    } catch {
      // Ignore network errors on logout — still clear locally.
    }
    persist(null, null);
  }, [persist]);

  /** Replace the cached user (e.g. after a profile update). */
  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      updateUser,
      setUser,
    }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export default AuthContext;