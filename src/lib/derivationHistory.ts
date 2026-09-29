import type { AdPushRecord } from "./adPush";
import type { DerivationRecord } from "./videoDerivation";

export const derivationHistoryDate = (time: number) => new Date(time).toLocaleString("sv-SE");
export const derivationHistoryFilters = () => ({
  videoId: "", status: "", operator: "", pushId: "", assetId: "", title: "", note: "",
  start: new Date().toLocaleDateString("sv-SE"), end: new Date().toLocaleDateString("sv-SE"),
});
export type DerivationHistoryFilters = ReturnType<typeof derivationHistoryFilters>;
export interface DerivationHistoryRow {
  output: DerivationRecord;
  pushes: AdPushRecord[];
  assetIds: string[];
  operator: string;
}

export function derivationHistoryRows(records: DerivationRecord[], pushes: AdPushRecord[], ownerId: string, ownerName: string): DerivationHistoryRow[] {
  const linked = new Map<string, AdPushRecord[]>();
  for (const push of pushes) {
    if (push.operatorId !== ownerId || !push.derivativeId) continue;
    const group = linked.get(push.derivativeId) || [];
    group.push(push);
    linked.set(push.derivativeId, group);
  }
  return records.filter(record => record.ownerId === ownerId).map(output => {
    const related = linked.get(output.id) || [];
    return { output, pushes: related, assetIds: [...new Set(related.map(push => push.assetId).filter(Boolean))], operator: output.ownerName || ownerName };
  }).sort((a, b) => b.output.createdAt - a.output.createdAt || a.output.id.localeCompare(b.output.id));
}

export function filterDerivationHistory(rows: DerivationHistoryRow[], filters: DerivationHistoryFilters) {
  const matches = (text: string, value: string) => text.toLowerCase().includes(value.trim().toLowerCase());
  return rows.filter(({ output, pushes, assetIds }) => {
    const day = derivationHistoryDate(output.createdAt).slice(0, 10);
    return matches(output.source.id, filters.videoId) &&
      (!filters.status || output.status === filters.status) &&
      (!filters.operator || output.ownerId === filters.operator) &&
      (!filters.pushId.trim() || pushes.some(push => matches(push.id, filters.pushId))) &&
      (!filters.assetId.trim() || assetIds.some(id => matches(id, filters.assetId))) &&
      matches(`${output.source.title} ${output.name}`, filters.title) && matches(output.note, filters.note) &&
      (!filters.start || day >= filters.start) && (!filters.end || day <= filters.end);
  });
}

export const DERIVATION_HISTORY_COLUMNS = ["视频标题", "衍生视频", "素材ID", "衍生状态", "是否卡审", "操作人", "衍生时间", "更新时间", "推送记录ID", "备注", "操作", "系统信息"];

export function derivationHistoryExportRows(rows: DerivationHistoryRow[]): string[][] {
  return [DERIVATION_HISTORY_COLUMNS.filter(label => label !== "操作"), ...rows.map(({ output, assetIds, pushes, operator }) => [
    `${output.source.title}\nID：${output.source.id}`, output.name, assetIds.join(" / ") || "--", output.status,
    output.reviewBlocked === null ? "--" : output.reviewBlocked ? "是" : "否", operator,
    derivationHistoryDate(output.createdAt), derivationHistoryDate(output.updatedAt), pushes.map(push => push.id).join(" / ") || "--",
    output.note || "--", output.message || "--",
  ])];
}
