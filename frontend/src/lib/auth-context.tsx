"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "./api";

type AppRole = "admin" | "professor";

interface User {
  id: string;
  nome: string;
  email: string;
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (nome: string, email: string, senha: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<User>("/auth/me")
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, senha: string) => {
    const data = await api.post<{ user: User; token: string }>("/auth/login", { email, senha });
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const signUp = async (nome: string, email: string, senha: string) => {
    const data = await api.post<{ user: User; token: string }>("/auth/register", { nome, email, senha });
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
