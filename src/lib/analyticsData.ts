import { INITIAL_DEPTS, INITIAL_MEMBERS } from "../data/adminAccounts";
import { recordExport } from "./operationHistory";
import { INITIAL_PUBLIC_TAG_GROUPS } from "./resourceTags";

export const REPORT_PLATFORMS = [
  "巨量千川",
  "巨量广告",
  "巨量本地推",
  "磁力智投",
  "磁力金牛",
  "腾讯ADQ",
  "TikTok",
  "百度营销",
  "小红书",
] as const;
export type AdPlatform = (typeof REPORT_PLATFORMS)[number];
export type Dimension =
  | "summary"
  | "department"
  | "group"
  | "person"
  | "account"
  | "material"
  | "category"
  | "day"
  | "month"
  | "liveRoom"
  | "tag";
export const PLAN_STATES = [
  "投放中",
  "未投放",
  "审核不通过",
  "已暂停",
  "已完成",
  "已删除",
] as const;
export const QUALITY_TAGS = [
  "首发素材",
  "优质素材",
  "低效素材",
  "低质素材",
  "同质化挤压严重",
  "同质化排队投放",
];
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localDate(value);
}
export const REPORT_TODAY = localDate();
export const REPORT_START = shiftDate(REPORT_TODAY, -89);
export const recentRange = () => ({
  start: shiftDate(REPORT_TODAY, -29),
  end: REPORT_TODAY,
});
export const ratio = (n: number, d: number) => (d > 0 ? n / d : 0);
export function dateError(start: string, end: string) {
  if (!start || !end) return "请选择完整的日期范围";
  return start > end ? "开始日期不能晚于结束日期" : "";
}
export function unique<T>(values: T[]) {
  return [...new Set(values)];
}
export function grouped<T>(
  rows: T[],
  key: (row: T) => string,
): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const id = key(row);
    const list = groups.get(id) || [];
    list.push(row);
    groups.set(id, list);
  }
  return [...groups];
}
export function calendarSeries<T extends { id: string; label: string }>(
  rows: T[],
  zeros: Record<string, number>,
  granularity: string,
) {
  if (!rows.length) return [];
  const sorted = [...rows].sort((a, b) => a.label.localeCompare(b.label));
  const byDate = new Map(sorted.map((row) => [row.label, row]));
  const result: (T | { id: string; label: string; [key: string]: unknown })[] =
    [];
  let cursor =
    sorted[0].label.length === 7 ? `${sorted[0].label}-01` : sorted[0].label;
  const end = sorted[sorted.length - 1].label;
  while ((granularity === "monthly" ? cursor.slice(0, 7) : cursor) <= end) {
    const label = granularity === "monthly" ? cursor.slice(0, 7) : cursor;
    result.push(byDate.get(label) || { id: label, label, ...zeros });
    if (granularity === "monthly") {
      const next = new Date(`${cursor}T12:00:00`);
      next.setMonth(next.getMonth() + 1);
      cursor = localDate(next);
    } else cursor = shiftDate(cursor, granularity === "weekly" ? 7 : 1);
  }
  return result;
}
export function personOrg(name: string, path?: string) {
  if (path) {
    const parts = path.split(" / ");
    if (parts.length >= 3)
      return { department: parts[0], group: parts[1], person: name };
  }
  const member = INITIAL_MEMBERS.find((item) => item.name === name);
  const node = INITIAL_DEPTS.find((item) => item.id === member?.deptId);
  const parent =
    node?.levelType === "group"
      ? INITIAL_DEPTS.find((item) => item.id === node.parentId)
      : node;
  return {
    department: parent?.name || "未归属部门",
    group: node?.levelType === "group" ? node.name : "未归属分组",
    person: name,
  };
}
const PRODUCTS = [
  {
    name: "植萃修护精华",
    category: "美妆护肤",
    subcategory: "面部精华",
    price: 12900,
    room: "梦畅护肤官方直播间",
  },
  {
    name: "轻暖通勤风衣",
    category: "服饰内衣",
    subcategory: "女装外套",
    price: 23900,
    room: "梦畅女装旗舰店",
  },
  {
    name: "云感无钢圈内衣",
    category: "服饰内衣",
    subcategory: "女士内衣",
    price: 8900,
    room: "梦畅内衣专营店",
  },
  {
    name: "净透氨基酸洁面",
    category: "美妆护肤",
    subcategory: "卸妆清洁",
    price: 5900,
    room: "梦畅护肤官方直播间",
  },
  {
    name: "便携冷萃咖啡杯",
    category: "家居日用",
    subcategory: "厨房用品",
    price: 7900,
    room: "梦畅生活好物",
  },
  {
    name: "轻音高速吹风机",
    category: "家用电器",
    subcategory: "个护电器",
    price: 19900,
    room: "梦畅家电官方直播间",
  },
];
const AD_PEOPLE = INITIAL_MEMBERS.filter(
  (item) => item.status === "normal",
).slice(0, 8);
export interface AdFact {
  id: string;
  date: string;
  platform: AdPlatform;
  currency: "CNY" | "USD";
  accountId: string;
  account: string;
  subject: string;
  department: string;
  group: string;
  person: string;
  operator: string;
  category: string;
  subcategory: string;
  liveRoom: string;
  materialId: string;
  material: string;
  uploadedAt: string;
  promotion: string;
  planId: string;
  planCreatedAt: string;
  planStatus: string;
  qualityTags: string[];
  tags: Record<string, string>;
  spend: number;
  paid: number;
  coupon: number;
  subsidy: number;
  impressions: number;
  clicks: number;
  conversions: number;
  views: number;
}
export function createAdFacts(end = REPORT_TODAY): AdFact[] {
  const start = shiftDate(end, -89);
  const facts: AdFact[] = [];
  REPORT_PLATFORMS.forEach((platform, p) =>
    PRODUCTS.forEach((product, a) => {
      const owner = AD_PEOPLE[a % AD_PEOPLE.length]?.name || "徐振";
      const operator = AD_PEOPLE[(a + 2) % AD_PEOPLE.length]?.name || "徐振";
      for (let m = 0; m < 8; m++) {
        const n = p * 101 + a * 13 + m * 7,
          materialId = `AD-${p + 1}-${a + 1}-${m + 1}`,
          firstDay = m * 10;
        for (let d = firstDay; d < 90; d++) {
          const seed = (n * 17 + d * 29 + 11) % 997,
            planStatus = PLAN_STATES[(m + a) % PLAN_STATES.length];
          const delivering = !["未投放", "审核不通过", "已删除"].includes(
            planStatus,
          );
          const impressions = delivering ? 1700 + seed * 18 : 0;
          const clicks = Math.round(impressions * (0.012 + (seed % 28) / 1000));
          const spend = delivering
            ? Math.round(
                clicks *
                  (platform === "TikTok" ? 35 : 65) *
                  (0.7 + (seed % 50) / 100),
              )
            : 0;
          const conversions = Math.round(clicks * (0.014 + (n % 18) / 1000));
          const paid =
              conversions *
              (platform === "TikTok" ? 1999 + a * 500 : product.price),
            date = shiftDate(start, d);
          facts.push({
            id: `${materialId}-${date}`,
            date,
            platform,
            currency: platform === "TikTok" ? "USD" : "CNY",
            accountId: `${1700000000 + p * 10000 + a * 137}`,
            account: `梦畅-${product.name}-${platform}`,
            subject: "杭州梦畅电子商务有限公司",
            ...personOrg(owner),
            operator,
            category: product.category,
            subcategory: product.subcategory,
            liveRoom: product.room,
            materialId,
            material: `${product.name}_${["口播实测", "场景对比", "细节特写", "开箱体验"][m % 4]}_${m + 1}.mp4`,
            uploadedAt: shiftDate(start, firstDay - 2),
            promotion: ["标准推广", "商品全域推广"][m % 2],
            planId: `PLAN-${materialId}`,
            planCreatedAt: shiftDate(start, firstDay),
            planStatus,
            qualityTags: unique([
              QUALITY_TAGS[m % 6],
              ...(m % 3 === 0 ? ["首发素材"] : []),
            ]),
            tags: Object.fromEntries(
              INITIAL_PUBLIC_TAG_GROUPS.slice(0, 5).map((group) => [
                group.id,
                group.subTags[(m + a) % group.subTags.length].id,
              ]),
            ),
            spend,
            paid,
            coupon: platform === "巨量千川" ? conversions * 300 : 0,
            subsidy: platform === "巨量千川" ? conversions * 200 : 0,
            impressions,
            clicks,
            conversions,
            views: Math.round(impressions * 0.72),
          });
        }
      }
    }),
  );
  return facts;
}
export const AD_FACTS = createAdFacts();
export interface AdFilter {
  start: string;
  end: string;
  uploadStart: string;
  uploadEnd: string;
  query: string;
  departments: string[];
  groups: string[];
  people: string[];
  accounts: string[];
  category: string;
  subject: string;
}
export const defaultAdFilter = (): AdFilter => ({
  ...recentRange(),
  uploadStart: "",
  uploadEnd: "",
  query: "",
  departments: [],
  groups: [],
  people: [],
  accounts: [],
  category: "",
  subject: "",
});
export function filterAdFacts(
  facts: AdFact[],
  filter: AdFilter,
  role: "author" | "operator" = "author",
) {
  return facts.filter((row) => {
    const org = role === "operator" ? personOrg(row.operator) : row;
    return (
      row.date >= filter.start &&
      row.date <= filter.end &&
      (!filter.uploadStart || row.uploadedAt >= filter.uploadStart) &&
      (!filter.uploadEnd || row.uploadedAt <= filter.uploadEnd) &&
      (!filter.departments.length ||
        filter.departments.includes(org.department)) &&
      (!filter.groups.length || filter.groups.includes(org.group)) &&
      (!filter.people.length || filter.people.includes(org.person)) &&
      (!filter.accounts.length || filter.accounts.includes(row.accountId)) &&
      (!filter.category ||
        [row.category, `${row.category} / ${row.subcategory}`].includes(
          filter.category,
        )) &&
      (!filter.subject || row.subject === filter.subject) &&
      (!filter.query ||
        `${row.account} ${row.accountId} ${row.material} ${row.materialId}`
          .toLowerCase()
          .includes(filter.query.trim().toLowerCase()))
    );
  });
}
export function adKey(
  row: AdFact,
  dimension: Dimension,
  role: "author" | "operator" = "author",
  tagGroup = "public-group-2",
) {
  const org = role === "operator" ? personOrg(row.operator) : row;
  switch (dimension) {
    case "summary":
      return "汇总";
    case "department":
      return org.department;
    case "group":
      return `${org.department} / ${org.group}`;
    case "person":
      return `${org.department} / ${org.group} / ${org.person}`;
    case "account":
      return `${row.account} (${row.accountId})`;
    case "material":
      return `${row.material} (${row.materialId})`;
    case "category":
      return `${row.category} / ${row.subcategory}`;
    case "day":
      return row.date;
    case "month":
      return row.date.slice(0, 7);
    case "liveRoom":
      return row.liveRoom;
    case "tag":
      return row.tags[tagGroup] || "未打标签";
  }
}
// Recompute ratios from additive facts, never from averages of row-level ratios.
export function adTotals(rows: AdFact[]) {
  const sum = (
    key:
      | "spend"
      | "paid"
      | "coupon"
      | "subsidy"
      | "impressions"
      | "clicks"
      | "conversions"
      | "views",
  ) => rows.reduce((n, row) => n + row[key], 0);
  const spend = sum("spend"),
    paid = sum("paid"),
    coupon = sum("coupon"),
    subsidy = sum("subsidy");
  const impressions = sum("impressions"),
    clicks = sum("clicks"),
    conversions = sum("conversions"),
    gmv = paid + coupon + subsidy;
  return {
    spend: spend / 100,
    paid: paid / 100,
    coupon: coupon / 100,
    subsidy: subsidy / 100,
    gmv: gmv / 100,
    impressions,
    clicks,
    conversions,
    views: sum("views"),
    roi: ratio(gmv, spend),
    ctr: ratio(clicks, impressions) * 100,
    cvr: ratio(conversions, clicks) * 100,
    cpc: ratio(spend / 100, clicks),
    cpa: ratio(spend / 100, conversions),
    cpm: ratio(spend / 100, impressions) * 1000,
    materials: unique(rows.map((row) => row.materialId)).length,
    accounts: unique(rows.map((row) => row.accountId)).length,
  };
}
export function planTotals(rows: AdFact[]) {
  const plans = [...new Map(rows.map((row) => [row.planId, row])).values()];
  return {
    plans: plans.length,
    ...Object.fromEntries(
      PLAN_STATES.map((state, i) => [
        `state${i}`,
        plans.filter((row) => row.planStatus === state).length,
      ]),
    ),
  };
}
export function qualityTotals(rows: AdFact[]) {
  return Object.fromEntries(
    QUALITY_TAGS.flatMap((tag, i) => {
      const tagged = rows.filter((row) => row.qualityTags.includes(tag));
      return [
        [`quality${i}`, unique(tagged.map((row) => row.materialId)).length],
        [`qualitySpend${i}`, adTotals(tagged).spend],
      ];
    }),
  );
}
export function financeRows(facts: AdFact[], filter: AdFilter) {
  const selected = filterAdFacts(facts, { ...filter, start: REPORT_START });
  return grouped(selected, (row) => row.accountId).map(([id, history]) => {
    const current = history.filter((row) => row.date >= filter.start),
      sum = adTotals(current).spend;
    const before = adTotals(
      history.filter((row) => row.date < filter.start),
    ).spend;
    const opening = 50000 + Math.ceil(before / 20000) * 20000 - before;
    const deposit =
      Math.ceil((before + sum) / 20000) * 20000 -
      Math.ceil(before / 20000) * 20000;
    const cash = Math.round(sum * 80) / 100,
      grant = Math.round(sum * 10) / 100,
      rebate = Math.round(sum * 5) / 100,
      total = opening + deposit - sum;
    return {
      id,
      label: `${history[0].account} (${id})`,
      department: history[0].department,
      group: history[0].group,
      person: history[0].person,
      category: `${history[0].category} / ${history[0].subcategory}`,
      spend: sum,
      cash,
      grant,
      rebate,
      wallet: sum - cash - grant - rebate,
      opening,
      deposit,
      transferIn: 0,
      transferOut: 0,
      balance: total,
      grantBalance: Math.round(total * 10) / 100,
      cashBalance: total - Math.round(total * 10) / 100,
      standard: adTotals(current.filter((row) => row.promotion === "标准推广"))
        .spend,
      global: adTotals(current.filter((row) => row.promotion !== "标准推广"))
        .spend,
      rows: current,
    };
  });
}
export function csvText(headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const raw = String(value),
      text =
        typeof value === "string" && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n")
  );
}
export function downloadBlob(blob: Blob, filename: string) {
  recordExport(blob, filename, "数据报表");
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
