import { createLocalAdapter } from "./local-adapter.js";
import { createSupabaseAdapter } from "./supabase-adapter.js";

export function createDataAdapter(runtimeConfig) {
  const local = createLocalAdapter();

  if (runtimeConfig.dataMode === "supabase") {
    return createSupabaseAdapter(runtimeConfig.supabase, local);
  }

  return local;
}
