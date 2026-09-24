import { grouped } from "./analyticsData";
import { qualityReport, reportTotals, money, percent, selectReportFacts, type ReportFact, type ReportFilter } from "./reportDemoData";

export type PlatformTagDimension = "summary" | "team" | "group" | "user" | "account";
export interface PlatformTagFilters extends ReportFilter {
  groupKey?: string;
  memberId?: string;
  subject?: string;
}
export interface PlatformTagColumn {
  key: string;
  label: string;
  width: number;
  numeric?: boolean;
  detailKey?: string;
  fixed?: boolean;
}
export interface PlatformTagRow {
  id: string;
  values: Record<string, string | number>;
}

export const PLATFORM_TAG_DIMENSIONS: { id: PlatformTagDimension; label: string }[] = [
  { id: "summary", label: "汇总" },
  { id: "team", label: "部门" },
  { id: "group", label: "分组" },
  { id: "user", label: "个人" },
  { id: "account", label: "广告账户" },
];

const qualityMetrics: PlatformTagColumn[] = [
  { key: "totalMaterials", label: "总素材数", width: 110, numeric: true },
  { key: "firstRelease", label: "首发素材", width: 110, numeric: true, detailKey: "firstReleaseRatio" },
  { key: "firstReleaseSpend", label: "首发素材消耗", width: 140, numeric: true, detailKey: "firstReleaseSpendRatio" },
  { key: "highQuality", label: "优质素材", width: 110, numeric: true, detailKey: "highQualityRatio" },
  { key: "highQualitySpend", label: "优质素材消耗", width: 140, numeric: true, detailKey: "highQualitySpendRatio" },
  { key: "lowEfficiency", label: "低效素材", width: 110, numeric: true, detailKey: "lowEfficiencyRatio" },
  { key: "lowQuality", label: "低质素材", width: 110, numeric: true, detailKey: "lowQualityRatio" },
  { key: "homogeneitySevere", label: "同质化挤压严重素材", width: 160, numeric: true, detailKey: "homogeneitySevereRatio" },
  { key: "homogeneityRisk", label: "同质化素材风险-排队投放素材", width: 180, numeric: true, detailKey: "homogeneityRiskRatio" },
];
const identityColumns: Record<Exclude<PlatformTagDimension, "summary">, PlatformTagColumn[]> = {
  team: [{ key: "department", label: "部门", width: 200 }],
  group: [{ key: "department", label: "部门", width: 200 }, { key: "group", label: "分组", width: 200 }],
  user: [{ key: "department", label: "部门", width: 200 }, { key: "group", label: "分组", width: 200 }, { key: "person", label: "用户", width: 120 }],
  account: [
    { key: "account", label: "广告账户", width: 230, fixed: true },
    { key: "subject", label: "主体", width: 200, fixed: true },
    { key: "department", label: "部门", width: 150, fixed: true },
    { key: "group", label: "分组", width: 160, fixed: true },
    { key: "person", label: "用户", width: 100, fixed: true },
    { key: "category", label: "一级分类", width: 130 },
    { key: "subcategory", label: "二级分类", width: 130 },
  ],
};

export const platformTagGroupKey = (department: string, group: string) => JSON.stringify([department, group]);

export function selectPlatformTagFacts(facts: ReportFact[], platform: string, dimension: PlatformTagDimension, filter: PlatformTagFilters) {
  const subject = filter.subject?.trim().toLowerCase();
  return selectReportFacts(facts, platform, { start: filter.start, end: filter.end, category: filter.category })
    .filter(row => (dimension !== "team" || !filter.department || row.department === filter.department) &&
      (!["group", "account"].includes(dimension) || !filter.groupKey || platformTagGroupKey(row.department, row.group) === filter.groupKey) &&
      (dimension !== "user" || !filter.memberId || row.memberId === filter.memberId) &&
      (dimension !== "account" || !subject || row.subject.toLowerCase().includes(subject)));
}

export function platformTagTable(facts: ReportFact[], dimension: PlatformTagDimension) {
  const totals = qualityReport(facts);
  if (dimension === "summary") {
    const columns: PlatformTagColumn[] = [
      { key: "label", label: "广告标签", width: 280 },
      { key: "count", label: "素材数量", width: 150, numeric: true },
      { key: "countRatio", label: "数量占比", width: 150, numeric: true },
      { key: "spend", label: "消耗", width: 170, numeric: true },
      { key: "spendRatio", label: "消耗占比", width: 150, numeric: true },
    ];
    const tags = [
      ["firstRelease", "首发素材"], ["highQuality", "优质素材"],
      ["lowEfficiency", "低效素材"], ["lowQuality", "低质素材"],
      ["homogeneitySevere", "同质化挤压严重素材"], ["homogeneityRisk", "同质化素材风险-排队投放素材"],
    ] as const;
    const rows: PlatformTagRow[] = facts.length ? tags.map(([key, label]) => ({
      id: key, values: { label, count: totals[key], countRatio: totals[`${key}Ratio`], spend: totals[`${key}Spend`], spendRatio: totals[`${key}SpendRatio`] },
    })) : [];
    const spend = reportTotals(facts).spend;
    const total: PlatformTagRow = { id: "total", values: { label: "总计", count: totals.totalMaterials,
      countRatio: percent(totals.totalMaterials ? 100 : 0), spend: money(spend), spendRatio: percent(spend ? 100 : 0) } };
    return { columns, rows, total };
  }

  const identities = identityColumns[dimension];
  // Account details split by the displayed ownership and category path, not just account ID.
  const groups = grouped(facts, row => JSON.stringify(dimension === "team" ? [row.department] :
    dimension === "group" ? [row.department, row.group] :
    dimension === "user" ? [row.department, row.group, row.memberId || row.person] :
    [row.platform, row.accountId, row.subject, row.department, row.group, row.memberId || row.person, row.category, row.subcategory]));
  const rows: PlatformTagRow[] = groups.map(([id, items]) => ({ id, values: {
    ...Object.fromEntries(identities.map(column => [column.key, column.key === "account" ? `${items[0].account} (${items[0].accountId})` : items[0][column.key]])),
    ...qualityReport(items),
  } }));
  const total: PlatformTagRow = { id: "total", values: {
    ...Object.fromEntries(identities.map((column, index) => [column.key, index === 0 ? "总计" : "--"])), ...totals,
  } };
  return { columns: [...identities, ...qualityMetrics], rows, total };
}
