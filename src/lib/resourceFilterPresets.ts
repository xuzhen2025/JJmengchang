export const FILTER_PRESET_LIMIT = 5;
export type FilterValues = Record<string, string>;
export type ResourcePresetScope = "finished" | "materials" | "thirdParty" | "scripts" | "images" | "audio";

export interface FilterPreset<T extends FilterValues = FilterValues> {
  id: string;
  name: string;
  filters: T;
}

export interface FilterPresetSeed<T extends FilterValues> {
  name: string;
  filters: Partial<T>;
}

export function filterPresetStorageKey(username: string, scope: ResourcePresetScope) {
  return `mengchang-filter-presets-v1:${encodeURIComponent(username)}:${scope}`;
}

export function normalizePresetFilters<T extends FilterValues>(value: unknown, defaults: T): T {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [
    key, typeof source[key] === "string" ? source[key] : fallback,
  ])) as T;
}

export function samePresetFilters(left: FilterValues, right: FilterValues) {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(key => left[key] === right[key]);
}

export function readFilterPresets<T extends FilterValues>(raw: string | null, defaults: T, seeds: FilterPresetSeed<T>[] = []): FilterPreset<T>[] {
  if (raw === null) {
    return seeds.slice(0, FILTER_PRESET_LIMIT).map((seed, index) => ({
      id: `seed-${index}`, name: seed.name, filters: normalizePresetFilters(seed.filters, defaults),
    }));
  }
  const stored = JSON.parse(raw);
  if (stored?.version !== 1 || !Array.isArray(stored.presets) || stored.presets.length > FILTER_PRESET_LIMIT) {
    throw new Error("Invalid preset storage");
  }
  const ids = new Set<string>();
  const names = new Set<string>();
  return stored.presets.map((item: unknown) => {
    const preset = item as FilterPreset<T> | null;
    if (!preset || typeof preset.id !== "string" || !preset.id || typeof preset.name !== "string" || !preset.name.trim()
      || !preset.filters || typeof preset.filters !== "object" || Array.isArray(preset.filters)
      || ids.has(preset.id) || names.has(preset.name.trim())) throw new Error("Invalid preset record");
    ids.add(preset.id);
    names.add(preset.name.trim());
    return { id: preset.id, name: preset.name.trim(), filters: normalizePresetFilters(preset.filters, defaults) };
  });
}

export type PresetSaveResult<T extends FilterValues> =
  | { status: "saved"; presets: FilterPreset<T>[]; preset: FilterPreset<T> }
  | { status: "confirm-overwrite"; preset: FilterPreset<T> }
  | { status: "empty-name" | "limit" | "missing" };

export function saveFilterPreset<T extends FilterValues>(
  presets: FilterPreset<T>[], name: string, filters: T, newId: string, overwriteId?: string,
): PresetSaveResult<T> {
  const trimmed = name.trim();
  if (!trimmed) return { status: "empty-name" };
  const existing = presets.find(preset => preset.name === trimmed);
  if (overwriteId && existing?.id !== overwriteId) return { status: "missing" };
  if (existing && existing.id !== overwriteId) return { status: "confirm-overwrite", preset: existing };
  if (!existing && presets.length >= FILTER_PRESET_LIMIT) return { status: "limit" };
  const preset = { id: existing?.id || newId, name: trimmed, filters: { ...filters } };
  return {
    status: "saved", preset,
    presets: existing ? presets.map(item => item.id === existing.id ? preset : item) : [...presets, preset],
  };
}

export function removeFilterPreset<T extends FilterValues>(presets: FilterPreset<T>[], id: string) {
  return presets.filter(preset => preset.id !== id);
}

export const VIDEO_PRESET_DEFAULTS = {
  searchQuery: "", primaryCat: "全部", secondarySearch: "", secondaryCat: "全部", statusVal: "全部",
  publicTagSearch: "", publicTagKeyword: "", selectedPublicTag: "全部", personalTagSearch: "", personalTagFilter: "all",
  sortBy: "最新发布", adPlatformTag: "不限广告平台标签", costRange: "不限", systemAutoTag: "请选择系统标签",
  authorType: "作者", authorInput: "", timeType: "上传时间", startDate: "", endDate: "",
};

export const SCRIPT_PRESET_DEFAULTS = {
  searchQuery: "", selectedPrimaryCat: "全部", selectedSecondaryCat: "全部", secondarySearch: "", selectedStatus: "全部",
  publicTagSearch: "", publicTagKeyword: "", personalTagSearch: "", selectedPersonalTag: "全部", sortBy: "最新发布",
  templateFilter: "", authorFilter: "", authorSearch: "", startDate: "", endDate: "",
};

export const IMAGE_PRESET_DEFAULTS = {
  searchQuery: "", selectedPrimaryCat: "全部", secondarySearch: "", selectedSecondaryCat: "全部",
  publicTagSearch: "", publicTagKeyword: "", personalTagSearch: "", selectedPersonalTag: "全部", sortBy: "最新发布",
  authorFilter: "", authorSearch: "", selectedShopLink: "", systemAutoTag: "", startDate: "", endDate: "",
};

export const AUDIO_PRESET_DEFAULTS = {
  searchQuery: "", selectedPrimaryCategory: "全部", selectedSecondaryCategory: "全部",
  selectedPublicTag: "全部", selectedPersonalTag: "全部", sortBy: "最新发布", searchCategoryKeyword: "",
  searchPublicTagKeyword: "", searchPersonalTagKeyword: "", searchAuthorKeyword: "", startDate: "", endDate: "",
};
