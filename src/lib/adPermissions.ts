// Persist the existing matrix key; retain the execution alias for older workflows.
export function normalizeAdPermissionKeys(keys: string[] = []): string[] {
  return [...new Set(keys.map(key => key === "uc_ad_push" ? "uc_finished_ad_push" : key))];
}

export function adExecutionPermissions(keys: string[]): string[] {
  const normalized = normalizeAdPermissionKeys(keys);
  return normalized.includes("uc_finished_ad_push") ? [...normalized, "uc_ad_push"] : normalized;
}
