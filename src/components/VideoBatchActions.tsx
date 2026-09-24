import React, { useEffect, useRef, useState } from "react";
import { operationUser, recordDownload } from "../lib/operationHistory";
import { Download, LoaderCircle } from "lucide-react";
import ResourceActionMenu from "./ResourceActionMenu";
import ResourceTagModal from "./ResourceTagModal";
import { ResourceCategoryModal, ResourceEditDialog, VideoStatusSelect } from "./ResourceEditDialog";
import LinkScriptModal from "./LinkScriptModal";
import VideoResourcePickerModal, { VideoResourcePickerItem } from "./VideoResourcePickerModal";
import { RELATED_VIDEO_OPTIONS } from "../data/videoResourceOptions";
import { downloadResourceFiles, toRelatedVideo } from "../lib/resourceBatch";
import type { DownloadResource, VideoBatchChange, VideoResourceMetadata } from "../lib/resourceBatch";
import { useResourceConfig } from "../lib/useResourceConfig";

interface BatchVideo extends DownloadResource, VideoResourceMetadata {
  coverUrl: string; duration: string; size: string; author: string;
}

export default function VideoBatchActions({ videos, selectedIds, isMaterialMode = false, resourceScope = isMaterialMode ? "materials" : "finished", onApply, showToast }: {
  videos: BatchVideo[];
  selectedIds: string[];
  isMaterialMode?: boolean;
  resourceScope?: "finished" | "materials" | "thirdParty";
  onApply: (ids: string[], change: VideoBatchChange) => boolean;
  showToast: (message: string) => void;
}) {
  const [action, setAction] = useState("");
  const { store } = useResourceConfig();
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const downloadController = useRef<AbortController | null>(null);
  useEffect(() => () => downloadController.current?.abort(), []);
  const resourceName = resourceScope === "thirdParty" ? "第三方" : isMaterialMode ? "素材" : "成片";
  const close = () => setAction("");
  const start = (option: string) => {
    const ids = selectedIds.filter(id => videos.some(video => video.id === id));
    if (!ids.length) { showToast(`请先勾选需要操作的${resourceName}`); return; }
    setTargetIds(ids);
    setStatus("");
    setAction(option);
  };
  const apply = (change: VideoBatchChange) => {
    if (!onApply(targetIds, change)) return false;
    showToast(`已为 ${targetIds.length} 个${resourceName}${action.replace(/^批量/, "")}`);
    close();
    return true;
  };
  const download = async () => {
    const records = videos.filter(video => selectedIds.includes(video.id));
    if (!records.length) { showToast(`请先勾选需要下载的${resourceName}`); return; }
    setDownloading(true);
    const ownerId = operationUser();
    const controller = new AbortController();
    downloadController.current = controller;
    const result = await downloadResourceFiles(records, (blob, name) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = /\.[a-z0-9]+$/i.test(name) ? name : `${name}.mp4`;
      document.body.appendChild(link);
      link.click();
      recordDownload(link.download, resourceName, true, ownerId);
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, controller.signal);
    if (controller.signal.aborted) return;
    setDownloading(false);
    if (result.failed.length) {
      result.failed.forEach(id => { const record = records.find(r => r.id === id); if (record) recordDownload(record.title, resourceName, false, ownerId); });
      showToast(`已提交 ${result.succeeded.length} 个文件下载，${result.failed.length} 个文件获取失败，请检查源文件或网络后重新下载`);
    } else {
      showToast(`已提交 ${result.succeeded.length} 个文件下载`);
    }
  };
  const pickerVideos: VideoResourcePickerItem[] = [
    ...videos.map((video): VideoResourcePickerItem => ({
      id: video.id, name: video.title, cover: video.coverUrl, status: video.status || "待审核",
      section: resourceName,
      primaryCategory: video.category?.split(" / ")[0] || "未分类",
      secondaryCategory: video.category?.split(" / ")[1] || "未分类",
      tags: video.tags || [], author: video.author, duration: video.duration, size: video.size, url: video.videoUrl,
    })),
    ...RELATED_VIDEO_OPTIONS,
  ].filter(video => !targetIds.includes(video.id));

  return <>
    <button disabled={downloading} onClick={download}
      className="border border-slate-200 bg-white text-slate-700 px-2.5 py-1.5 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs disabled:opacity-50">
      {downloading ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      {downloading ? "下载中" : "下载"}
    </button>
    <ResourceActionMenu label="修改" disabled={downloading} options={[...(store.statusEnabled(resourceScope) ? ["修改状态"] : []), "修改分类", "批量关联脚本", "批量关联视频"]} onSelect={start} />
    <ResourceActionMenu label="添加标签" disabled={downloading} options={["添加公共标签", "添加个人标签"]} onSelect={start} />
    {(action === "添加公共标签" || action === "添加个人标签") && <ResourceTagModal
      kind={action === "添加公共标签" ? "public" : "personal"} title={action} requireSelection
      onClose={close} onConfirm={tags => apply({ kind: action === "添加公共标签" ? "publicTags" : "personalTags", tags })} showToast={showToast} />}
    {action === "修改分类" && <ResourceCategoryModal scope={resourceScope} onClose={close} onConfirm={value => apply({ kind: "category", value })} />}
    {action === "修改状态" && <ResourceEditDialog title={action} onClose={close} disabled={!status} onConfirm={() => apply({ kind: "status", value: status })}>
      <div className="flex items-center gap-4"><span className="text-xs font-bold text-slate-700">视频状态</span>
        <VideoStatusSelect value={status} onChange={setStatus} scope={resourceScope} placeholder />
      </div>
    </ResourceEditDialog>}
    {action === "批量关联脚本" && <LinkScriptModal isOpen title="关联脚本" initialSelectedIds={[]} onClose={close}
      onConfirm={selected => {
        const scripts = (Array.isArray(selected) ? selected : [selected]).map(script => ({
          id: script.id, title: script.title, template: script.template || "通用模板", tag: script.tags?.[0] || "",
          status: script.status || "待审核", publisher: script.publisher || "", publishTime: script.publishTime || "",
        }));
        return scripts.length > 0 && apply({ kind: "scripts", scripts });
      }} />}
    {action === "批量关联视频" && <VideoResourcePickerModal items={pickerVideos} initialSelectedIds={[]}
      initialSection={resourceName} onClose={close}
      onConfirm={items => {
        if (!items.length) { showToast("请至少选择一个视频"); return; }
        apply({ kind: "videos", videos: items.map(toRelatedVideo) });
      }} />}
  </>;
}
