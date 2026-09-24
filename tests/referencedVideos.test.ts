import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_DEPTS, INITIAL_MEMBERS } from "../src/data/adminAccounts";
import { createReferencedVideoExamples, referenceEntityOptions, selectReferencedVideos, referencedVideoTotals, validReferenceRange, type ReferenceFilters } from "../src/lib/referencedVideoData";

const org = { depts: INITIAL_DEPTS, members: INITIAL_MEMBERS };
const videos = createReferencedVideoExamples(org, "2026-09-22");
const filters: ReferenceFilters = { dimension: "author", entityId: "", upload: { start: "", end: "" } };
const allTime = { start: "", end: "" };
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("reference examples and entity options resolve admin identities", () => {
  assert.equal(videos.length, 3);
  for (const video of videos) {
    const member = org.members.find(member => member.id === video.memberId)!;
    assert.equal(video.author, member.name);
    assert.equal(video.organizationId, member.deptId);
    assert.ok(video.daily.every(day => day.date >= video.date));
  }
  for (const dimension of ["team", "group", "author"] as const) {
    const options = referenceEntityOptions(org, dimension);
    assert.ok(options.length);
    assert.equal(new Set(options.map(option => option.id)).size, options.length);
    assert.ok(options.every(option => dimension === "author" ? org.members.some(member => member.id === option.id) : org.depts.some(node => node.id === option.id && node.levelType === (dimension === "team" ? "department" : "group"))));
  }
});

test("team, group and author scopes apply to both the videos and their aggregated facts", () => {
  const byTeam = selectReferencedVideos(videos, org, { ...filters, dimension: "team", entityId: "dept_1" }, "按关联时间排序");
  assert.deepEqual(byTeam.map(video => video.id), ["dv1", "dv2"]);
  const byGroup = selectReferencedVideos(videos, org, { ...filters, dimension: "group", entityId: "dept_1_2" }, "按关联时间排序");
  assert.deepEqual(byGroup.map(video => video.id), ["dv1"]);
  const byAuthor = selectReferencedVideos(videos, org, { ...filters, entityId: "mem_demo_4" }, "按关联时间排序");
  assert.deepEqual(byGroup, byAuthor);
  assert.equal(referencedVideoTotals(byAuthor, allTime).cost, 1280);
  assert.equal(referencedVideoTotals(byTeam, allTime).cost, 4730);
});

test("upload dates include both boundaries and combine with organization filters", () => {
  const upload = { start: "2026-09-05", end: "2026-09-08" };
  const selected = selectReferencedVideos(videos, org, { ...filters, upload }, "按关联时间排序");
  assert.deepEqual(selected.map(video => video.id), ["dv1", "dv2"]);
  assert.equal(referencedVideoTotals(selected, allTime).cost, 4730);
  assert.deepEqual(selectReferencedVideos(videos, org, { ...filters, entityId: "mem_demo_6", upload }, "按关联时间排序"), []);
  assert.deepEqual(selectReferencedVideos(videos, org, { ...filters, upload: { start: "2040-01-01", end: "" } }, "按关联时间排序"), []);
});

test("spend ranges change totals only, leaving list membership, card values and sorting untouched", () => {
  const selected = selectReferencedVideos(videos, org, filters, "按消耗金额排序");
  const snapshot = structuredClone(selected);
  assert.deepEqual(selected.map(video => video.id), ["dv2", "dv1", "dv3"]);
  const history = referencedVideoTotals(selected, allTime);
  const recent = referencedVideoTotals(selected, { start: "2026-09-16", end: "2026-09-22" });
  assert.ok(recent.cost > 0 && recent.cost < history.cost);
  assert.equal(referencedVideoTotals([selected[2]], { start: "2026-09-16", end: "2026-09-22" }).cost, 0);
  assert.ok(Object.values(referencedVideoTotals(selected, { start: "2000-01-01", end: "2000-01-02" })).every(value => value === 0));
  assert.deepEqual(selected, snapshot);
  assert.deepEqual(selectReferencedVideos(videos, org, filters, "按关联时间排序").map(video => video.id), ["dv1", "dv2", "dv3"]);
});

test("daily amounts reconcile, and ROI and rates are recomputed from additive totals", () => {
  for (const video of videos) {
    const total = referencedVideoTotals([video], allTime);
    near(total.cost, video.cost);
    near(total.roi, video.roi);
    assert.equal(total.conversions, video.conversions);
  }
  const total = referencedVideoTotals(videos, allTime);
  near(total.cost, videos.reduce((sum, video) => sum + video.cost, 0));
  near(total.roi, total.totalAmount / total.cost);
  near(total.totalAmount, total.paid + total.coupon + total.subsidy);
  near(total.ctr, total.clicks / total.impressions * 100);
  near(total.cvr, total.conversions / total.clicks * 100);
  assert.ok(total.completionRate <= total.effectivePlayRate && total.effectivePlayRate <= 100);
  assert.ok(total.netOrders <= total.conversions && total.netAmount <= total.totalAmount);
  const oneDay = referencedVideoTotals(videos, { start: "2026-09-22", end: "2026-09-22" });
  near(oneDay.cost, videos[0].daily.at(-1)!.cost / 100);
});

test("renames keep stable selection identities; missing or cyclic organization nodes are safe", () => {
  const renamed = { ...org, members: org.members.map(member => ({ ...member, name: `${member.name}-新名称` })), depts: org.depts.map(node => ({ ...node, name: `${node.name}-新名称` })) };
  const updated = createReferencedVideoExamples(renamed, "2026-09-22");
  assert.ok(updated.every(video => video.author.endsWith("新名称")));
  assert.equal(selectReferencedVideos(updated, renamed, { ...filters, entityId: "mem_demo_4" }, "").length, 1);
  const noMembers = createReferencedVideoExamples({ ...org, members: [] }, "2026-09-22");
  assert.ok(noMembers.every(video => video.author === "未关联员工" && video.organizationId === ""));
  const cyclic = { ...org, depts: org.depts.map(node => ({ ...node, parentId: node.id })) };
  assert.deepEqual(selectReferencedVideos(videos, cyclic, { ...filters, dimension: "team", entityId: "missing" }, ""), []);
});

test("reversed and empty ranges never produce NaN or misleading nonzero totals", () => {
  const invalid = { start: "2026-10-01", end: "2026-09-01" };
  assert.equal(validReferenceRange(invalid), false);
  assert.equal(validReferenceRange(allTime), true);
  assert.deepEqual(selectReferencedVideos(videos, org, { ...filters, upload: invalid }, ""), []);
  assert.ok(Object.values(referencedVideoTotals(videos, invalid)).every(value => value === 0));
  assert.ok(Object.values(referencedVideoTotals([], allTime)).every(value => value === 0));
});
