import test from "node:test";
import assert from "node:assert/strict";

import { parseScheduleText } from "../src/importer.js";

test("parseScheduleText extracts items with nearest time", () => {
  const text = `\n07:00\nAGUA\nALOIS\n07:30 GINASTICA\n08:30 FISIOTERAPIA\n`;
  const items = parseScheduleText(text);

  assert.equal(items.length >= 4, true);
  assert.equal(items[0].time, "07:00");
  assert.equal(items[0].title, "AGUA");
  assert.equal(items[1].time, "07:00");
  assert.equal(items[2].time, "07:30");
});

test("parseScheduleText infers medication category", () => {
  const text = `22:00\nGABAPENTINA`;
  const items = parseScheduleText(text);
  assert.equal(items[0].type, "med");
  assert.equal(items[0].category, "Medication");
});
