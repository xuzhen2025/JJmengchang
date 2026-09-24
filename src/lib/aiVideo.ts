import type { AiVideoMode, AiVideoSceneInputs, AiVideoSceneMode, AiVideoTaskSnapshot, Task } from "../types";
import { QUICK_CREATION_MODEL_OPTIONS } from "./creationModels";

export const AI_VIDEO_MODE_LABELS: Record<AiVideoMode, string> = {
  reference: "参考生视频",
  first_last: "首尾帧生视频",
  dubbing: "配音生视频",
  background: "视频编辑-换背景",
  outfit: "视频编辑-换装",
  pain_comparison: "痛点对比",
  usage_process: "使用过程",
};

export const AI_VIDEO_SCENE_MODELS = QUICK_CREATION_MODEL_OPTIONS.map((model) => ({
  id: model.name,
  name: model.name,
  description: `视频 ${model.videoCost} 积分/次，最长 ${model.maxSeconds} 秒`,
  badge: "",
  maxSeconds: model.maxSeconds,
  videoCost: model.videoCost,
}));

export const isAiVideoSceneMode = (mode: AiVideoMode): mode is AiVideoSceneMode =>
  mode === "pain_comparison" || mode === "usage_process";

export function validateAiVideoScene(mode: AiVideoSceneMode, inputs: AiVideoSceneInputs): string {
  const validMedia = (media: AiVideoSceneInputs["painMaterial"]) =>
    Boolean(media?.url && (media.type === "image" || media.type === "video"));
  if (mode === "pain_comparison" && (!validMedia(inputs.painMaterial) || !validMedia(inputs.solutionMaterial))) {
    return "请分别上传 1 份痛点素材和解决痛点素材，支持图片或视频。";
  }
  if (mode === "usage_process" && (!inputs.usageVideo?.url || inputs.usageVideo.type !== "video" || !inputs.productImage?.url || inputs.productImage.type !== "image")) {
    return "请上传 1 个使用过程视频和 1 张商品图片。";
  }
  return "";
}

export function getAiVideoInputs(snapshot: AiVideoTaskSnapshot) {
  if (snapshot.mode === "pain_comparison") return [snapshot.painMaterial, snapshot.solutionMaterial].filter((item) => item != null);
  if (snapshot.mode === "usage_process") return [snapshot.usageVideo, snapshot.productImage].filter((item) => item != null);
  return [
    ...(snapshot.references || []), snapshot.firstFrame, snapshot.lastFrame,
    snapshot.character, ...(snapshot.sourceVideos || []), ...(snapshot.clothingImages || []), snapshot.modelMedia,
  ].filter((item) => item != null);
}

// Preserve task identity, billing and outputs when opening records from the old entry.
export function migrateQuickCreationVideoTask(task: Task): Task {
  const snapshot = task.quickCreationSnapshot;
  if (task.category !== "quick_creation" || !snapshot || !["痛点对比", "使用过程"].includes(snapshot.preset || "")) return task;
  const role = (name: string) => {
    const media = snapshot.roleMaterials?.find((item) => item.role === name);
    return media ? { id: `${task.id}-${name}`, name, type: media.type, url: media.url } : null;
  };
  return {
    ...task,
    category: "ai_video",
    type: "video_gen",
    autoProgress: false,
    restartable: false,
    aiVideoSnapshot: {
      mode: snapshot.preset === "痛点对比" ? "pain_comparison" : "usage_process",
      model: snapshot.model,
      ratio: snapshot.videoAspectRatio,
      duration: snapshot.videoLength,
      // Old preset drafts were retained but did not participate in generation.
      prompt: "",
      ...(snapshot.preset === "痛点对比"
        ? { painMaterial: role("痛点素材"), solutionMaterial: role("解决痛点素材") }
        : { usageVideo: role("使用过程视频"), productImage: role("商品图片") }),
    },
  };
}
