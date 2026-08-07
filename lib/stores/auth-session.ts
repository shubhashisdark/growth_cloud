"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthMembership {
  workspaceId: string;
  workspaceName?: string;
  role: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status?: string;
  emailVerifiedAt?: string | null;
  memberships?: AuthMembership[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  workspaceId: string;
  user: AuthUser;
}

export function toAuthSession(payload: {
  accessToken: string;
  refreshToken: string;
  workspaceId?: string;
  user: AuthUser;
}): AuthSession {
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    workspaceId: payload.workspaceId ?? payload.user.memberships?.[0]?.workspaceId ?? "",
    user: payload.user,
  };
}

export interface AuthSessionState {
  session: AuthSession | null;
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  markHydrated: () => void;
}

const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== "undefined") localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window !== "undefined") localStorage.removeItem(name);
  },
};

export const useAuthSessionStore = create<AuthSessionState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "growth-cloud-auth-session",
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
