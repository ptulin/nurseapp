import test from "node:test";
import assert from "node:assert/strict";

import {
  shouldEscalate,
  withRole,
  validateTaskInput,
  buildEscalationContact,
  ROLE_SCREENS,
} from "../src/core.js";

test("shouldEscalate returns true after threshold", () => {
  const out = shouldEscalate({
    isDone: false,
    acknowledgedAt: null,
    dueAt: "2026-03-02T10:00:00.000Z",
    now: "2026-03-02T10:16:00.000Z",
    minutes: 15,
  });
  assert.equal(out, true);
});

test("shouldEscalate returns false if completed", () => {
  const out = shouldEscalate({
    isDone: true,
    acknowledgedAt: null,
    dueAt: "2026-03-02T10:00:00.000Z",
    now: "2026-03-02T10:30:00.000Z",
    minutes: 15,
  });
  assert.equal(out, false);
});

test("withRole assigns allowed screens", () => {
  const state = withRole({ a: 1 }, "Caregiver");
  assert.deepEqual(state.allowedScreens, ROLE_SCREENS.Caregiver);
});

test("validateTaskInput enforces category", () => {
  const result = validateTaskInput({
    recipientId: "r1",
    title: "Give meds",
    dueAt: "2026-03-02T14:00",
    category: "",
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.includes("category is required"), true);
});

test("buildEscalationContact returns primary + backups", () => {
  const chain = [
    { id: "a", name: "Ana" },
    { id: "b", name: "Ben" },
  ];
  const out = buildEscalationContact(chain, "b");
  assert.equal(out.primary.id, "b");
  assert.equal(out.backups.length, 1);
  assert.equal(out.backups[0].id, "a");
});
