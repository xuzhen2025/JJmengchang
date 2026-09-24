import assert from "node:assert/strict";
import test from "node:test";
import { createFaceSwapDemo } from "../src/data/faceSwapDemo.ts";
import { advanceFaceSwap, beginFaceSwap, cancelFaceSwap, faceSwapTask, mergeFaceGroups, splitFaceGroup, undoFaceGrouping } from "../src/lib/videoFaceSwap.ts";

const source = { id: "source", name: "原片.mp4", url: "blob:full-video", size: "15 MB", duration: 90, resolution: "1920x1080" };
function ready() { return advanceFaceSwap(createFaceSwapDemo(source, 1000), 4000); }
function configured() { const session = ready(); session.groups[0].portrait = { id: "p1", name: "人像1", url: "portrait1.jpg" }; return session; }

test("analysis is free, three seconds, and becomes ready rather than a finished result", () => {
  const session = createFaceSwapDemo(source, 1000);
  assert.equal(advanceFaceSwap(session, 3999), session);
  const done = advanceFaceSwap(session, 4000);
  assert.equal(done.phase, "ready");
  assert.equal(faceSwapTask("task1", done, 4000).status, "ready");
  assert.equal(faceSwapTask("task1", done, 4000).creditsCost, 0);
});
test("no face and analysis failures produce no charge", () => {
  for (const outcome of ["no_faces", "failure"] as const) {
    const session = advanceFaceSwap({ ...createFaceSwapDemo(source, 1000), analysisOutcome: outcome }, 4000);
    assert.equal(session.phase, "analysis_failed");
    assert.equal(session.attempts.length, 0);
    assert.equal(beginFaceSwap(session, "blocked", 5000), session);
  }
});
test("unconfigured roles stay unchanged and all-empty submission is rejected", () => {
  const empty = ready(); assert.equal(beginFaceSwap(empty, "a", 5000), empty);
  const next = beginFaceSwap(configured(), "a", 5000);
  assert.equal(next.attempts[0].cost, 40);
  assert.equal(next.attempts[0].groups[1].portrait, null);
  assert.equal(beginFaceSwap(next, "b", 5001), next);
});
test("merge keeps target portrait, moves all crops once, and supports undo", () => {
  const session = configured(); session.groups[1].portrait = { id: "p2", name: "人像2", url: "portrait2.jpg" };
  const merged = mergeFaceGroups(session, session.groups[0].id, session.groups[1].id);
  assert.equal(merged.groups.length, 2);
  assert.equal(merged.groups[0].portrait?.id, "p2");
  const cropIds = merged.groups.flatMap((group) => group.cropIds);
  assert.equal(cropIds.length, 7); assert.equal(new Set(cropIds).size, 7);
  assert.deepEqual(undoFaceGrouping(merged).groups, session.groups);
});
test("split moves selected crops into an empty-config group and rejects whole-group or empty splits", () => {
  const session = configured(); const group = session.groups[0];
  assert.equal(splitFaceGroup(session, group.id, [], "new"), session);
  assert.equal(splitFaceGroup(session, group.id, group.cropIds, "new"), session);
  const split = splitFaceGroup(session, group.id, [group.cropIds[1]], "new");
  assert.equal(split.groups[0].portrait?.id, "p1");
  assert.equal(split.groups.at(-1)?.portrait, null);
  assert.deepEqual(split.groups.at(-1)?.cropIds, [group.cropIds[1]]);
  assert.deepEqual(split.groups[0].cropIds, [group.cropIds[0]]);
  assert.deepEqual(undoFaceGrouping(split).groups, session.groups);
});
test("cancel works only before the two-second boundary and refunds once", () => {
  const session = beginFaceSwap(configured(), "a", 5000);
  const cancelled = cancelFaceSwap(session, 6999);
  assert.equal(cancelled.phase, "cancelled"); assert.equal(cancelled.attempts[0].refunded, 40);
  assert.equal(cancelFaceSwap(cancelled, 6999), cancelled);
  assert.equal(cancelFaceSwap(session, 7000), session);
  assert.equal(advanceFaceSwap(session, 7000).phase, "processing");
});
test("six-second completion keeps full source and creates version1", () => {
  const session = beginFaceSwap(configured(), "a", 5000);
  assert.equal(advanceFaceSwap(session, 10999).phase, "processing");
  const done = advanceFaceSwap(session, 11000);
  assert.equal(done.phase, "succeeded"); assert.equal(done.versions[0].number, 1);
  assert.equal(done.source.duration, 90); assert.equal(done.versions[0].videoUrl, source.url);
  assert.equal(done.selectedVersionId, done.versions[0].id);
  assert.equal(advanceFaceSwap(done, 12000), done);
});
test("one task holds immutable versions and per-attempt billing through failure, cancellation, and retry", () => {
  const v1 = advanceFaceSwap(beginFaceSwap(configured(), "a", 5000), 11000);
  const v1Snapshot = structuredClone(v1.versions[0]);
  const edited = mergeFaceGroups(v1, v1.groups[1].id, v1.groups[0].id);
  const failed = advanceFaceSwap(beginFaceSwap(edited, "b", 12000, "failure"), 18000);
  assert.deepEqual(failed.versions[0], v1Snapshot); assert.equal(failed.attempts[1].refunded, 40);
  const cancelled = cancelFaceSwap(beginFaceSwap(failed, "c", 20000), 20001);
  const v2 = advanceFaceSwap(beginFaceSwap(cancelled, "d", 24000), 30000);
  assert.deepEqual(v2.versions.map((version) => version.number), [1, 2]);
  assert.deepEqual(v2.versions[0], v1Snapshot);
  const task = faceSwapTask("same-task", v2, 30000);
  assert.equal(task.id, "same-task"); assert.equal(task.creditsCost, 160); assert.equal(task.refundedCredits, 80);
});
