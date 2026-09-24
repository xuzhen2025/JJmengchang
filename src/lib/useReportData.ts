import { useMemo } from "react";
import { useAdStore } from "./useAdStore";
import { useReportOrganization, organizationTree } from "./analyticsOrganization";
import { useTagCatalog } from "./useResourceTags";
import { useResourceConfig } from "./useResourceConfig";
import { resourceConfigStore } from "./resourceConfig";
import { createReportFacts } from "./reportDemoData";

export function useReportData() {
  const org = useReportOrganization();
  const store = useAdStore();
  const tags = useTagCatalog();
  const { revision } = useResourceConfig();
  const categories = useMemo(() => resourceConfigStore.categories("finished"), [revision]);
  const facts = useMemo(() => createReportFacts(store.accounts, org, tags.publicTagGroups, categories), [store.accounts, org, tags.publicTagGroups, categories]);
  return { org, store, facts, categories, tags: tags.publicTagGroups, tree: organizationTree(org) };
}
