"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getPortalMe } from "../services/ordersService";
import type { PortalMe } from "../types/types.Orders";

type Status = "idle" | "loading" | "ready" | "error";

interface PortalState {
  me: PortalMe | null;
  status: Status;
  /** The token `me` was loaded for, so a different login reloads it. */
  loadedFor: string | null;
  load: (token: string, force?: boolean) => Promise<void>;
  clear: () => void;
}

const usePortalStore = create<PortalState>((set, get) => ({
  me: null,
  status: "idle",
  loadedFor: null,
  load: async (token, force = false) => {
    const { loadedFor, status } = get();
    if (!force && loadedFor === token && status !== "error") return;
    set({ status: "loading", loadedFor: token });
    try {
      set({ me: await getPortalMe(), status: "ready" });
    } catch {
      // Orders not configured, or the CRM is down: no tab rather than an error.
      set({ me: null, status: "error" });
    }
  },
  clear: () => set({ me: null, status: "idle", loadedFor: null }),
}));

/**
 * Whether the signed-in user is a translator, shared by the sidebar, the
 * bottom nav and the Orders pages so it is fetched once per login.
 */
export function usePortalMe() {
  const token = useAuthStore((state) => state.token);
  const me = usePortalStore((state) => state.me);
  const status = usePortalStore((state) => state.status);
  const load = usePortalStore((state) => state.load);
  const clear = usePortalStore((state) => state.clear);

  useEffect(() => {
    if (token) void load(token);
    else clear();
  }, [token, load, clear]);

  return {
    me: token ? me : null,
    status: token ? status : "idle",
    isTranslator: Boolean(token && me?.is_translator),
    reload: () => (token ? load(token, true) : Promise.resolve()),
  };
}
