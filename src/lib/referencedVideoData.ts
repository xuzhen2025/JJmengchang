import { REPORT_TODAY, shiftDate, ratio } from "./analyticsData";
import type { ReportOrganization } from "./analyticsOrganization";

export type ReferenceDimension = "team" | "group" | "author";
export interface ReferenceDateRange { start: string; end: string; }
export interface ReferenceFilters {
  dimension: ReferenceDimension; entityId: string; upload: ReferenceDateRange;
}
export const REFERENCE_DIMENSIONS = [{ id: "team", label: "团队" }, { id: "group", label: "分组" }, { id: "author", label: "作者" }] as const;
export const validReferenceRange = ({ start, end }: ReferenceDateRange) => !start || !end || start <= end;
const inRange = (date: string, { start, end }: ReferenceDateRange) => (!start || date >= start) && (!end || date <= end);

interface ReferenceDailyFact {
  date: string; cost: number; paid: number; coupon: number; subsidy: number; refund: number;
  conversions: number; refundOrders: number; impressions: number; clicks: number; plays: number;
  completed: number; effective: number; finish3s: number;
}
export interface ReferencedVideoExample {
  id: string; title: string; coverUrl: string; duration: string; memberId: string; author: string;
  authorAvatar?: string; organizationId: string; date: string; associatedAt: string;
  cost: number; roi: number; conversions: number; status: string; daily: ReferenceDailyFact[];
}

export function referenceEntityOptions(org: ReportOrganization, dimension: ReferenceDimension) {
  if (dimension === "author") return org.members.map(member => ({ id: member.id, label: member.name, detail: org.depts.find(node => node.id === member.deptId)?.name || "未归属部门" }));
  return org.depts.filter(node => dimension === "group" ? node.levelType === "group" : node.levelType === "department").map(node => ({
    id: node.id, label: node.name, detail: dimension === "group" ? org.depts.find(parent => parent.id === node.parentId)?.name || "" : "",
  }));
}

// These three existing cards are prototype references; daily facts are not live advertising data.
export function createReferencedVideoExamples(org: ReportOrganization, today = REPORT_TODAY): ReferencedVideoExample[] {
  const examples = [
    { id: "dv1", title: "0730-复古古法金耳环高级质感种草成片_v1.mp4", coverUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80", duration: "15s", memberId: "mem_demo_4", age: 14, associatedAge: 12, cost: 1280, roi: 3.85, conversions: 142, status: "投放中" },
    { id: "dv2", title: "0729-水光肌上脸实测对比爆款视频_v2.mp4", coverUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80", duration: "30s", memberId: "mem_demo_2", age: 17, associatedAge: 15, cost: 3450, roi: 4.12, conversions: 380, status: "投放中" },
    { id: "dv3", title: "0725-夏日清爽控油晚霜对比演示_切片.mp4", coverUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80", duration: "22s", memberId: "mem_demo_6", age: 21, associatedAge: 18, cost: 890, roi: 2.95, conversions: 95, status: "已暂停" },
  ];
  return examples.map((example, index) => {
    const member = org.members.find(item => item.id === example.memberId);
    const weights = Array.from({ length: 14 }, (_, day) => 7 + (day * 3 + index * 5) % 11);
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
    const portion = (total: number, day: number) => {
      const previous = weights.slice(0, day).reduce((sum, weight) => sum + weight, 0);
      return Math.round(total * (previous + weights[day]) / weightTotal) - Math.round(total * previous / weightTotal);
    };
    const totalGmv = Math.round(example.cost * example.roi * 100);
    const totalCoupon = example.conversions * 150;
    const totalSubsidy = example.conversions * 50;
    const paid = totalGmv - totalCoupon - totalSubsidy;
    const refundOrders = Math.floor(example.conversions * 0.05);
    const daily = weights.map((_, day) => {
      const conversions = portion(example.conversions, day);
      const clicks = conversions * (19 + index * 4);
      const impressions = clicks * (32 + index * 3);
      const plays = Math.round(impressions * 0.76);
      return {
        date: shiftDate(today, -example.age + day + 1), cost: portion(example.cost * 100, day),
        paid: portion(paid, day), coupon: portion(totalCoupon, day), subsidy: portion(totalSubsidy, day),
        refund: portion(Math.round(paid * refundOrders / example.conversions), day),
        conversions, refundOrders: portion(refundOrders, day), clicks, impressions, plays,
        completed: Math.round(plays * 0.12), effective: Math.round(plays * 0.48), finish3s: Math.round(plays * 0.52),
      };
    });
    return { ...example, author: member?.name || "未关联员工", authorAvatar: member?.avatar, organizationId: member?.deptId || "",
      date: shiftDate(today, -example.age), associatedAt: shiftDate(today, -example.associatedAge), daily };
  });
}

function belongsTo(org: ReportOrganization, nodeId: string, targetId: string) {
  const visited = new Set<string>();
  let current: string | null = nodeId;
  while (current && !visited.has(current)) {
    if (current === targetId) return true;
    visited.add(current);
    current = org.depts.find(node => node.id === current)?.parentId || null;
  }
  return false;
}

export function selectReferencedVideos(videos: ReferencedVideoExample[], org: ReportOrganization, filters: ReferenceFilters, sortOrder: string) {
  if (!validReferenceRange(filters.upload)) return [];
  return videos.filter(video => inRange(video.date, filters.upload) && (!filters.entityId ||
    (filters.dimension === "author" ? video.memberId === filters.entityId : belongsTo(org, video.organizationId, filters.entityId))))
    .sort((a, b) => {
      if (sortOrder === "按消耗金额排序") return b.cost - a.cost || a.id.localeCompare(b.id);
      if (sortOrder === "按ROI高到低排序") return b.roi - a.roi || a.id.localeCompare(b.id);
      if (sortOrder === "按转化数排序") return b.conversions - a.conversions || a.id.localeCompare(b.id);
      return b.associatedAt.localeCompare(a.associatedAt) || a.id.localeCompare(b.id);
    });
}

export function referencedVideoTotals(videos: ReferencedVideoExample[], spend: ReferenceDateRange) {
  const facts = validReferenceRange(spend) ? videos.flatMap(video => video.daily.filter(day => inRange(day.date, spend))) : [];
  const sum = (key: Exclude<keyof ReferenceDailyFact, "date">) => facts.reduce((total, day) => total + day[key], 0);
  const cost = sum("cost") / 100, paid = sum("paid") / 100, coupon = sum("coupon") / 100, subsidy = sum("subsidy") / 100;
  const totalAmount = paid + coupon + subsidy, conversions = sum("conversions"), impressions = sum("impressions"), clicks = sum("clicks"), plays = sum("plays");
  const netAmount = totalAmount - sum("refund") / 100, netOrders = conversions - sum("refundOrders");
  return {
    cost, roi: ratio(totalAmount, cost), paid, coupon, totalAmount, subsidy, conversions,
    cvr: ratio(conversions, clicks) * 100, cpa: ratio(cost, conversions), impressions, cpm: ratio(cost, impressions) * 1000,
    clicks, ctr: ratio(clicks, impressions) * 100, cpc: ratio(cost, clicks), plays,
    completionRate: ratio(sum("completed"), plays) * 100, effectivePlayRate: ratio(sum("effective"), plays) * 100,
    finish3sRate: ratio(sum("finish3s"), plays) * 100, netAmount, netOrders, netRoi: ratio(netAmount, cost), netCpa: ratio(cost, netOrders),
  };
}
