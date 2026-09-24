import { adTotals, grouped, ratio, unique, REPORT_TODAY, REPORT_START, shiftDate, type AdFact } from "./analyticsData";
import { memberOrganization, type ReportOrganization } from "./analyticsOrganization";
import type { AdAccount } from "./adPush";
import type { PublicTagGroup } from "./resourceTags";

export { REPORT_TODAY, REPORT_START, shiftDate };
export const REPORT_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#64748B"];
export const fmt = (value: number) => value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
export const money = (value: number, currency = "CNY") => `${currency === "USD" ? "$" : "¥"}${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const percent = (value: number) => `${value.toFixed(2)}%`;
export const stableNumber = (text: string) => [...text].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
export interface ReportFact extends Omit<AdFact, "platform"> {
  platform: string; memberId: string; finish3s: number; refund: number; refundOrders: number;
}
export interface ReportFilter {
  start?: string; end?: string; uploadStart?: string; uploadEnd?: string;
  department?: string; group?: string; person?: string; entity?: string; category?: string; query?: string; accountId?: string; promotion?: string;
}
export function createReportFacts(accounts: AdAccount[], org: ReportOrganization, tags: PublicTagGroup[], categories: { name: string; children: { name: string }[] }[]): ReportFact[] {
  const products = ["植萃修护精华", "通勤风衣", "云感内衣", "氨基酸洁面", "轻音吹风机", "居家收纳盒"];
  return accounts.flatMap(account => {
    const seed = stableNumber(account.id);
    const category = categories[seed % Math.max(1, categories.length)];
    const subcategory = category?.children[seed % Math.max(1, category.children.length)];
    const currency = account.platform.startsWith("TikTok") ? "USD" : "CNY";
    return Array.from({ length: 8 }, (_, material) => {
      const first = material * 8;
      const state = ["投放中", "未投放", "已暂停", "已完成", "审核不通过", "已删除"][material % 6];
      return Array.from({ length: 90 - first }, (_, day) => {
        const index = first + day, n = (seed % 997 + material * 37 + day * 19) % 997;
        const active = !["未投放", "审核不通过"].includes(state) && (state === "投放中" || day < 14);
        const impressions = active ? 1800 + n * 11 : 0;
        const clicks = Math.round(impressions * (0.016 + n % 23 / 1000));
        const conversions = Math.round(clicks * (0.025 + material % 4 * 0.006));
        const spend = Math.round(clicks * (currency === "USD" ? 47 : 86) * (0.85 + n % 7 / 10));
        const paid = conversions * (currency === "USD" ? 2999 : 7900 + seed % 6 * 3000);
        const refundOrders = Math.floor(conversions / 13);
        return {
          id: `report-${account.platform}-${account.id}-${material}-${index}`, date: shiftDate(REPORT_START, index),
          platform: account.platform, currency, accountId: account.id, account: account.name, subject: "杭州梦畅电子商务有限公司",
          ...memberOrganization(org, account.user), operator: org.members.some(member => member.name === account.user) ? account.user : "未关联员工",
          category: category?.name || "未设置分类", subcategory: subcategory?.name || "未设置分类",
          liveRoom: `${products[seed % products.length]}直播间`, materialId: `${account.platform}:${account.id}-${material}`,
          material: `${products[seed % products.length]}_${["实拍测评", "细节特写", "卖点口播", "使用对比"][material % 4]}_${material + 1}.mp4`,
          uploadedAt: shiftDate(REPORT_START, first), planId: `PL-${account.platform}-${account.id}-${material}`, planCreatedAt: shiftDate(REPORT_START, first), planStatus: state,
          promotion: ["标准推广", "商品全域推广"][material % 2],
          qualityTags: [["首发素材", "优质素材", "低效素材", "低质素材", "同质化挤压严重", "同质化排队投放"][material % 6]],
          tags: Object.fromEntries(tags.map(group => [group.id, group.subTags[(seed + material) % Math.max(1, group.subTags.length)]?.id || ""])),
          spend, paid, coupon: account.platform === "巨量千川" ? conversions * 300 : 0,
          subsidy: account.platform === "巨量千川" ? conversions * 200 : 0, impressions, clicks, conversions,
          views: Math.round(impressions * 0.73), finish3s: Math.round(impressions * (0.21 + material % 4 * 0.02)),
          refundOrders, refund: conversions ? Math.round(paid * refundOrders / conversions) : 0,
        } satisfies ReportFact;
      });
    }).flat();
  });
}
export function selectReportFacts(facts: ReportFact[], platform: string, filter: ReportFilter = {}) {
  const start = filter.start ?? REPORT_START, end = filter.end ?? REPORT_TODAY;
  return facts.filter(row => (!platform || row.platform === platform || (platform === "TikTok" && row.platform.startsWith("TikTok")) || (platform === "小红书" && row.platform.startsWith("小红书"))) &&
    row.date >= start && row.date <= end && (!filter.uploadStart || row.uploadedAt >= filter.uploadStart) && (!filter.uploadEnd || row.uploadedAt <= filter.uploadEnd) &&
    (!filter.department || row.department === filter.department) && (!filter.group || row.group === filter.group) && (!filter.person || row.person === filter.person) &&
    (!filter.entity || [row.department, row.group, row.person, row.account, row.accountId].includes(filter.entity)) &&
    (!filter.category || filter.category === "all" || [row.category, row.subcategory, `${row.category} / ${row.subcategory}`].includes(filter.category)) &&
    (!filter.accountId || row.accountId.includes(filter.accountId)) && (!filter.promotion || row.promotion === filter.promotion) &&
    (!filter.query || `${row.account} ${row.accountId} ${row.person} ${row.liveRoom}`.toLowerCase().includes(filter.query.trim().toLowerCase())));
}
export function reportTotals(rows: ReportFact[]) {
  const base = adTotals(rows as AdFact[]);
  const netOrders = base.conversions - rows.reduce((n, row) => n + row.refundOrders, 0);
  const netSales = base.gmv - rows.reduce((n, row) => n + row.refund, 0) / 100;
  return { ...base, totalGmv: base.gmv, dealAmount: base.paid, coupon: base.coupon + base.subsidy,
    conv: base.conversions, imp: base.impressions, finish3s: ratio(rows.reduce((n, row) => n + row.finish3s, 0), base.impressions) * 100,
    netSales, netOrders, netRoi: ratio(netSales, base.spend), netCpa: ratio(base.spend, netOrders) };
}
export function dimensionKey(row: ReportFact, dimension: string) {
  if (["team", "department"].includes(dimension)) return row.department;
  if (dimension === "group") return `${row.department} / ${row.group}`;
  if (["personal", "individual", "person", "user", "personnel"].includes(dimension)) return `${row.department} / ${row.group} / ${row.person}`;
  if (["detail", "material"].includes(dimension)) return row.materialId;
  if (["daily", "day"].includes(dimension)) return row.date;
  if (["monthly", "month"].includes(dimension)) return row.date.slice(0, 7);
  if (dimension === "category") return `${row.category} / ${row.subcategory}`;
  return `${row.platform}:${row.accountId}`;
}
export function reportRows(facts: ReportFact[], dimension: string) {
  return grouped(facts, row => dimensionKey(row, dimension)).map(([id, items]) => {
    const row = items[0], totals = reportTotals(items);
    const name = ["team", "department"].includes(dimension) ? row.department : dimension === "group" ? row.group :
      ["personal", "individual", "user", "personnel"].includes(dimension) ? row.person :
      ["detail", "material"].includes(dimension) ? row.material : ["daily", "day", "monthly", "month", "category"].includes(dimension) ? id : row.account;
    return { ...totals, id, name, team: row.department, teamName: row.department, group: row.group, groupName: row.group, user: row.person,
      account: row.person, accountName: row.account, accountId: row.accountId, liveRoom: row.liveRoom, leader: row.person,
      cat1: row.category, cat2: row.subcategory, accountCount: totals.accounts, facts: items };
  });
}
export function statusTotals(rows: ReportFact[]) {
  const plans = [...new Map(rows.map(row => [row.planId, row])).values()];
  const count = (...states: string[]) => plans.filter(row => states.includes(row.planStatus)).length;
  return { total: plans.length, delivering: count("投放中"), pending: count("未投放", "审核不通过"), terminated: count("已暂停"), finished: count("已完成"), deleted: count("已删除"),
    ineffective: count("未投放"), auditNew: 0, auditEdit: 0, auditFailed: count("审核不通过"), paused: count("已暂停") };
}
export function financialReportRows(facts: ReportFact[], platform: string, date: string) {
  const history = selectReportFacts(facts, platform, { end: date });
  return reportRows(history, "account").map(row => {
    const daily = reportTotals(row.facts.filter(fact => fact.date === date));
    const deposits = 50000 + Math.ceil(row.spend / 20000) * 20000, balance = deposits - row.spend;
    const cash = Math.round(daily.spend * 80) / 100, grant = Math.round(daily.spend * 10) / 100, rebate = Math.round(daily.spend * 5) / 100;
    return { ...row, totalSpend: daily.spend, nonGrantSpend: cash, grantSpend: grant, rebateSpend: rebate, sharedWalletSpend: daily.spend - cash - grant - rebate,
      totalDeposit: deposits, totalTransferIn: 0, totalTransferOut: 0, totalBalance: balance, grantBalance: Math.round(balance * 10) / 100,
      nonGrantBalance: balance - Math.round(balance * 10) / 100,
      standardSpend: reportTotals(row.facts.filter(fact => fact.date === date && fact.promotion === "标准推广")).spend,
      globalSpend: reportTotals(row.facts.filter(fact => fact.date === date && fact.promotion !== "标准推广")).spend, remark: "-" };
  });
}

type QualityKey = "firstRelease" | "highQuality" | "lowEfficiency" | "lowQuality" | "homogeneitySevere" | "homogeneityRisk";
type QualityReport = { totalMaterials: number } & Record<QualityKey, number> & Record<`${QualityKey}Ratio` | `${QualityKey}Spend` | `${QualityKey}SpendRatio`, string>;
export function qualityReport(rows: ReportFact[]): QualityReport {
  const total = reportTotals(rows);
  const keys = ["firstRelease", "highQuality", "lowEfficiency", "lowQuality", "homogeneitySevere", "homogeneityRisk"];
  const tags = ["首发素材", "优质素材", "低效素材", "低质素材", "同质化挤压严重", "同质化排队投放"];
  const values: Record<string, any> = { totalMaterials: total.materials };
  tags.forEach((tag, i) => {
    const data = reportTotals(rows.filter(row => row.qualityTags.includes(tag)));
    values[keys[i]] = data.materials;
    values[`${keys[i]}Ratio`] = percent(ratio(data.materials, total.materials) * 100);
    values[`${keys[i]}Spend`] = money(data.spend);
    values[`${keys[i]}SpendRatio`] = percent(ratio(data.spend, total.spend) * 100);
  });
  return values as QualityReport;
}
export function tagReportRow(rows: ReportFact[], name: string) {
  const total = reportTotals(rows), currency = rows[0]?.currency || "CNY";
  return { name, videoCount: total.materials, spend: money(total.spend, currency), roi: total.roi.toFixed(2), salesAmount: money(total.gmv, currency),
    coupons: money(total.coupon - total.subsidy, currency), subsidy: money(total.subsidy, currency), conversions: total.conversions, cvr: percent(total.cvr), cpa: money(total.cpa, currency),
    impressions: fmt(total.impressions), cpm: money(total.cpm, currency), clicks: fmt(total.clicks), ctr: percent(total.ctr), cpc: money(total.cpc, currency),
    views: fmt(total.views), finishRate3s: percent(total.finish3s), netSales: money(total.netSales, currency), netOrders: total.netOrders,
    netRoi: total.netRoi.toFixed(2), netCpa: money(total.netCpa, currency) };
}
