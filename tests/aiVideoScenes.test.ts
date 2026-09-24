import assert from "node:assert/strict";
import test from "node:test";
import { getAiVideoInputs, migrateQuickCreationVideoTask, validateAiVideoScene } from "../src/lib/aiVideo.ts";
import type { AiVideoMediaItem, Task } from "../src/types.ts";

const image: AiVideoMediaItem = { id: "image", name: "product.jpg", type: "image", url: "blob:product" };
const video: AiVideoMediaItem = { id: "video", name: "usage.mp4", type: "video", url: "blob:usage" };

test("pain comparison accepts all four input combinations with an optional prompt", () => {
  for (const painMaterial of [image, video]) for (const solutionMaterial of [image, video]) {
    for (const prompt of [undefined, "", "   ", "Compare the before and after results"]) {
      assert.equal(validateAiVideoScene("pain_comparison", { painMaterial, solutionMaterial, prompt }), "");
    }
  }
  assert.notEqual(validateAiVideoScene("pain_comparison", { painMaterial: image }), "");
  assert.notEqual(validateAiVideoScene("pain_comparison", { solutionMaterial: image, prompt: "description alone" }), "");
});

test("usage process requires a video and a product image in their respective slots", () => {
  assert.equal(validateAiVideoScene("usage_process", { usageVideo: video, productImage: image }), "");
  assert.notEqual(validateAiVideoScene("usage_process", { usageVideo: image, productImage: video }), "");
  assert.notEqual(validateAiVideoScene("usage_process", { productImage: image, prompt: "create a video" }), "");
});

test("task inputs include only the two roles for the submitted scene", () => {
  assert.deepEqual(getAiVideoInputs({ mode: "pain_comparison", model: "星绘 Pro", ratio: "9:16", duration: 8, painMaterial: image, solutionMaterial: video, references: [video], productImage: image }).map((item) => item.id), ["image", "video"]);
});

test("moving legacy records preserves identity, outputs and charges for every state", () => {
  for (const status of ["queue", "generating", "completed", "failed", "cancelled"] as const) {
    const task: Task = {
      id: `old-${status}`, name: "使用过程生成", type: "video_gen", category: "quick_creation", status, progress: 45,
      createdAt: "2026-09-10 11:00:00", creditsCost: 60, refundedCredits: status === "cancelled" ? 60 : 0,
      inputFiles: [video.url, image.url], outputFiles: ["result.mp4"], simulationStartedAt: 1000,
      quickCreationSnapshot: { mode: "video", preset: "使用过程", prompt: "unused free-generation draft", referenceImages: [],
        roleMaterials: [{ role: "使用过程视频", ...video }, { role: "商品图片", ...image }],
        imageAspectRatio: "3:4", imageQuality: "2K", imageCount: 1, videoAspectRatio: "16:9", videoLength: 20, model: "云镜 Max" },
    };
    const migrated = migrateQuickCreationVideoTask(task);
    assert.equal(migrated.id, task.id);
    assert.equal(migrated.status, status);
    assert.equal(migrated.creditsCost, task.creditsCost);
    assert.equal(migrated.refundedCredits, task.refundedCredits);
    assert.equal(migrated.simulationStartedAt, 1000);
    assert.equal(migrated.outputFiles, task.outputFiles);
    assert.equal(migrated.category, "ai_video");
    assert.equal(migrated.aiVideoSnapshot?.mode, "usage_process");
    assert.equal(migrated.aiVideoSnapshot?.prompt, "");
    assert.equal(migrated.aiVideoSnapshot?.duration, 20);
    assert.equal(migrated.aiVideoSnapshot?.usageVideo?.url, video.url);
    assert.equal(migrated.aiVideoSnapshot?.productImage?.url, image.url);
    assert.equal(migrateQuickCreationVideoTask(migrated), migrated);
    assert.equal(migrateQuickCreationVideoTask({ ...task, quickCreationSnapshot: { ...task.quickCreationSnapshot!, preset: "产品素材" } }).category, "quick_creation");
  }
});
