import { useEffect, useState } from "react";
import { resourceTagStore, TaggedResource } from "./resourceTags";
import { ConfigurableResource, resourceConfigStore } from "./resourceConfig";

const RESOURCE_EDITS_EVENT = "mengchang-resource-edits-change";
function readEdits<T extends object>(scope: string, preserveLegacyTags = false): Record<string, Partial<T>> {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(`mengchang-resource-edits-v1-${scope}`) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    if (!preserveLegacyTags) for (const patch of Object.values(value) as Record<string, unknown>[]) {
      delete patch.tags; delete patch.publicTags; delete patch.personalTags; delete patch.personalTag;
      delete patch.category; delete patch.primaryCategory; delete patch.secondaryCategory;
      if (["finished", "materials", "thirdParty", "scripts"].includes(scope)) delete patch.status;
    }
    return value;
  } catch { return {}; }
}

export function saveResourceEdits<T extends object>(scope: string, updates: Record<string, Partial<T>>): boolean {
  const next = readEdits<T>(scope);
  try {
    for (const [id, patch] of Object.entries(updates)) resourceConfigStore.validateAssignment(scope, { id }, patch as Partial<ConfigurableResource>);
  } catch { return false; }
  for (const [id, patch] of Object.entries(updates)) {
    const metadata = { ...patch } as Partial<T> & Partial<TaggedResource>;
    delete metadata.tags; delete metadata.publicTags; delete metadata.personalTags; delete metadata.personalTag;
    delete (metadata as ConfigurableResource).category;
    delete (metadata as ConfigurableResource).primaryCategory;
    delete (metadata as ConfigurableResource).secondaryCategory;
    if (["finished", "materials", "thirdParty", "scripts"].includes(scope)) delete (metadata as ConfigurableResource).status;
    next[id] = { ...next[id], ...metadata };
  }
  try {
    window.sessionStorage.setItem(`mengchang-resource-edits-v1-${scope}`, JSON.stringify(next));
    for (const [id, patch] of Object.entries(updates)) {
      const configPatch = patch as Partial<ConfigurableResource>;
      if (configPatch.category !== undefined || configPatch.primaryCategory !== undefined || (["finished", "materials", "thirdParty", "scripts"].includes(scope) && configPatch.status !== undefined)) {
        resourceConfigStore.assign(scope, { id }, configPatch);
      }
      const value = patch as Partial<TaggedResource>;
      if (value.publicTags || value.tags) resourceTagStore.assign(scope, { id }, "public", value.publicTags || value.tags || []);
      if (value.personalTags || value.personalTag !== undefined) resourceTagStore.assign(scope, { id }, "personal", value.personalTags || (value.personalTag ? [value.personalTag] : []));
      if ((patch as { deleted?: boolean }).deleted) { resourceTagStore.removeResource(scope, id); resourceConfigStore.removeResource(scope, id); }
    }
    window.dispatchEvent(new CustomEvent(RESOURCE_EDITS_EVENT, { detail: scope }));
    return true;
  } catch { return false; }
}

// Keep prototype edits across resource tabs without persisting media files.
export function useResourceEdits<T extends object>(scope: string) {
  const [edits, setEdits] = useState<Record<string, Partial<T>>>(() => readEdits<T>(scope));
  useEffect(() => {
    const refresh = (event: Event) => { if ((event as CustomEvent).detail === scope) setEdits(readEdits<T>(scope)); };
    window.addEventListener(RESOURCE_EDITS_EVENT, refresh);
    return () => window.removeEventListener(RESOURCE_EDITS_EVENT, refresh);
  }, [scope]);
  const saveEdits = (updates: Record<string, Partial<T>>) => {
    return saveResourceEdits<T>(scope, updates);
  };
  return { edits, saveEdits };
}
