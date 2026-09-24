import { visibleAdAccounts, type AdActor, type AdStore } from "./adPush";
import { stableNumber } from "./reportDemoData";

export const INTERACTION_CHANNELS = [
  { id: "qc-live", label: "全域直播-千川", shortLabel: "全域直播", platform: "巨量引擎", accountPlatform: "巨量千川", allLabel: "全部抖音互动数据" },
  { id: "qc-product", label: "全域商品-千川", shortLabel: "全域商品", platform: "巨量引擎", accountPlatform: "巨量千川", allLabel: "全部抖音互动数据" },
  { id: "qc-standard", label: "标准-千川", shortLabel: "标准", platform: "巨量引擎", accountPlatform: "巨量千川", allLabel: "全部抖音互动数据" },
  { id: "adq", label: "腾讯ADQ", shortLabel: "腾讯ADQ", platform: "腾讯ADQ", accountPlatform: "腾讯ADQ", allLabel: "全部腾讯互动数据" },
  { id: "tiktok", label: "TikTok", shortLabel: "TikTok", platform: "TikTok", accountPlatform: "TikTok", allLabel: "全部TikTok互动数据" },
] as const;

export type InteractionChannelId = typeof INTERACTION_CHANNELS[number]["id"];
export interface VideoInteractionRecord {
  id: string;
  videoId: string;
  account: string;
  accountId: string;
  material: string;
  materialId: string;
  spend: number;
  weight: number;
}
interface InteractionVideo { id: string; title: string; syncStatus: string; cost: number; }
export interface InteractionPoint {
  second: number; secondLabel: string;
  clicks: number; losses: number; follows: number; comments: number; likes: number;
  ctr: number; lossRate: number;
}

// Scoped prototype fixtures, not synchronized ad facts. Never attach them to newly uploaded videos.
export function createVideoInteractionDemoRecords(
  video: InteractionVideo, channelId: InteractionChannelId, store: AdStore, actor: AdActor,
): VideoInteractionRecord[] {
  const productDemo = channelId === "qc-product";
  if (!/^fv\d+$/.test(video.id) || (!productDemo && video.syncStatus !== "synced")) return [];
  const channel = INTERACTION_CHANNELS.find(item => item.id === channelId)!;
  const visibleIds = new Set(visibleAdAccounts(store, actor).map(account => account.id));
  const accounts = store.accounts.filter(account =>
    account.platform === channel.accountPlatform && account.status === "authorized" && !account.revoked,
  );
  const channelIndex = INTERACTION_CHANNELS.findIndex(item => item.id === channelId);
  const channelWeight = [0.5, 0.3, 0.2, 1, 1][channelIndex];
  const totalCents = Math.max(0, Math.round((Number.isFinite(video.cost) ? video.cost : 0) * 100 * channelWeight));
  const count = accounts.length * 2;
  // Product-channel examples are independent of the resource card's push status and lifetime spend.
  const productSpends = [362034, 187620, 568412, 124085, 189624, 72560];
  const productSpend = (accountId: string, copyIndex: number) => productSpends[stableNumber(`${video.id}:${accountId}:${copyIndex}`) % productSpends.length];
  const productTotal = accounts.reduce((sum, account) => sum + productSpend(account.id, 0) + productSpend(account.id, 1), 0);
  return accounts.flatMap((account, accountIndex) => [0, 1].map(copyIndex => {
    const index = accountIndex * 2 + copyIndex;
    const materialId = `7541706${video.id.slice(2).padStart(4, "0")}${channelIndex}${account.id.slice(-4)}${copyIndex}`;
    return {
      id: `${channelId}:${account.id}:${materialId}`, videoId: video.id,
      account: account.name, accountId: account.id,
      material: `${video.title.replace(/\.[^.]+$/, "")}_${copyIndex === 0 ? "原片" : "转码"}`,
      materialId,
      spend: (productDemo ? productSpend(account.id, copyIndex) : Math.floor(totalCents / count) + (index < totalCents % count ? 1 : 0)) / 100,
      weight: productDemo ? channelWeight * productSpend(account.id, copyIndex) / productTotal : channelWeight / count,
    };
  })).filter(record => visibleIds.has(record.accountId));
}

export function selectVideoInteractionTrend(
  base: InteractionPoint[], records: VideoInteractionRecord[], scopeId: string,
): InteractionPoint[] {
  const selected = scopeId === "all" ? records : records.filter(record => record.id === scopeId);
  if (!selected.length) return [];
  return base.map(point => {
    const sum = (key: "clicks" | "losses" | "follows" | "comments" | "likes") =>
      selected.reduce((total, record) => total + Math.round(point[key] * record.weight), 0);
    return { ...point, clicks: sum("clicks"), losses: sum("losses"), follows: sum("follows"), comments: sum("comments"), likes: sum("likes") };
  });
}
