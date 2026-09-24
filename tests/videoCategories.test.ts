import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_FINISHED } from "../src/data/finishedVideos.ts";
import { CATEGORY_TREE } from "../src/data/videoResourceOptions.ts";
import { getVideoSecondaryCategories, parseVideoCategory } from "../src/lib/videoCategories.ts";
import { isViralVideo } from "../src/lib/viralVideoRule.ts";

test("category paths separate the two levels without promoting a legacy primary category", () => {
  assert.deepEqual(parseVideoCategory(" 数码科技 / 智能手表 "), { primary: "数码科技", secondary: "智能手表" });
  assert.deepEqual(parseVideoCategory("数码科技"), { primary: "数码科技", secondary: "" });
  assert.deepEqual(parseVideoCategory(), { primary: "", secondary: "" });
});

test("secondary options deduplicate assigned categories and ignore missing assignments", () => {
  assert.deepEqual(getVideoSecondaryCategories([
    { category: "美妆护肤 / 面部护肤" },
    { category: "个护美妆 / 面部护肤" },
    { category: "面部护肤" },
    {},
  ]), ["面部护肤"]);
});

test("all current viral examples have a secondary category available in the resource editor", () => {
  const viral = INITIAL_FINISHED.filter(video => isViralVideo(video, { period: "monthly", thresholdWan: 10 }, "2026-09"));
  assert.equal(viral.length, 14);
  assert.equal(getVideoSecondaryCategories(viral).length, 11);
  for (const video of viral) {
    const { primary, secondary } = parseVideoCategory(video.category);
    assert.ok(secondary, video.id);
    assert.ok(CATEGORY_TREE.find(category => category.name === primary)?.subs.includes(secondary), video.category);
  }
});
