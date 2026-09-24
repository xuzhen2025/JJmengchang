import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { resourceTagStore, TaggedResource, TagKind } from "./resourceTags";
import { resourceConfigStore } from "./resourceConfig";
import { useResourceConfig } from "./useResourceConfig";

export function useTagCatalog() {
  const revision = useSyncExternalStore(resourceTagStore.subscribe, resourceTagStore.getSnapshot);
  return useMemo(() => {
    const dictionary = (kind: TagKind): Record<string, string[]> => Object.fromEntries((kind === "public"
      ? resourceTagStore.getPublicGroups() : resourceTagStore.getPersonalGroups()).map((group) => [
      group.name, resourceTagStore.entries(kind).filter((tag) => tag.groupId === group.id).map((tag) => tag.label),
    ]));
    return { revision, publicGroups: dictionary("public"), personalGroups: dictionary("personal"),
      publicTagGroups: resourceTagStore.getPublicGroups(), personalTagGroups: resourceTagStore.getPersonalGroups(),
      personalTags: resourceTagStore.getPersonalTags() };
  }, [revision]);
}

export function useTaggedResources<T extends TaggedResource>(scope: string, resources: T[]) {
  const { revision } = useTagCatalog();
  const { revision: configRevision } = useResourceConfig();
  useEffect(() => { resourceTagStore.register(scope, resources); resourceConfigStore.register(scope, resources); }, [scope, resources]);
  return useMemo(() => resources.map((resource) => resourceConfigStore.project(scope, resourceTagStore.project(scope, resource))), [revision, configRevision, scope, resources]);
}

export function useScopedTaggedResources<T extends TaggedResource>(resources: T[], scopeOf: (resource: T) => string) {
  const { revision } = useTagCatalog();
  const { revision: configRevision } = useResourceConfig();
  useEffect(() => {
    for (const resource of resources) { resourceTagStore.register(scopeOf(resource), [resource]); resourceConfigStore.register(scopeOf(resource), [resource]); }
  }, [resources, scopeOf]);
  return useMemo(() => resources.map((resource) => resourceConfigStore.project(scopeOf(resource), resourceTagStore.project(scopeOf(resource), resource))), [revision, configRevision, resources, scopeOf]);
}

export function useResourceTagState(scope: string, resource: TaggedResource, kind: TagKind) {
  useTagCatalog();
  useEffect(() => { resourceTagStore.register(scope, [resource]); }, [scope, resource.id]);
  const value = resourceTagStore.project(scope, resource)[kind === "public" ? "publicTags" : "personalTags"];
  const setValue = (next: string[] | ((previous: string[]) => string[])) => {
    resourceTagStore.assign(scope, resource, kind, typeof next === "function" ? next(value) : next);
  };
  return [value, setValue] as const;
}

// Drafts retain IDs too, so renaming or deleting a tag while a selector is open stays coherent.
export function useTagSelection(kind: TagKind, initial: string[] = []) {
  useTagCatalog();
  const [ids, setIds] = useState(() => resourceTagStore.toIds(kind, initial));
  const value = resourceTagStore.labels(kind, ids);
  const setValue = (next: string[] | ((previous: string[]) => string[])) => {
    setIds((previous) => resourceTagStore.toIds(kind, typeof next === "function" ? next(resourceTagStore.labels(kind, previous)) : next));
  };
  return [value, setValue] as const;
}

export function useTagGroupSelection(groups: Record<string, string[]>) {
  const [selected, setSelected] = useState(() => Object.keys(groups)[0] || "");
  return [Object.hasOwn(groups, selected) ? selected : Object.keys(groups)[0] || "", setSelected] as const;
}

export function useTagFilterSync(kind: TagKind, selected: string, onChange: (value: string) => void) {
  const { revision } = useTagCatalog();
  const previous = useRef(resourceTagStore.entries(kind));
  useEffect(() => {
    const old = previous.current.find((tag) => tag.label === selected);
    const current = resourceTagStore.entries(kind);
    previous.current = current;
    if (old) {
      const next = current.find((tag) => tag.id === old.id)?.label || "全部";
      if (next !== selected) onChange(next);
    }
  }, [revision, kind, selected, onChange]);
}
