import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { INITIAL_DEPTS, INITIAL_MEMBERS } from "../src/data/adminAccounts";
import { DEFAULT_RELATED_VIDEOS, RELATED_VIDEO_OPTIONS } from "../src/data/videoResourceOptions";
import { createReferencedVideoExamples } from "../src/lib/referencedVideoData";
import { shotReferenceCard, producedReferenceCard } from "../src/lib/referenceVideoCards";
import { toRelatedVideo } from "../src/lib/resourceBatch";

test("reference cards preserve source identity and separate usage duration from full media duration", () => {
  const source = DEFAULT_RELATED_VIDEOS[0];
  const card = shotReferenceCard(source);
  assert.equal(source.duration, "16.7秒");
  assert.equal(card.duration, "30s");
  assert.equal(card.numericId, source.code);
  assert.equal(card.downloads, source.useCount);
  assert.equal(card.referenceCount, source.viewCount);
  assert.equal(card.status, source.status);
  assert.equal(card.author, source.author);
  assert.deepEqual(card.relatedVideos, []);
  assert.ok(existsSync(`public/${card.videoUrl}`));
});

test("adding related videos retains the selected source's media and resource metadata", () => {
  for (const source of RELATED_VIDEO_OPTIONS) {
    const related = toRelatedVideo(source);
    const card = shotReferenceCard(related);
    assert.equal(card.videoUrl, source.url);
    assert.equal(card.duration, source.duration);
    assert.equal(card.status, source.status);
    assert.equal(card.category, `${source.primaryCategory} / ${source.secondaryCategory}`);
    assert.deepEqual(card.tags, source.tags);
    assert.ok(existsSync(`public/${card.videoUrl}`));
  }
  const missing = shotReferenceCard({ ...DEFAULT_RELATED_VIDEOS[0], videoUrl: undefined });
  assert.equal(missing.videoUrl, "");
});

test("produced cards use resource review status and reconcile cost without changing attribution facts", () => {
  const sources = createReferencedVideoExamples({ depts: INITIAL_DEPTS, members: INITIAL_MEMBERS });
  const before = structuredClone(sources);
  for (const source of sources) {
    const card = producedReferenceCard(source);
    assert.equal(card.id, source.id);
    assert.equal(card.author, source.author);
    assert.equal(card.cost, source.cost);
    assert.equal(card.roi, source.roi);
    assert.equal(card.status, "审核通过");
    assert.ok(Math.abs(Object.values(card.monthlyCosts!).reduce((sum, cost) => sum + cost, 0) - source.cost) < 1e-8);
    assert.ok(existsSync(`public/${card.videoUrl}`));
  }
  assert.deepEqual(sources, before);
});
