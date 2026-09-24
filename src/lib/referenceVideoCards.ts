import type { FinishedVideo } from "../data/finishedVideos";
import type { RelatedResourceVideo } from "./resourceBatch";
import type { ReferencedVideoExample } from "./referencedVideoData";
import { REPORT_TODAY } from "./analyticsData";

export function shotReferenceCard(item: RelatedResourceVideo): FinishedVideo {
  return {
    id: item.id, numericId: item.code, title: item.title, coverUrl: item.cover,
    videoUrl: item.videoUrl || "", duration: item.videoDuration || item.duration,
    author: item.author, authorAvatar: item.avatar, createdAt: item.date, relativeTime: item.date,
    status: item.status, category: item.category, typeLabel: item.category,
    tags: item.tags, downloads: item.useCount, referenceCount: item.viewCount,
    shares: 0, likes: 0, comments: 0, cost: 0, todayCost: 0,
    resolution: "--", size: "--", creator: "human", syncStatus: "unsynced", relatedVideos: [],
  };
}

// Media assets are local prototype samples; the existing attribution totals stay unchanged.
const producedMedia: Record<string, { numericId: string; videoUrl: string; category: string; coverUrl?: string }> = {
  dv1: { numericId: "110332281", videoUrl: "./assets/viral-gallery/beauty-promo.mp4", category: "珠宝种草" },
  dv2: { numericId: "110332282", videoUrl: "./assets/viral-gallery/serum.mp4", category: "效果对比" },
  dv3: { numericId: "110332283", videoUrl: "./assets/viral-gallery/beauty-promo.mp4", coverUrl: "./assets/prototype/beauty-promo-detail.jpg", category: "产品展示" },
};

export function producedReferenceCard(item: ReferencedVideoExample): FinishedVideo {
  const media = producedMedia[item.id];
  const monthlyCosts: Record<string, number> = {};
  for (const day of item.daily) {
    const month = day.date.slice(0, 7);
    monthlyCosts[month] = (monthlyCosts[month] || 0) + day.cost / 100;
  }
  return {
    id: item.id, numericId: media?.numericId || item.id, title: item.title, coverUrl: media?.coverUrl || item.coverUrl,
    videoUrl: media?.videoUrl || "", duration: item.duration, author: item.author, authorAvatar: item.authorAvatar,
    createdAt: item.date, relativeTime: item.date, category: media?.category, typeLabel: media?.category,
    status: "审核通过", cost: item.cost, roi: item.roi, monthlyCosts,
    todayCost: (item.daily.find(day => day.date === REPORT_TODAY)?.cost || 0) / 100,
    shares: 0, likes: 0, comments: 0, resolution: "1080p", size: "--", creator: "human",
    syncStatus: "synced", relatedVideos: [],
  };
}
