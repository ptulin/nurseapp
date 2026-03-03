import { createSeedState } from "../seed.js";
import { getSession } from "../auth/supabase-auth.js";

async function request(url, anonKey, { method = "GET", body, accessToken } = {}) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function createSupabaseAdapter(config, localAdapter) {
  const { url, anonKey, householdId } = config || {};

  return {
    mode: "supabase",
    async loadState() {
      if (!url || !anonKey) return localAdapter.loadState();
      try {
        const accessToken = getSession()?.access_token;
        const endpoint = `${url}/rest/v1/app_state_snapshots?household_id=eq.${encodeURIComponent(householdId)}&select=payload&order=updated_at.desc&limit=1`;
        const rows = await request(endpoint, anonKey, { accessToken });
        const payload = rows?.[0]?.payload;
        return payload || createSeedState();
      } catch {
        return localAdapter.loadState();
      }
    },
    async saveState(state) {
      if (!url || !anonKey) return localAdapter.saveState(state);
      try {
        const accessToken = getSession()?.access_token;
        const endpoint = `${url}/rest/v1/app_state_snapshots`;
        await request(endpoint, anonKey, {
          method: "POST",
          accessToken,
          body: {
            household_id: householdId,
            payload: state,
          },
        });
        return true;
      } catch {
        return localAdapter.saveState(state);
      }
    },
    async bootstrapHousehold(name) {
      if (!url || !anonKey) throw new Error("Supabase not configured");
      const accessToken = getSession()?.access_token;
      if (!accessToken) throw new Error("Sign in first");
      const endpoint = `${url}/rest/v1/rpc/bootstrap_household`;
      const result = await request(endpoint, anonKey, {
        method: "POST",
        accessToken,
        body: { p_household_name: name || "My Household" },
      });
      if (typeof result === "string") return result;
      if (Array.isArray(result) && result[0] && typeof result[0] === "object") {
        return result[0].bootstrap_household || result[0].id || "";
      }
      if (typeof result === "object" && result) return result.bootstrap_household || result.id || "";
      return "";
    },
  };
}
