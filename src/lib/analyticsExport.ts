import { exportHistoryCsv, recordExport, startFileDownload } from "./operationHistory";

export type AnalyticsExportFormat = "csv" | "xlsx";
export type AnalyticsExportCell = string | number;

export interface AnalyticsExportFilter {
  label: string;
  value?: string | null;
}

export interface AnalyticsExportRequest {
  format: AnalyticsExportFormat;
  name: string;
  startDate: string;
  endDate: string;
}

const emptyFilter = /^(全部|不限|all)$/i;

export function analyticsExportTimestamp(date = new Date()) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}${part(date.getHours())}${part(date.getMinutes())}${part(date.getSeconds())}`;
}

export function sanitizeAnalyticsExportPart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|_]+/g, "-")
    .replace(/\s+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function buildAnalyticsExportName({
  pageName,
  filters,
  startDate,
  endDate,
  now = new Date(),
}: {
  pageName: string;
  filters: AnalyticsExportFilter[];
  startDate: string;
  endDate: string;
  now?: Date;
}) {
  const activeFilters = filters.flatMap(({ label, value }) => {
    const normalized = value?.trim() || "";
    if (!normalized || emptyFilter.test(normalized)) return [];
    return [sanitizeAnalyticsExportPart(`${label}-${normalized}`)];
  });
  const range = startDate || endDate
    ? sanitizeAnalyticsExportPart(`时间-${startDate || "未设置"}至${endDate || "未设置"}`)
    : "";
  return [sanitizeAnalyticsExportPart(pageName), analyticsExportTimestamp(now), ...activeFilters, range]
    .filter(Boolean)
    .join("_")
    .slice(0, 180);
}

export function analyticsExportFileName(name: string, format: AnalyticsExportFormat) {
  const base = name
    .trim()
    .replace(/\.(csv|xlsx?)$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "")
    .replace(/-+/g, "-")
    .replace(/^[.\s-]+|[.\s-]+$/g, "")
    .slice(0, 180) || "数据导出";
  return `${base}.${format}`;
}

export async function exportAnalyticsRows(
  rows: AnalyticsExportCell[][],
  request: AnalyticsExportRequest,
  recordType: string,
) {
  const safeRows = rows.length ? rows : [["暂无数据"]];
  const fileName = analyticsExportFileName(request.name, request.format);
  if (request.format === "csv") {
    exportHistoryCsv(fileName, safeRows, recordType);
    return fileName;
  }

  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const columnCount = Math.max(...safeRows.map((row) => row.length));
  const blob = await writeXlsxFile(safeRows, {
    sheet: sanitizeAnalyticsExportPart(recordType).slice(0, 31) || "数据导出",
    columns: Array.from({ length: columnCount }, () => ({ width: 18 })),
  }).toBlob();
  recordExport(blob, fileName, recordType);
  const url = URL.createObjectURL(blob);
  startFileDownload(url, fileName);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return fileName;
}
