import { dimensionKey, reportRows, shiftDate, statusTotals, type ReportFact } from "./reportDemoData";
import { reportSelectLeaves, type ReportSelectOption } from "./reportMultiSelect";
import type { organizationTree } from "./analyticsOrganization";

export type DeliveryDimension = "team" | "group" | "personal" | "advertiser_detail";
export type DeliveryStatusKey = "total" | "delivering" | "pending" | "terminated" | "finished" | "deleted";
export interface DeliveryFilters {
  platform: string;
  dimension: DeliveryDimension;
  selectedEntities: string[];
  advertiserAccountId: string;
  categories: string[];
  startDate: string;
  endDate: string;
}
export interface DeliveryStatusRow {
  id: string; name: string; legendName: string;
  team: string; group: string; user: string;
  accountName: string; accountId: string; cat1: string; cat2: string; liveRoom: string;
  total: number; delivering: number; pending: number; terminated: number; finished: number; deleted: number;
  facts: ReportFact[];
}

export function deliveryEntityOptions(tree: ReturnType<typeof organizationTree>, dimension: DeliveryDimension): ReportSelectOption[] {
  return tree.map(dept => ({ value: dept.teamName, label: dept.teamName,
    ...(dimension === "team" ? {} : { children: dept.groups.map(group => ({
      value: `${dept.teamName} / ${group.groupName}`, label: group.groupName,
      ...(dimension === "group" ? {} : { children: group.accounts.map(person => ({ value: `${dept.teamName} / ${group.groupName} / ${person}`, label: person })) }),
    })) }),
  }));
}

export function deliveryCategoryOptions(categories: { name: string; children: { name: string }[] }[]): ReportSelectOption[] {
  return categories.map(category => ({ value: category.name, label: category.name,
    children: category.children.map(child => ({ value: `${category.name} / ${child.name}`, label: child.name })),
  }));
}

export function buildDeliveryReport(facts: ReportFact[], filters: DeliveryFilters | null, options: ReportSelectOption[]) {
  const empty = { rows: [] as DeliveryStatusRow[], totals: statusTotals([]), dates: [] as string[] };
  if (!filters || !filters.startDate || !filters.endDate || filters.startDate > filters.endDate) return empty;
  if (!Number.isFinite(Date.parse(filters.startDate)) || !Number.isFinite(Date.parse(filters.endDate))) return empty;
  const advertiser = filters.dimension === "advertiser_detail";
  const selected = reportSelectLeaves(options).filter(option => filters.selectedEntities.includes(option.value));
  if (advertiser ? !filters.advertiserAccountId && !filters.categories.length : !selected.length) return empty;
  const dimension = advertiser ? "account" : filters.dimension;
  const candidates = facts.filter(row => row.platform === filters.platform && (advertiser
    ? (!filters.advertiserAccountId || row.accountId.includes(filters.advertiserAccountId)) &&
      (!filters.categories.length || filters.categories.includes(`${row.category} / ${row.subcategory}`))
    : selected.some(option => option.value === dimensionKey(row, dimension))));
  // Keep matched identities before applying dates so zero-plan selections remain visible.
  const identities = reportRows(candidates, dimension);
  const selections = advertiser ? identities.map(row => ({ value: row.id, label: row.name })) : selected;
  const rows: DeliveryStatusRow[] = selections.map(option => {
    const identity = identities.find(row => row.id === option.value);
    const selectedFacts = (identity?.facts || []).filter(row => row.planCreatedAt >= filters.startDate && row.planCreatedAt <= filters.endDate);
    return { id: option.value, name: option.label, legendName: option.label,
      team: identity?.team || "", group: identity?.group || "", user: identity?.user || "",
      accountName: identity?.accountName || "", accountId: identity?.accountId || "",
      cat1: identity?.cat1 || "", cat2: identity?.cat2 || "", liveRoom: identity?.liveRoom || "/",
      ...statusTotals(selectedFacts), facts: selectedFacts };
  });
  for (const row of rows) if (rows.filter(other => other.name === row.name).length > 1) row.legendName = advertiser ? `${row.name} (${row.accountId})` : row.id;
  const dates: string[] = [];
  if (rows.length) for (let date = filters.startDate; date <= filters.endDate; date = shiftDate(date, 1)) dates.push(date);
  return { rows, dates, totals: statusTotals(rows.flatMap(row => row.facts)) };
}

export function deliveryChartData(rows: DeliveryStatusRow[], dates: string[], metric: DeliveryStatusKey) {
  const daily = rows.map(row => {
    const groups = new Map<string, ReportFact[]>();
    for (const fact of row.facts) {
      const day = groups.get(fact.planCreatedAt) || [];
      day.push(fact);
      groups.set(fact.planCreatedAt, day);
    }
    return new Map([...groups].map(([date, facts]) => [date, statusTotals(facts)[metric]]));
  });
  // Series keys never contain user-provided punctuation interpreted as a chart property path.
  return dates.map(date => ({ date, ...Object.fromEntries(rows.map((row, index) => [`series${index}`, daily[index].get(date) || 0])) }));
}
