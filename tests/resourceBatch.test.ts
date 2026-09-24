import assert from "node:assert/strict";
import test from "node:test";
import { appendTags, appendById, applyVideoBatchChange, downloadResourceFiles, toRelatedVideo, VideoResourceMetadata } from "../src/lib/resourceBatch.ts";
import { DEFAULT_ASSOCIATED_SCRIPTS, DEFAULT_RELATED_VIDEOS, RELATED_VIDEO_OPTIONS } from "../src/data/videoResourceOptions.ts";

const records: (VideoResourceMetadata & { id: string })[] = [
  { id: "one", tags: ["original-one"], personalTags: ["mine"], status: "pending", category: "old-one", associatedScripts: DEFAULT_ASSOCIATED_SCRIPTS, relatedVideos: DEFAULT_RELATED_VIDEOS },
  { id: "two", tags: ["original-two", "new"], personalTags: [], status: "done", category: "old-two", associatedScripts: [], relatedVideos: [] },
  { id: "three", tags: ["untouched"] },
];

test("public batch additions preserve each resource's original tags and deduplicate", () => {
  const next = applyVideoBatchChange(records, ["one", "two"], { kind: "publicTags", tags: ["new", "new"] });
  assert.deepEqual(next[0].tags, ["original-one", "new"]);
  assert.deepEqual(next[1].tags, ["original-two", "new"]);
  assert.equal(next[2], records[2]);
  assert.deepEqual(records[0].tags, ["original-one"]);
  assert.deepEqual(applyVideoBatchChange(next, ["one", "two"], { kind: "publicTags", tags: ["new"] }), next);
});

test("personal tag additions do not change public tags", () => {
  const next = applyVideoBatchChange(records, ["one", "two"], { kind: "personalTags", tags: ["mine", "new"] });
  assert.deepEqual(next[0].personalTags, ["mine", "new"]);
  assert.deepEqual(next[1].personalTags, ["mine", "new"]);
  assert.equal(next[0].tags, records[0].tags);
});

test("an empty selection or empty addition never removes original tags", () => {
  assert.deepEqual(applyVideoBatchChange(records, [], { kind: "publicTags", tags: ["new"] }), records);
  assert.deepEqual(applyVideoBatchChange(records, ["one"], { kind: "publicTags", tags: [] }), records);
  assert.deepEqual(appendTags(undefined, ["first", "first"]), ["first"]);
});

test("state and category changes affect every selected record, including off-page records", () => {
  const next = applyVideoBatchChange(records, ["one", "three"], { kind: "status", value: "approved" });
  assert.equal(next[0].status, "approved");
  assert.equal(next[2].status, "approved");
  assert.equal(next[1], records[1]);
  const categorized = applyVideoBatchChange(next, ["one", "three"], { kind: "category", value: "parent / child" });
  assert.equal(categorized[0].category, "parent / child");
  assert.equal(categorized[2].category, "parent / child");
  assert.equal(categorized[1].category, "old-two");
});

test("batch script association preserves existing links and is idempotent", () => {
  const script = { ...DEFAULT_ASSOCIATED_SCRIPTS[0], id: "new-script", title: "New script" };
  const next = applyVideoBatchChange(records, ["one", "two"], { kind: "scripts", scripts: [script, script] });
  assert.equal(next[0].associatedScripts?.length, DEFAULT_ASSOCIATED_SCRIPTS.length + 1);
  assert.deepEqual(next[1].associatedScripts, [script]);
  assert.deepEqual(appendById([script], [{ ...script, title: "Replacement" }]), [script]);
});

test("batch video association retains links and excludes a resource's own ID", () => {
  const linked = toRelatedVideo(RELATED_VIDEO_OPTIONS[0]);
  const next = applyVideoBatchChange(records, ["one", "two"], { kind: "videos", videos: [linked, linked, { ...linked, id: "one" }] });
  assert.equal(next[0].relatedVideos?.length, DEFAULT_RELATED_VIDEOS.length + 1);
  assert.equal(next[1].relatedVideos?.length, 2);
  assert.equal(next[0].relatedVideos?.some(item => item.id === "one"), false);
});

test("download reports actual success and failure per file without stopping the batch", async () => {
  const saved: string[] = [];
  const inputs = ["ok-1", "broken", "ok-2"].map(id => ({ id, title: `${id}.mp4`, videoUrl: id }));
  const fetcher = (async (url: string) => url === "broken"
    ? new Response("Not found", { status: 404 })
    : new Response("video-bytes", { headers: { "Content-Type": "video/mp4" } })) as typeof fetch;
  const result = await downloadResourceFiles(inputs, (_blob, name) => saved.push(name), undefined, fetcher);
  assert.deepEqual(result.succeeded, ["ok-1", "ok-2"]);
  assert.deepEqual(result.failed, ["broken"]);
  assert.deepEqual(saved, ["ok-1.mp4", "ok-2.mp4"]);
});

test("associated videos preserve minute-based duration formats", () => {
  assert.equal(toRelatedVideo({ ...RELATED_VIDEO_OPTIONS[0], duration: "01:20" }).durationNum, 80);
});

test("download never saves an HTML fallback or empty file as a video", async () => {
  const fetcher = (async (url: string) => url === "html" ? new Response("<html>Error</html>", { headers: { "Content-Type": "text/html" } }) : new Response("")) as typeof fetch;
  const result = await downloadResourceFiles(["html", "empty"].map(id => ({ id, title: id, videoUrl: id })), () => assert.fail("must not download"), undefined, fetcher);
  assert.deepEqual(result.succeeded, []);
  assert.deepEqual(result.failed, ["html", "empty"]);
});

test("aborting download does not fetch or save another file", async () => {
  const controller = new AbortController();
  controller.abort();
  const result = await downloadResourceFiles([{ id: "one", title: "one.mp4", videoUrl: "unused" }], () => assert.fail(), controller.signal, (async () => assert.fail()) as typeof fetch);
  assert.deepEqual(result, { succeeded: [], failed: [] });
});
