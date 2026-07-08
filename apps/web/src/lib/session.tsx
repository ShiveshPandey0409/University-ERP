"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthUser, LoginResponse } from "@erp/shared";
import { apiFetch, refreshSession, setAccessToken } from "./api";

type Status = "loading" | "authenticated" | "anonymous";

interface SessionState {
  user: AuthUser | null;
  status: Status;
  login: (loginType: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await refreshSession();
      if (!active) return;
      if (!ok) {
        setStatus("anonymous");
        return;
      }
      try {
        const { user } = await apiFetch<{ user: AuthUser }>("/auth/me");
        if (!active) return;
        setUser(user);
        setStatus("authenticated");
      } catch {
        if (active) setStatus("anonymous");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = async (loginType: string, username: string, password: string) => {
    const res = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { loginType, username, password },
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
    setStatus("authenticated");
  };

  const logout = async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setStatus("anonymous");
  };

  const hasPermission = (permission: string) =>
    user?.permissions.includes(permission) ?? false;

  return (
    <SessionContext.Provider value={{ user, status, login, logout, hasPermission }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
