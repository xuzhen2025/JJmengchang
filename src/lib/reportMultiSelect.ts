export interface ReportSelectOption {
  value: string;
  label: string;
  children?: ReportSelectOption[];
}

export function reportSelectLeaves(options: ReportSelectOption[]): ReportSelectOption[] {
  return options.flatMap(option => option.children ? reportSelectLeaves(option.children) : [option]);
}

export function reportSelectState(option: ReportSelectOption, values: string[]) {
  const leaves = reportSelectLeaves([option]);
  const count = leaves.filter(leaf => values.includes(leaf.value)).length;
  return { checked: leaves.length > 0 && count === leaves.length, mixed: count > 0 && count < leaves.length, disabled: leaves.length === 0 };
}

export function toggleReportSelection(option: ReportSelectOption, values: string[]) {
  const leaves = reportSelectLeaves([option]).map(leaf => leaf.value);
  return reportSelectState(option, values).checked
    ? values.filter(value => !leaves.includes(value))
    : [...new Set([...values, ...leaves])];
}

export function filterReportOptions(options: ReportSelectOption[], query: string): ReportSelectOption[] {
  const search = query.trim().toLocaleLowerCase();
  if (!search) return options;
  return options.flatMap(option => {
    if (option.label.toLocaleLowerCase().includes(search)) return [option];
    const children = option.children && filterReportOptions(option.children, query);
    return children?.length ? [{ ...option, children }] : [];
  });
}

export function reportSelectPath(options: ReportSelectOption[], value?: string): string[] {
  for (const option of options) {
    if (!option.children && (!value || option.value === value)) return [option.value];
    const path = option.children && reportSelectPath(option.children, value);
    if (path?.length) return [option.value, ...path];
  }
  return [];
}
