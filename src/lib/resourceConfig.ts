import { INITIAL_CATEGORIES, CategoryL1Node } from "../data/resourceCategories";

export const RESOURCE_PARTITIONS = { finished: "成片", materials: "素材", thirdParty: "第三方", images: "图片", audio: "音频", scripts: "脚本" } as const;
export const VIDEO_RESOURCE_SCOPES = { 成片: "finished", 素材: "materials", 第三方: "thirdParty" } as const;
export type VideoPartition = keyof typeof VIDEO_RESOURCE_SCOPES;
export type VideoResourceScope = typeof VIDEO_RESOURCE_SCOPES[VideoPartition];
export type ResourceScope = keyof typeof RESOURCE_PARTITIONS;
export type StatusKind = "video" | "script";
export interface ResourceStatusItem {
  id: string; name: string; partitions: string[]; textColor: string; bgColor: string;
  weight: number; notifyEnabled: boolean; isDefault: boolean;
}
export interface ConfigurableResource {
  id: string; status?: string; category?: string; primaryCategory?: string; secondaryCategory?: string;
  primaryCategoryId?: string; secondaryCategoryId?: string; statusId?: string; classTag?: string; basicType?: string;
}
type Update<T> = T | ((previous: T) => T);
type ResourceLink = { scope: string; primaryId?: string; secondaryId?: string; statusId?: string; original: ConfigurableResource };
const makeStatuses = (kind: StatusKind, names: string[]): ResourceStatusItem[] => names.map((name, i) => ({
  id: `${kind}-status-${i + 1}`, name, partitions: kind === "script" ? ["脚本"] : name === "已搭" ? ["成片"] : name === "画面利用" ? ["素材", "第三方"] : ["成片", "素材", "第三方"],
  textColor: "#FFFFFF", bgColor: name.includes("通过") ? "#059669" : name.includes("驳回") ? "#DC2626" : name === "已上机" ? "#2563EB" : "#64748B",
  weight: names.length - i, notifyEnabled: false, isDefault: i === 0,
}));
export const INITIAL_VIDEO_STATUSES = makeStatuses("video", ["待审核", "审核通过", "审核驳回", "已修改", "二次修改", "已上机", "已搭", "画面利用", "放弃"]);
export const INITIAL_SCRIPT_STATUSES = makeStatuses("script", ["待审核", "审核通过", "驳回-待修改", "已分配", "已归档"]);
const aliases: Record<string, string> = { "未审核": "待审核", "已通过": "审核通过", "审核不通过": "审核驳回", "已投放": "已上机", "1": "待审核", "2": "已分配" };
const kindOf = (scope: string): StatusKind | undefined => scope === "scripts" ? "script" : ["finished", "materials", "thirdParty"].includes(scope) ? "video" : undefined;
export const partitionOf = (scope: string) => RESOURCE_PARTITIONS[scope as ResourceScope] || scope;

export function createResourceConfigStore() {
  let categories = structuredClone(INITIAL_CATEGORIES);
  let statuses = { video: structuredClone(INITIAL_VIDEO_STATUSES), script: structuredClone(INITIAL_SCRIPT_STATUSES) };
  let settings = { video: { enabled: true, partitions: ["成片", "素材", "第三方"] }, script: { enabled: true, partitions: ["脚本"] } };
  const statusNameIds = new Map(Object.entries(statuses).flatMap(([kind, items]) => items.map(s => [`${kind}:${s.name}`, s.id] as const)));
  const categoryNameIds = new Map<string, { primaryId: string; secondaryId?: string }>();
  const rememberCategoryNames = () => {
    for (const [partition, nodes] of Object.entries(categories)) for (const parent of nodes) {
      categoryNameIds.set(`${partition}:${parent.name}`, { primaryId: parent.id });
      for (const child of parent.children) categoryNameIds.set(`${partition}:${parent.name} / ${child.name}`, { primaryId: parent.id, secondaryId: child.id });
    }
  };
  rememberCategoryNames();
  const links = new Map<string, ResourceLink>();
  const removedResources = new Set<string>();
  const listeners = new Set<() => void>();
  let revision = 0;
  const emit = () => { revision++; listeners.forEach(listener => listener()); };
  const key = (scope: string, id: string) => `${scope}:${id}`;
  const categoryNodes = (scope: string) => categories[partitionOf(scope)] || [];
  const rawStatuses = (scope: string) => {
    const kind = kindOf(scope);
    return kind ? statuses[kind].filter(s => s.partitions.includes(partitionOf(scope))).sort((a, b) => b.weight - a.weight) : [];
  };
  const resolveCategory = (scope: string, resource: ConfigurableResource, catalog = categories, allowHistorical = true) => {
    const nodes = catalog[partitionOf(scope)] || [];
    const [fromPath = "", fromChild = ""] = (resource.category || resource.classTag || resource.basicType || "").split(" / ");
    const primaryName = resource.primaryCategory ?? fromPath, secondaryName = resource.secondaryCategory ?? fromChild;
    const historical = allowHistorical ? categoryNameIds.get(`${partitionOf(scope)}:${[primaryName, secondaryName].filter(Boolean).join(" / ")}`) : undefined;
    const primary = nodes.find(n => n.id === resource.primaryCategoryId || n.name === primaryName) || nodes.find(n => n.id === historical?.primaryId);
    const secondary = primary?.children.find(n => n.id === resource.secondaryCategoryId || n.name === secondaryName) || primary?.children.find(n => n.id === historical?.secondaryId);
    return { primaryId: primary?.id, secondaryId: secondary?.id };
  };
  const resolveStatus = (scope: string, resource: ConfigurableResource, allowHistorical = true) => {
    const options = rawStatuses(scope);
    let name = aliases[resource.status || ""] || resource.status;
    if (scope === "scripts" && name === "审核驳回") name = "驳回-待修改";
    return (options.find(s => s.id === resource.statusId || s.name === name) || (allowHistorical && options.find(s => s.id === statusNameIds.get(`${kindOf(scope)}:${name}`))))?.id;
  };
  const linkFor = (scope: string, resource: ConfigurableResource): ResourceLink => links.get(key(scope, resource.id)) || {
    scope, ...resolveCategory(scope, resource), statusId: resolveStatus(scope, resource), original: resource,
  };
  const project = <T extends ConfigurableResource>(scope: string, resource: T): T => {
    const link = linkFor(scope, resource);
    const primary = categoryNodes(scope).find(n => n.id === link.primaryId);
    const secondary = primary?.children.find(n => n.id === link.secondaryId);
    const kind = kindOf(scope);
    const status = kind && statuses[kind].find(s => s.id === link.statusId);
    const category = primary ? [primary.name, secondary?.name].filter(Boolean).join(" / ") : resource.category;
    return { ...resource, ...(primary ? { category, primaryCategory: primary.name, secondaryCategory: secondary?.name || "", primaryCategoryId: primary.id, secondaryCategoryId: secondary?.id,
      ...(scope === "scripts" ? { classTag: category, basicType: category } : {}) } : {}), ...(status ? { status: status.name, statusId: status.id } : {}) };
  };
  const register = (scope: string, resources: ConfigurableResource[]) => {
    let changed = false;
    for (const resource of resources) {
      if (links.has(key(scope, resource.id)) || removedResources.has(key(scope, resource.id))) continue;
      links.set(key(scope, resource.id), linkFor(scope, resource)); changed = true;
    }
    if (changed) emit();
  };
  const prepareAssignment = (scope: string, resource: ConfigurableResource, patch: Partial<ConfigurableResource>) => {
      const link = { ...linkFor(scope, resource) };
      if (patch.status !== undefined || patch.statusId !== undefined) {
        const id = resolveStatus(scope, patch as ConfigurableResource, false);
        if (!id && (patch.status || patch.statusId)) throw new Error("请选择当前可用的状态");
        link.statusId = id;
      }
      if (patch.category !== undefined || patch.primaryCategory !== undefined || patch.primaryCategoryId !== undefined) {
        const ids = resolveCategory(scope, patch as ConfigurableResource, categories, false);
        if (!ids.primaryId && (patch.category || patch.primaryCategory || patch.primaryCategoryId)) throw new Error("请选择当前可用的分类");
        const requestedChild = patch.secondaryCategoryId || patch.secondaryCategory || patch.category?.split(" / ")[1];
        if (requestedChild && !ids.secondaryId) throw new Error("请选择当前一级分类下可用的二级分类");
        Object.assign(link, ids);
      }
      return link;
    };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => revision,
    getCategories: () => categories,
    categories: categoryNodes,
    categoryMap: (scope: string) => Object.fromEntries(categoryNodes(scope).map(n => [n.name, n.children.map(c => c.name)])),
    categoryValid(scope: string, primary: string, secondary = "") {
      const parent = categoryNodes(scope).find(node => node.name === primary);
      return !!parent && (secondary ? parent.children.some(child => child.name === secondary) : !parent.children.length);
    },
    setCategories(update: Update<Record<string, CategoryL1Node[]>>) {
      const next = typeof update === "function" ? update(categories) : update;
      for (const link of links.values()) {
        if (!link.primaryId) continue;
        const parent = (next[partitionOf(link.scope)] || []).find(n => n.id === link.primaryId);
        if (!parent || (link.secondaryId && !parent.children.some(c => c.id === link.secondaryId))) throw new Error("该分类下存在资源，无法删除。请先调整资源分类。");
      }
      categories = structuredClone(next); rememberCategoryNames(); emit();
    },
    categoryUsage(scope: string, id: string) { return [...links.values()].filter(l => l.scope === scope && (l.primaryId === id || l.secondaryId === id)).length; },
    getStatusCatalog: (kind: StatusKind) => statuses[kind],
    getSettings: (kind: StatusKind) => settings[kind],
    setSettings(kind: StatusKind, value: { enabled: boolean; partitions: string[] }) { settings = { ...settings, [kind]: structuredClone(value) }; emit(); },
    statusEnabled(scope: string) { const kind = kindOf(scope); return !kind || (settings[kind].enabled && settings[kind].partitions.includes(partitionOf(scope))); },
    statuses: rawStatuses,
    defaultStatus(scope: string) { const options = rawStatuses(scope); return (options.find(s => s.isDefault) || options[0])?.name || ""; },
    statusStyle(scope: string, name?: string) { const status = rawStatuses(scope).find(s => s.name === name); return status ? { color: status.textColor, backgroundColor: status.bgColor } : {}; },
    setStatusCatalog(kind: StatusKind, update: Update<ResourceStatusItem[]>) {
      const next = typeof update === "function" ? update(statuses[kind]) : update;
      if (next.some(s => !s.name.trim() || !s.partitions.length)) throw new Error("请填写状态名称并选择适用分区");
      if (next.filter(s => s.isDefault).length !== 1) throw new Error("必须保留一个默认状态");
      if (next.some(s => !Number.isFinite(s.weight) || !/^#[\da-f]{6}$/i.test(s.textColor) || !/^#[\da-f]{6}$/i.test(s.bgColor))) throw new Error("请输入有效的权重与颜色");
      if (new Set(next.map(s => s.name.trim())).size !== next.length) throw new Error("状态名称不能重复");
      for (const link of links.values()) {
        if (kindOf(link.scope) !== kind || !link.statusId) continue;
        const status = next.find(s => s.id === link.statusId);
        if (!status || !status.partitions.includes(partitionOf(link.scope))) throw new Error("该状态正在使用，不能移除其关联分区或直接删除。");
      }
      statuses = { ...statuses, [kind]: structuredClone(next) };
      next.forEach(s => statusNameIds.set(`${kind}:${s.name}`, s.id)); emit();
    },
    statusUsage(kind: StatusKind, id: string) { return [...links.values()].filter(l => kindOf(l.scope) === kind && l.statusId === id).length; },
    replacementStatuses(kind: StatusKind, id: string) {
      const used = [...links.values()].filter(l => kindOf(l.scope) === kind && l.statusId === id).map(l => partitionOf(l.scope));
      return statuses[kind].filter(s => s.id !== id && used.every(partition => s.partitions.includes(partition)));
    },
    deleteStatus(kind: StatusKind, id: string, replacementId?: string) {
      const source = statuses[kind].find(s => s.id === id);
      if (!source) throw new Error("状态已不存在");
      if (source.isDefault) throw new Error("请先将其他状态设为默认值");
      const affected = [...links.values()].filter(l => kindOf(l.scope) === kind && l.statusId === id);
      const target = statuses[kind].find(s => s.id === replacementId && s.id !== id);
      if ((affected.length || replacementId) && !target) throw new Error("该状态正在使用，请选择替代状态后删除");
      if (target && affected.some(l => !target.partitions.includes(partitionOf(l.scope)))) throw new Error("替代状态必须适用于所有受影响的资源分区");
      affected.forEach(link => { link.statusId = target!.id; });
      for (const [name, statusId] of statusNameIds) if (statusId === id) { if (target) statusNameIds.set(name, target.id); else statusNameIds.delete(name); }
      statuses = { ...statuses, [kind]: statuses[kind].filter(s => s.id !== id) }; emit();
    },
    register, project,
    isRemoved(scope: string, id: string) { return removedResources.has(key(scope, id)); },
    validateAssignment(scope: string, resource: ConfigurableResource, patch: Partial<ConfigurableResource>) { prepareAssignment(scope, resource, patch); },
    assign(scope: string, resource: ConfigurableResource, patch: Partial<ConfigurableResource>) {
      links.set(key(scope, resource.id), prepareAssignment(scope, resource, patch)); emit();
    },
    removeResource(scope: string, id: string) { removedResources.add(key(scope, id)); if (links.delete(key(scope, id))) emit(); },
  };
}

export const resourceConfigStore = createResourceConfigStore();
