import { useSyncExternalStore } from "react";
import { Asset } from "../types";
import { resourceTagStore } from "./resourceTags";
import { resourceConfigStore } from "./resourceConfig";
import { operationUser, recordOperation } from "./operationHistory";

export type UploadedResource = Asset & { primaryCategory: string; secondaryCategory: string; content?: string };
export interface ResourcePublishDetails {
  publicTags: string[];
  personalTags: string[];
  resources: UploadedResource[];
}
const listeners = new Set<() => void>();
let uploaded: UploadedResource[] = [];
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getUploadedResources = () => uploaded;
export const useUploadedResources = () => useSyncExternalStore(subscribe, getUploadedResources);
export function resourceScope(resource: Pick<Asset, "type" | "resourceCategory" | "libraryType">) {
  if (resource.resourceCategory) return { 成片: "finished", 素材: "materials", 第三方: "thirdParty", 脚本: "scripts", 图片: "images", 音频: "audio" }[resource.resourceCategory];
  if (resource.type === "image") return "images";
  if (resource.type === "audio") return "audio";
  if (resource.type === "document") return "scripts";
  return resource.libraryType === "finished" ? "finished" : "materials";
}
export function publishResources(input: {
  ownerId?: string;
  partition: NonNullable<Asset["resourceCategory"]>;
  primaryCategory: string;
  secondaryCategory: string;
  publicTags: string[];
  personalTags: string[];
  files: { name: string; url: string; size?: number; coverUrl?: string }[];
  content?: string;
}): ResourcePublishDetails {
  const scope = { 成片: "finished", 素材: "materials", 第三方: "thirdParty", 脚本: "scripts", 图片: "images", 音频: "audio" }[input.partition];
  if (!resourceConfigStore.categoryValid(scope, input.primaryCategory, input.secondaryCategory)) throw new Error("请选择当前可用的一级分类和二级分类");
  const type: Asset["type"] = input.partition === "图片" ? "image" : input.partition === "音频" ? "audio" : input.partition === "脚本" ? "document" : "video";
  const resources: UploadedResource[] = input.files.map((file) => ({
    id: `resource-upload-${crypto.randomUUID()}`, name: file.name, type, url: file.url,
    coverUrl: file.coverUrl || (type === "image" ? file.url : undefined),
    size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "待解析",
    createdAt: new Date().toLocaleString("sv-SE"), creator: "徐振", source: "resource_library",
    resourceCategory: input.partition, category: [input.primaryCategory, input.secondaryCategory].filter(Boolean).join(" / "),
    primaryCategory: input.primaryCategory, secondaryCategory: input.secondaryCategory, status: resourceConfigStore.defaultStatus(scope) || "待审核",
    publicTags: input.publicTags, personalTags: input.personalTags, content: input.content,
  }));
  for (const resource of resources) {
    resourceConfigStore.register(resourceScope(resource), [resource]);
    resourceTagStore.register(resourceScope(resource), [resource]);
    resourceTagStore.assign(resourceScope(resource), resource, "public", input.publicTags);
    resourceTagStore.assign(resourceScope(resource), resource, "personal", input.personalTags);
  }
  uploaded = [...resources, ...uploaded];
  const ownerId = input.ownerId ?? operationUser();
  resources.forEach(resource => recordOperation({ ownerId, kind: "upload", name: resource.name, type: input.partition, status: "成功", resourceId: resource.id, size: resource.size, message: resource.category || "文件已入库" }));
  listeners.forEach((listener) => listener());
  return { publicTags: input.publicTags, personalTags: input.personalTags, resources };
}

export function uploadedImage(resource: UploadedResource) {
  return { ...resource, title: resource.name, subtitle: resource.secondaryCategory, imageUrl: resource.url,
    badge: "图片", downloads: 0, filesCount: 1, author: resource.creator || "徐振", time: resource.createdAt,
    resolution: "待解析", publicTags: resource.publicTags || [], personalTag: resource.personalTags?.[0] || "无个人标签" };
}
export function uploadedAudio(resource: UploadedResource) {
  return { ...resource, title: resource.name, subtitle: resource.secondaryCategory, badge: "音频", downloads: 0,
    author: resource.creator || "徐振", time: resource.createdAt, duration: 0, durationFormatted: "待解析",
    publicTags: resource.publicTags || [], personalTag: resource.personalTags?.[0] || "无个人标签" };
}
export function uploadedScript(resource: UploadedResource) {
  return { ...resource, title: resource.name, author: resource.creator || "徐振", content: resource.content || "",
    status: resource.status || resourceConfigStore.defaultStatus("scripts"), categoryTag: resource.primaryCategory, classTag: resource.category || resource.secondaryCategory,
    descTag: "", tasksCount: 0, scenesCount: 0, tasks: [] };
}
