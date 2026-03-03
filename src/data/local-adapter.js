import { createSeedState } from "../seed.js";

const STORAGE_KEY = "nurseapp_mvp_state_v2";

export function createLocalAdapter() {
  return {
    mode: "local",
    async loadState() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createSeedState();
      try {
        return JSON.parse(raw);
      } catch {
        return createSeedState();
      }
    },
    async saveState(state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    },
    async bootstrapHousehold() {
      throw new Error("Bootstrap is available only in supabase mode");
    },
  };
}
