import { createSeedState } from "../seed.js";

async function request(url, anonKey, { method = "GET", body } = {}) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
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
        const endpoint = `${url}/rest/v1/app_state_snapshots?household_id=eq.${encodeURIComponent(householdId)}&select=payload&order=updated_at.desc&limit=1`;
        const rows = await request(endpoint, anonKey);
        const payload = rows?.[0]?.payload;
        return payload || createSeedState();
      } catch {
        return localAdapter.loadState();
      }
    },
    async saveState(state) {
      if (!url || !anonKey) return localAdapter.saveState(state);
      try {
        const endpoint = `${url}/rest/v1/app_state_snapshots`;
        await request(endpoint, anonKey, {
          method: "POST",
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
  };
}
