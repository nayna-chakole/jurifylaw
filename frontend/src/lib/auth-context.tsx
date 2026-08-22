"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authAPI } from "./api";

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch {
      localStorage.removeItem("jurify_token");
      localStorage.removeItem("jurify_user");
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("jurify_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { access_token } = res.data;
    localStorage.setItem("jurify_token", access_token);
    setToken(access_token);
    await fetchUser();
  };

  const register = async (email: string, password: string, fullName: string) => {
    await authAPI.register({ email, password, full_name: fullName });
    await login(email, password);
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem("jurify_token");
    localStorage.removeItem("jurify_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
