export type TagKind = "public" | "personal";
export interface PublicTag {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  aiDirection?: string;
  description?: string;
  imageUrl?: string;
}
export interface PublicTagGroup {
  id: string;
  name: string;
  rule: "multi" | "single";
  categories: string[];
  requiredCategories: string[];
  hasAdminPermission: boolean;
  subTags: PublicTag[];
  badges: { label: string; color: string }[];
}
export interface PersonalTag {
  id: string;
  name: string;
  color: string;
  resourceIds: string[];
}
export interface PersonalTagGroup { id: string; name: string; tagIds: string[] }
export interface TaggedResource {
  id: string;
  tags?: string[];
  publicTags?: string[];
  personalTags?: string[];
  personalTag?: string;
}
export interface TagCategoryNode { name: string; children: { name: string }[] }
type Update<T> = T | ((previous: T) => T);
type TagEntry = { id: string; name: string; groupId: string; groupName: string; label: string };
type Links = { public?: string[]; personal: Record<string, string[]> };

const PUBLIC_EXAMPLES: Record<string, string[]> = {
  "商品卖点": ["高弹透气", "轻盈裸感", "极致无痕", "德绒蓄热", "防勾抗起球", "清凉冰丝", "成分卖点", "夜间修护", "抗衰", "防晒", "轻量设计", "体态矫正", "安全舒适"],
  "内容表达": ["产品实拍", "商品展示", "质地特写", "材质特写", "细节展示", "模特出镜", "口播种草", "实测对比", "效果对比", "痛点解说", "使用过程", "剧情反转", "混剪卡点", "对标翻拍", "二创衍生", "原创", "好物推荐", "节日送礼", "前后对比", "穿搭展示", "成分党"],
  "画面场景": ["室内棚拍", "户外实景", "家庭生活", "办公室", "街拍", "晨间场景", "礼赠场景", "通勤穿搭", "居家护理", "桌面搭配", "白底图", "宣发海报", "高端质感", "精修平铺"],
  "商品主题": ["美妆护肤", "服饰内衣", "美肤衣", "秋冬新品", "秒缇前扣", "男士内衣", "少女系列", "情侣家居", "高端礼盒", "日常好物", "智能穿戴", "数码好物", "手机数码", "办公好物", "气质女装", "运动鞋履", "表盘细节", "外观设计", "户外用品", "女装"],
  "投放用途": ["达人成片", "腾讯广告", "千川投流", "快手挂车", "抖音卡片", "短视频推广", "首发素材", "直播切片"],
  "声音风格": ["温柔女声", "自然男声", "轻快节奏", "舒缓氛围", "商品旁白", "促销口播", "转场音效", "纯音乐"],
  "制作来源": ["实拍素材", "AI生成", "AI处理", "视频换脸", "画质增强", "字幕擦除", "视频去水印", "商品套图", "商品场景图", "商品成片", "电商营销", "个人上传"],
};
const PERSONAL_EXAMPLES: Record<string, string[]> = {
  "内容排期": ["本周主推", "待二创", "秋季上新"],
  "转化备选": ["高转化备选", "需补充素材", "口播专项"],
  "项目归档": ["美妆项目", "已交付", "服饰项目"],
  "资料用途": ["精选主图", "品牌资质", "营销资料库", "重点素材", "3D渲染图"],
};
export const INITIAL_PUBLIC_TAG_GROUPS: PublicTagGroup[] = Object.entries(PUBLIC_EXAMPLES).map(([name, names], index) => ({
  id: `public-group-${index + 1}`, name, rule: "multi", categories: ["成片", "素材", "图片", "脚本", "音频"],
  requiredCategories: [], hasAdminPermission: false,
  badges: [{ label: "图", color: "bg-emerald-500" }, { label: "音", color: "bg-amber-500" }, { label: "脚", color: "bg-sky-500" }],
  subTags: names.map((tag, i) => ({ id: `public-tag-${index + 1}-${i + 1}`, name: tag })),
}));
function personalExamples() {
  const tags: PersonalTag[] = [];
  const groups = Object.entries(PERSONAL_EXAMPLES).map(([name, names], index) => ({
    id: `personal-group-${index + 1}`, name,
    tagIds: names.map((name, i) => {
      const id = `personal-tag-${index + 1}-${i + 1}`;
      tags.push({ id, name, color: ["#7c3aed", "#0284c7", "#059669", "#d97706"][index], resourceIds: [] });
      return id;
    }),
  }));
  return { tags, groups };
}
const initialPersonal = personalExamples();
const clone = <T,>(value: T): T => structuredClone(value);

export function applicablePublicTagGroups(
  groups: PublicTagGroup[],
  categories: TagCategoryNode[],
  categoryPath: string,
  rootCategory = "成片",
) {
  const [primary = "", secondary = ""] = categoryPath.split(" / ").map((part) => part.trim());
  if (!primary || !secondary) return [];

  const primaryNames = new Set(categories.map((category) => category.name));
  const secondaryNames = new Set(categories.flatMap((category) => category.children.map((child) => child.name)));

  return groups.filter((group) => {
    const configured = new Set(group.categories.map((category) => category.trim()));
    const configuredPrimaries = group.categories.filter((category) => primaryNames.has(category));
    const configuredSecondaries = group.categories.filter((category) => secondaryNames.has(category));

    if (configuredSecondaries.length > 0) {
      return configured.has(secondary) && (configuredPrimaries.length === 0 || configured.has(primary));
    }
    if (configuredPrimaries.length > 0) return configured.has(primary);
    return configured.has(rootCategory);
  });
}

// IDs, not display names, are the source of truth. This store intentionally lasts one visit only.
export function createResourceTagStore() {
  let publicGroups = clone(INITIAL_PUBLIC_TAG_GROUPS);
  const personal = new Map<string, ReturnType<typeof personalExamples>>();
  const links = new Map<string, Links>();
  const originals = new Map<string, TaggedResource>();
  const listeners = new Set<() => void>();
  let owner = "chaojiguanliyuan";
  let revision = 0;
  const emit = () => { revision++; listeners.forEach((listener) => listener()); };
  const profile = (user = owner) => {
    if (!personal.has(user)) personal.set(user, personalExamples());
    return personal.get(user)!;
  };
  const entriesFrom = (groups: { id: string; name: string; subTags: { id: string; name: string }[] }[]): TagEntry[] => {
    const names = groups.flatMap((group) => group.subTags.map((tag) => tag.name));
    return groups.flatMap((group) => group.subTags.map((tag) => ({
      ...tag, groupId: group.id, groupName: group.name,
      label: names.filter((name) => name === tag.name).length > 1 ? `${group.name}: ${tag.name}` : tag.name,
    })));
  };
  const personalAsGroups = (value: ReturnType<typeof personalExamples>) => value.groups.map((group) => ({
    ...group, subTags: value.tags.filter((tag) => group.tagIds.includes(tag.id)),
  }));
  const entries = (kind: TagKind, user = owner) => entriesFrom(kind === "public" ? publicGroups : personalAsGroups(profile(user)));
  const seedEntries = (kind: TagKind) => entriesFrom(kind === "public" ? INITIAL_PUBLIC_TAG_GROUPS : personalAsGroups(initialPersonal));
  const toIds = (kind: TagKind, labels: string[], source = entries(kind)) => Array.from(new Set(labels.flatMap((label) => {
    const match = source.find((entry) => entry.label === label || entry.id === label || `${entry.groupName}: ${entry.name}` === label);
    return match ? [match.id] : [];
  })));
  const labels = (kind: TagKind, ids: string[], user = owner) => ids.flatMap((id) => {
    const tag = entries(kind, user).find((entry) => entry.id === id);
    return tag ? [tag.label] : [];
  });
  const key = (scope: string, id: string) => `${scope}:${id}`;
  const seedIds = (kind: TagKind, resource: TaggedResource) => toIds(kind, kind === "public"
    ? resource.publicTags || resource.tags || []
    : resource.personalTags || (resource.personalTag ? [resource.personalTag] : []), seedEntries(kind));
  const getIds = (scope: string, resource: TaggedResource, kind: TagKind, user = owner) => {
    const stored = links.get(key(scope, resource.id));
    return (kind === "public" ? stored?.public : stored?.personal[user]) ?? seedIds(kind, originals.get(key(scope, resource.id)) || resource);
  };
  const project = <T extends TaggedResource>(scope: string, resource: T, user = owner) => {
    const publicTags = labels("public", getIds(scope, resource, "public", user), user);
    const personalTags = labels("personal", getIds(scope, resource, "personal", user), user);
    return { ...resource, tags: publicTags, publicTags, personalTags, personalTag: personalTags[0] || "无个人标签" };
  };
  const prune = (kind: TagKind, user = owner) => {
    const valid = new Set(entries(kind, user).map((tag) => tag.id));
    for (const value of links.values()) {
      if (kind === "public" && value.public) value.public = value.public.filter((id) => valid.has(id));
      if (kind === "personal" && value.personal[user]) value.personal[user] = value.personal[user].filter((id) => valid.has(id));
    }
  };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => revision,
    getOwner: () => owner,
    setOwner(user: string) { if (owner !== user) { owner = user; emit(); } },
    getPublicGroups: () => publicGroups,
    setPublicGroups(update: Update<PublicTagGroup[]>) {
      publicGroups = typeof update === "function" ? update(publicGroups) : update;
      prune("public"); emit();
    },
    getPersonalGroups: () => profile().groups,
    getPersonalTags() {
      return profile().tags.map((tag) => ({ ...tag, resourceIds: [...originals].filter(([resourceKey, resource]) => {
        const scope = resourceKey.slice(0, resourceKey.indexOf(":"));
        return getIds(scope, resource, "personal").includes(tag.id);
      }).map(([resourceKey]) => resourceKey) }));
    },
    setPersonalTags(tags: PersonalTag[]) { profile().tags = tags; prune("personal"); emit(); },
    setPersonalGroups(groups: PersonalTagGroup[]) {
      profile().groups = groups;
      const valid = new Set(groups.flatMap((group) => group.tagIds));
      profile().tags = profile().tags.filter((tag) => valid.has(tag.id));
      prune("personal"); emit();
    },
    entries, toIds, labels, project, getIds,
    register(scope: string, resources: TaggedResource[]) {
      let changed = false;
      for (const resource of resources) {
        const resourceKey = key(scope, resource.id);
        if (!originals.has(resourceKey)) { originals.set(resourceKey, resource); changed = true; }
      }
      if (changed) emit();
    },
    assign(scope: string, resource: TaggedResource, kind: TagKind, selected: string[], user = owner) {
      const resourceKey = key(scope, resource.id);
      if (!originals.has(resourceKey)) originals.set(resourceKey, resource);
      const value = links.get(resourceKey) || { personal: {} };
      const ids = toIds(kind, selected, entries(kind, user));
      if (kind === "public") value.public = ids;
      else value.personal[user] = ids;
      links.set(resourceKey, value); emit();
    },
    removeResource(scope: string, id: string) { originals.delete(key(scope, id)); links.delete(key(scope, id)); emit(); },
  };
}
export const resourceTagStore = createResourceTagStore();
