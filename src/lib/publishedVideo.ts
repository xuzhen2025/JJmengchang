import type { Asset } from "../types";

export function toPublishedVideo(asset: Asset) {
  return {
    id: asset.id, numericId: asset.id, title: asset.name, videoUrl: asset.url,
    coverUrl: asset.coverUrl || "./assets/prototype/beauty-promo-detail.jpg",
    duration: asset.fileInfo?.duration || "--:--", resolution: asset.fileInfo?.resolution || "--",
    size: asset.size, creator: asset.resourceCategory === "第三方" ? "human" as const : "ai" as const,
    aiModel: asset.resourceCategory === "第三方" ? undefined : "视频换脸", createdAt: asset.createdAt,
    syncStatus: "unsynced" as const, shares: 0, likes: 0, comments: 0, downloads: 0,
    author: asset.creator || "徐振", cost: 0, category: asset.category,
    tags: asset.publicTags || [], personalTags: asset.personalTags || [], status: asset.status || "待审核", typeLabel: asset.resourceCategory === "第三方" ? "第三方" : "视频换脸",
  };
}
