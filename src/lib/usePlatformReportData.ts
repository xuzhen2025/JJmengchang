import { useMemo } from "react";
import { INITIAL_FINISHED as MATERIALS } from "../components/MaterialsView";
import { INITIAL_AUDIO_LIST } from "../components/AudioManagementView";
import { MOCK_IMAGES } from "../components/ImageManagementView";
import { INITIAL_SCRIPTS } from "../components/ScriptManagementView";
import { useTaskRecords } from "../components/TaskCollaborationView";
import { useFinishedVideos } from "./useFinishedVideos";
import { useUploadedResources, resourceScope } from "./resourceUploads";
import { useResourceEdits } from "./useResourceEdits";
import { useResourceConfig } from "./useResourceConfig";
import { resourceConfigStore } from "./resourceConfig";
import { useViralVideoRule } from "./useViralVideoRule";
import { isViralVideo } from "./viralVideoRule";
import { memberOrganization, useReportOrganization, organizationTree } from "./analyticsOrganization";
import { useAdStore } from "./useAdStore";
import { resourceActivities, type ResourceActivity } from "./reportPlatformData";
import type { PlatformResource } from "./platformAnalytics";
import type { Asset } from "../types";

const NO_UPLOADS: Asset[] = [];
export function usePlatformReportData() {
  const org = useReportOrganization();
  const { videos } = useFinishedVideos(NO_UPLOADS);
  const uploaded = useUploadedResources();
  const [tasks] = useTaskRecords();
  const materialEdits = useResourceEdits<Record<string, any>>("materials").edits;
  const audioEdits = useResourceEdits<Record<string, any>>("audio").edits;
  const imageEdits = useResourceEdits<Record<string, any>>("images").edits;
  const scriptEdits = useResourceEdits<Record<string, any>>("scripts").edits;
  const { revision } = useResourceConfig();
  const { rule, month } = useViralVideoRule();
  const adStore = useAdStore();
  const resources = useMemo(() => {
    const scopes: [string, any[], Record<string, any>][] = [["finished", videos, {}], ["materials", MATERIALS, materialEdits],
      ["audio", INITIAL_AUDIO_LIST, audioEdits], ["images", MOCK_IMAGES, imageEdits], ["scripts", INITIAL_SCRIPTS, scriptEdits]];
    return scopes.flatMap(([scope, seeds, edits]) => {
      const rows = [...(scope === "finished" ? [] : uploaded.filter(row => resourceScope(row) === scope)), ...seeds];
      return [...new Map(rows.map(row => [row.id, row])).values()].filter(row => !edits[row.id]?.deleted && !resourceConfigStore.isRemoved(scope, row.id)).map(raw => {
        const row: any = resourceConfigStore.project(scope, { ...raw, ...edits[raw.id] });
        const person = row.author || row.creator || "未关联员工";
        const downloads = Number(row.downloads) || 0, cuts = Number(row.cuts) || 0;
        return { id: `${scope}:${row.id}`, sourceId: row.id, scope, label: row.title || row.name,
          ...memberOrganization(org, person), person, date: String(row.createdAt || row.time || row.date || "").slice(0, 10),
          category: row.category || row.primaryCategory || "未设置分类", downloads, cuts,
          pushed: adStore.records.some(record => record.videoId === row.id && record.pushStatus === "推送成功"),
          used: downloads > 0 || cuts > 0, viral: scope === "finished" && isViralVideo(row, rule, month), status: row.status || "未设置状态" } satisfies PlatformResource;
      });
    });
  }, [videos, uploaded, org, materialEdits, audioEdits, imageEdits, scriptEdits, revision, rule, month, adStore.records]);
  const activities = useMemo(() => {
    const logs: ResourceActivity[] = resourceActivities(resources, org);
    for (const record of adStore.records) {
      const resource = resources.find(row => row.scope === "finished" && row.sourceId === record.videoId);
      if (resource && record.pushStatus === "推送成功") logs.push({ id: record.id, resourceId: resource.id, person: record.operator, date: record.createdAt.slice(0, 10), action: "push" });
    }
    return logs;
  }, [resources, org, adStore.records]);
  return { resources, activities, tasks, org, tree: organizationTree(org) };
}
