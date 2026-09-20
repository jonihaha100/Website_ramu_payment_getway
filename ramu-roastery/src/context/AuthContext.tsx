"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  provider: "local" | "google";
  role: "admin" | "customer" | "b2b";
  coffeePreferences?: any;
  avatarUrl?: string;
  isVip?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password?: string) => Promise<void>;
  register: (data: Partial<User> & { password?: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ramu_user");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored));
      }
    } catch (_e) {}
    setIsLoading(false);
  }, []);

  // Save to localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("ramu_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ramu_user");
    }
  }, [user]);

  const login = async (emailOrPhone: string, password?: string) => {
    // Real login — validate against database
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailOrPhone, password })
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Login gagal");
    }

    setUser(result.data);
  };

  const register = async (data: Partial<User> & { password?: string }) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setUser({
          name: result.data.name || "New User",
          email: result.data.email || "user@example.com",
          phone: result.data.phone || "",
          gender: result.data.gender || "",
          dob: result.data.dob || "",
          provider: "local",
          role: result.data.role || "customer",
        });
      } else {
        throw new Error(result.error || "Gagal melakukan registrasi.");
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Gagal melakukan registrasi.");
    }
  };

  const loginWithGoogle = async () => {
    // DUMMY SIMULATION
    await new Promise((res) => setTimeout(res, 1200));
    setUser({
      name: "Google User",
      email: "google.user@gmail.com",
      provider: "google",
      role: "customer",
    });
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      // Optimistically update local user state first so client is always instant & retains fields like coffeePreferences
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, ...data };
        localStorage.setItem("ramu_user", JSON.stringify(updated));
        return updated;
      });

      const res = await fetch(`/api/users/${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        // Update state with data from backend, preserving local fields
        setUser((prev) => {
          if (!prev) return null;
          const merged = { ...prev, ...result.data, ...data };
          localStorage.setItem("ramu_user", JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.warn("Backend profile sync note:", err);
      // Fallback: keep optimistic local update intact
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
