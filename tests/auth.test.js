import test from "node:test";
import assert from "node:assert/strict";

import {
  saveSession,
  getSession,
  clearSession,
} from "../src/auth/supabase-auth.js";

test("session save/get/clear works", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };

  saveSession({
    access_token: "a",
    refresh_token: "r",
    user: { id: "u1" },
    expires_at: 123,
  });

  const loaded = getSession();
  assert.equal(loaded.access_token, "a");
  assert.equal(loaded.user.id, "u1");

  clearSession();
  assert.equal(getSession(), null);
});
