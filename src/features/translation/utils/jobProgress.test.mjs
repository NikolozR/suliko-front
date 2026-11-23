import test from "node:test";
import assert from "node:assert/strict";
import { computeProgress, isRunningLong } from "./jobProgress.ts";

const base = { stage: "translating", sectionsDone: null, sectionsTotal: null, elapsedMs: 0, expectedMs: 60_000 };

test("sections drive the bar exactly and are not marked as estimates", () => {
  const half = computeProgress({ ...base, sectionsDone: 3, sectionsTotal: 6 });
  assert.equal(half.estimated, false);
  assert.equal(Math.round(half.percent), 49);
  const none = computeProgress({ ...base, sectionsDone: 0, sectionsTotal: 6 });
  assert.equal(none.percent, 8);
  const all = computeProgress({ ...base, sectionsDone: 6, sectionsTotal: 6 });
  assert.equal(all.percent, 90);
});

test("a single request follows elapsed time, marked as an estimate, and levels off under 90", () => {
  const early = computeProgress({ ...base, elapsedMs: 10_000 });
  const later = computeProgress({ ...base, elapsedMs: 120_000 });
  const forever = computeProgress({ ...base, elapsedMs: 10_000_000 });
  assert.equal(early.estimated, true);
  assert.ok(early.percent > 8 && early.percent < later.percent);
  assert.ok(forever.percent <= 90);
});

test("terminal and early stages", () => {
  assert.equal(computeProgress({ ...base, stage: "ready" }).percent, 100);
  assert.equal(computeProgress({ ...base, stage: "rebuilding" }).percent, 95);
  assert.equal(computeProgress({ ...base, stage: "queued" }).percent, 4);
  assert.equal(computeProgress({ ...base, stage: null }).percent, 4);
});

test("running long needs both a margin over the estimate and a fixed grace", () => {
  assert.equal(isRunningLong(100_000, 60_000), false);
  assert.equal(isRunningLong(130_000, 60_000), true);
  assert.equal(isRunningLong(1_000_000, 0), false);
});
