import { create } from "zustand";
import { storageDelete, storageGet, storageSet } from "../lib/storage";
import type { Role } from "@imut/shared";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthCompany {
  id: string;
  name?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  company: AuthCompany | null;
  subscriptionStatus: string | null;
  hydrated: boolean;
  setSession: (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    company: AuthCompany;
    subscriptionStatus?: string;
  }) => Promise<void>;
  setSubscriptionStatus: (status: string) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  company: null,
  subscriptionStatus: null,
  hydrated: false,

  setSession: async (data) => {
    await storageSet("accessToken", data.accessToken);
    await storageSet("refreshToken", data.refreshToken);
    await storageSet("user", JSON.stringify(data.user));
    await storageSet("company", JSON.stringify(data.company));
    if (data.subscriptionStatus) {
      await storageSet("subscriptionStatus", data.subscriptionStatus);
    }
    set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      company: data.company,
      subscriptionStatus: data.subscriptionStatus ?? null,
    });
  },

  setSubscriptionStatus: (status) => {
    void storageSet("subscriptionStatus", status);
    set({ subscriptionStatus: status });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userRaw, companyRaw, subStatus] =
        await Promise.all([
          storageGet("accessToken"),
          storageGet("refreshToken"),
          storageGet("user"),
          storageGet("company"),
          storageGet("subscriptionStatus"),
        ]);

      set({
        accessToken,
        refreshToken,
        user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
        company: companyRaw ? (JSON.parse(companyRaw) as AuthCompany) : null,
        subscriptionStatus: subStatus,
      });
    } finally {
      set({ hydrated: true });
    }
  },

  logout: async () => {
    await Promise.all([
      storageDelete("accessToken"),
      storageDelete("refreshToken"),
      storageDelete("user"),
      storageDelete("company"),
      storageDelete("subscriptionStatus"),
    ]);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      company: null,
      subscriptionStatus: null,
    });
  },

  isAuthenticated: () => Boolean(get().accessToken),
}));
