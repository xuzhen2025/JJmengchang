import React, { useMemo, useState } from "react";
import { Asset } from "../types";
import ImageResourcePickerModal, { ImageResourcePickerItem } from "./ImageResourcePickerModal";
import VideoResourcePickerModal, { VideoResourcePickerItem } from "./VideoResourcePickerModal";
import MediaTypeChoiceModal from "./MediaTypeChoiceModal";

export type QuickCreationMedia = { url: string; type: "image" | "video"; name: string };

interface QuickCreationMediaPickerProps {
  assets: Asset[];
  allowed: "image" | "video" | "both";
  source: "local" | "library";
  maxImages: number;
  onClose: () => void;
  onConfirm: (media: QuickCreationMedia[]) => void;
}

export default function QuickCreationMediaPicker({ assets, allowed, source, maxImages, onClose, onConfirm }: QuickCreationMediaPickerProps) {
  const [type, setType] = useState<"image" | "video" | null>(allowed === "both" ? "video" : allowed);
  const imagePickerItems = useMemo<ImageResourcePickerItem[]>(() => assets.filter(asset => asset.type === "image" && !asset.deletedAt).map(asset => ({
    id: asset.id, name: asset.name, url: asset.url, status: asset.status || "可用",
    primaryCategory: asset.category || "未分类", secondaryCategory: asset.publicTags?.[0] || "通用",
    tags: asset.publicTags || [], author: asset.creator || "徐振", resolution: asset.fileInfo?.resolution || "--", size: asset.size,
  })), [assets]);
  const videoItems = useMemo<VideoResourcePickerItem[]>(() => assets.filter(asset => asset.type === "video" && !asset.deletedAt).map(asset => ({
    id: asset.id, name: asset.name, url: asset.url, cover: asset.coverUrl || "./assets/prototype/beauty-promo-detail.jpg", status: asset.status || "可用",
    section: asset.resourceCategory === "成片" ? "成片" : "素材", primaryCategory: asset.category || "未分类", secondaryCategory: asset.publicTags?.[0] || "通用",
    tags: asset.publicTags || [], author: asset.creator || "徐振", duration: asset.fileInfo?.duration || "--:--", size: asset.size,
  })), [assets]);
  if (!type) return <MediaTypeChoiceModal title="选择素材类型" onClose={onClose} onSelect={setType} />;
  if (type === "image") return <ImageResourcePickerModal items={imagePickerItems} initialSelectedIds={[]} initialSourceTab={source} multiple={maxImages > 1} maxSelections={maxImages} onClose={onClose} onConfirm={items => onConfirm(items.map(item => ({ url: item.url, type: "image", name: item.name })))} />;
  const videoImageItems = imagePickerItems.map((item) => ({ ...item, cover: item.url, resolution: item.resolution }));
  return <VideoResourcePickerModal items={videoItems} imageItems={allowed === "both" ? videoImageItems : []} allowImageSelection={allowed === "both"} initialSelectedIds={[]} initialSourceTab={source} allowLocalUpload showAllSection maxSelections={allowed === "both" ? maxImages : 1} onClose={onClose} onConfirm={items => onConfirm(items.flatMap(item => item.url ? [{ url: item.url, type: item.kind === "image" ? "image" as const : "video" as const, name: item.name }] : []))} />;
}
