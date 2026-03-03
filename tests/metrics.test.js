import test from "node:test";
import assert from "node:assert/strict";

import { computeDashboardMetrics } from "../src/metrics.js";

test("computeDashboardMetrics returns rates and averages", () => {
  const state = {
    tasks: [
      {
        status: "done",
        dueAt: "2026-03-03T10:00:00.000Z",
        acknowledgedAt: "2026-03-03T10:15:00.000Z",
      },
      { status: "missed", dueAt: "2026-03-03T11:00:00.000Z", acknowledgedAt: null },
      { status: "pending", dueAt: "2026-03-03T12:00:00.000Z", acknowledgedAt: null },
    ],
    audit: [{ action: "role.switch" }, { action: "role.switch" }],
  };

  const out = computeDashboardMetrics(state);
  assert.equal(out.totalTasks, 3);
  assert.equal(out.openTasks, 2);
  assert.equal(out.doneRate, 33);
  assert.equal(out.missedRate, 33);
  assert.equal(out.avgAckMin, 15);
  assert.equal(out.roleSwitches, 2);
});
