import type { AdPushRecord } from "./adPush";
import { memberOrganization, type ReportOrganization } from "./analyticsOrganization";
import { resourceConfigStore } from "./resourceConfig";
import { stableNumber } from "./reportDemoData";
import type { DerivationRecord } from "./videoDerivation";

export function derivativeAnalyticsRows(records: DerivationRecord[], pushes: AdPushRecord[], organization: ReportOrganization) {
  return records.filter(record => ["成功", "已删除"].includes(record.status)).map(record => {
    const linked = pushes.filter(push => push.derivativeId === record.id && push.status === "推送成功");
    // Only seeded examples have simulated delivery metrics. Newly generated files start at zero.
    const seed = record.example && linked.some(push => push.deliveryStatus === "投放中") ? stableNumber(record.id) : 0;
    const cost = seed ? (18000 + seed % 62000) / 100 : 0;
    const orders = seed ? 12 + seed % 35 : 0;
    const gmv = orders * 89;
    const impressions = seed ? Math.round(cost / 25 * 1000) : 0;
    const plays = Math.round(impressions * 0.72);
    const org = memberOrganization(organization, record.ownerName || linked[0]?.operator || record.ownerId);
    const category = resourceConfigStore.project("finished", { id: record.source.id, primaryCategory: "", secondaryCategory: "" });
    const date = new Date(record.createdAt).toLocaleDateString("sv-SE");
    return { videoId: record.id, video: record.name, team: org.department, group: org.group, author: org.person,
      cat1: category.primaryCategory || "未设置分类", cat2: category.secondaryCategory || "未设置分类",
      uploadDate: date, date, month: date.slice(0, 7), cost, orders, gmv, coupon: orders * 3, platformSubsidy: orders * 2,
      impressions, clicks: Math.round(impressions * 0.035), plays, effectivePlays: Math.round(plays * 0.24), plays3s: Math.round(plays * 0.61) };
  });
}
