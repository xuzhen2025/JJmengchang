import type { FinishedVideo } from "./finishedVideos";
import { resourceConfigStore } from "../lib/resourceConfig";
import { resourceTagStore } from "../lib/resourceTags";

const examples = [
  { name: "精华液质地展示-品牌供片", asset: "serum", category: "美妆 / 特写质感镜头", author: "徐振", cost: 18640, roi: 2.86 },
  { name: "护肤礼盒开箱-达人交付", asset: "skincare-set", category: "美妆 / 美妆原片", author: "王剪辑", cost: 7260, roi: 2.31 },
  { name: "通勤女装穿搭-合作机构供片", asset: "dress", category: "服饰内衣 / 服饰穿搭", author: "徐振", cost: 38560, roi: 3.12 },
  { name: "运动服面料特写-品牌供片", asset: "fashion-sport", category: "服饰内衣 / 面料细节展示", author: "王剪辑", cost: 4980, roi: 2.04 },
  { name: "身体乳涂抹展示-达人交付", asset: "body-care", category: "个护家清 / 洗护展示", author: "徐振", cost: 0, roi: 0 },
  { name: "居家服试穿-合作机构供片", asset: "fashion-home", category: "服饰内衣 / 服饰穿搭", author: "王剪辑", cost: 0, roi: 0 },
];

export const INITIAL_THIRD_PARTY: FinishedVideo[] = examples.map((sample, index) => ({
  id: `third-party-${index + 1}`, numericId: String(310332001 + index),
  title: `0920-${sample.name}.mp4`, videoUrl: `./assets/viral-gallery/${sample.asset}.mp4`,
  coverUrl: `./assets/viral-gallery/${sample.asset}.jpg`, duration: "15s", resolution: "360x640", size: "0.68 MB",
  creator: "human", createdAt: `2026-09-${20 - index} 10:30`, syncStatus: index < 4 ? "synced" : "unsynced",
  shares: 0, likes: 380 + index * 73, comments: 12 + index * 5, downloads: [8, 3, 12, 4, 0, 0][index],
  pushCount: [2, 1, 3, 1, 0, 0][index], referenceCount: [3, 2, 5, 2, 0, 0][index],
  author: sample.author, cost: sample.cost, monthlyCosts: { "2026-09": sample.cost }, roi: sample.roi,
  category: sample.category, typeLabel: "第三方", status: index < 4 ? "已上机" : "待审核",
  tags: ["商品展示", "高端质感"], personalTags: [],
}));

resourceConfigStore.register("thirdParty", INITIAL_THIRD_PARTY);
resourceTagStore.register("thirdParty", INITIAL_THIRD_PARTY);
