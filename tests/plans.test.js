import test from "node:test";
import assert from "node:assert/strict";

import { canAddRecipient, sanitizeChannelsForTier } from "../src/plans.js";

test("free plan allows adding recipients", () => {
  const state = {
    billing: { tier: "free" },
    recipients: [{ id: "a" }],
  };
  assert.equal(canAddRecipient(state), true);
});

test("free plan strips paid channels", () => {
  const out = sanitizeChannelsForTier("free", {
    inApp: true,
    email: true,
    sms: true,
  });
  assert.equal(out.inApp, true);
  assert.equal(out.email, false);
  assert.equal(out.sms, false);
});
