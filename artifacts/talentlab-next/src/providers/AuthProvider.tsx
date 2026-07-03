"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  companyId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Read cached sessions from local storage
    const cachedToken = localStorage.getItem("rms_token");
    const cachedUser = localStorage.getItem("rms_user");

    if (cachedToken && cachedUser) {
      try {
        setToken(cachedToken);
        setUser(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem("rms_token");
        localStorage.removeItem("rms_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem("rms_token", newToken);
    localStorage.setItem("rms_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.replace("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("rms_token");
    localStorage.removeItem("rms_user");
    setToken(null);
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
