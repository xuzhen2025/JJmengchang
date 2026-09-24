import React, { useMemo } from "react";
import type { AiVideoMediaItem, Asset } from "../types";
import ImageResourcePickerModal, { ImageResourcePickerItem } from "./ImageResourcePickerModal";
import VideoResourcePickerModal, { VideoResourcePickerItem } from "./VideoResourcePickerModal";
import { parseDurationSeconds } from "../lib/videoEnhance";

interface Props {
  assets: Asset[];
  allowed: "image" | "video" | "both";
  selected: AiVideoMediaItem | null;
  onClose: () => void;
  onConfirm: (item: AiVideoMediaItem) => void;
}

export default function AiVideoSceneMediaPicker({ assets, allowed, selected, onClose, onConfirm }: Props) {
  const images = useMemo<ImageResourcePickerItem[]>(() => {
    const items = assets.filter((asset) => !asset.deletedAt && asset.type === "image").map((asset) => ({
      id: asset.id, name: asset.name, url: asset.url,
      status: asset.status || "可用", primaryCategory: asset.category || "未分类",
      secondaryCategory: asset.publicTags?.[0] || "通用", tags: asset.publicTags || [],
      author: asset.creator || "徐振", resolution: asset.fileInfo?.resolution || "--", size: asset.size,
    }));
    if (selected?.type === "image" && !items.some((item) => item.id === selected.id)) {
      items.push({ id: selected.id, name: selected.name, url: selected.url, status: "可用", primaryCategory: "未分类", secondaryCategory: "通用", tags: [], author: "徐振", resolution: "--", size: "--" });
    }
    return items;
  }, [assets, selected]);
  const videos = useMemo<VideoResourcePickerItem[]>(() => {
    const items: VideoResourcePickerItem[] = assets.filter((asset) => !asset.deletedAt && asset.type === "video").map((asset) => ({
      id: asset.id, name: asset.name, url: asset.url, cover: asset.coverUrl || "",
      status: asset.status || "可用", section: asset.resourceCategory === "成片" ? "成片" : "素材",
      primaryCategory: asset.category || "未分类", secondaryCategory: asset.publicTags?.[0] || "通用",
      tags: asset.publicTags || [], author: asset.creator || "徐振", duration: asset.fileInfo?.duration || "--:--", size: asset.size,
    }));
    if (selected?.type === "video" && !items.some((item) => item.id === selected.id)) {
      items.push({ id: selected.id, name: selected.name, url: selected.url, cover: selected.coverUrl || "", status: "可用", section: "素材", primaryCategory: "未分类", secondaryCategory: "通用", tags: [], author: "徐振", duration: String(selected.durationSeconds || 0), size: "--" });
    }
    return items;
  }, [assets, selected]);
  const selectedIds = selected ? [selected.id] : [];
  if (allowed === "image") return <ImageResourcePickerModal
    items={images} initialSelectedIds={selectedIds} multiple={false} maxSelections={1}
    onClose={onClose} onConfirm={(items) => {
      const item = items[0];
      if (item) onConfirm({ id: item.id, name: item.name, url: item.url, type: "image", source: item.source || (item.url.startsWith("blob:") ? "local" : "library") });
    }}
  />;
  return <VideoResourcePickerModal
    items={videos} initialSelectedIds={selectedIds}
    initialSection={selected?.type === "image" ? "图片" : videos.find((item) => item.id === selected?.id)?.section || "成片"}
    allowImageSelection={allowed === "both"}
    imageItems={allowed === "both" ? images.map((item) => ({ ...item, cover: item.url })) : []}
    allowLocalUpload maxSelections={1} onClose={onClose}
    onConfirm={(items) => {
      const item = items[0];
      if (!item?.url) return;
      const type = item.kind === "image" ? "image" : "video";
      onConfirm({ id: item.id, name: item.name, url: item.url, type, coverUrl: item.cover,
        durationSeconds: type === "video" ? parseDurationSeconds(item.duration, 0) : undefined,
        source: item.url.startsWith("blob:") ? "local" : "library" });
    }}
  />;
}
