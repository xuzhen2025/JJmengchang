import { EnhanceFrameRate, EnhanceResolution } from "../types";

export type ResolvedEnhanceResolution = Exclude<EnhanceResolution, "auto">;

const RESOLUTION_ORDER: ResolvedEnhanceResolution[] = ["1080p", "2k", "4k"];
const RESOLUTION_CREDITS: Record<ResolvedEnhanceResolution, number> = {
  "1080p": 10,
  "2k": 20,
  "4k": 40,
};

export const ENHANCE_MAX_FILE_SIZE_MB = 1000;

export const parseDurationSeconds = (value: string | undefined, fallback = 15) => {
  if (!value || value === "--:--") return fallback;
  const parts = value.split(":").map(Number);
  if (parts.length >= 2 && parts.length <= 3 && parts.every((part) => Number.isFinite(part) && part >= 0)) {
    return parts.reduce((total, part) => total * 60 + part, 0);
  }
  const seconds = Number.parseFloat(value);
  return Number.isFinite(seconds) ? seconds : fallback;
};

export const getMinimumEnhanceResolution = (sourceResolution: string): ResolvedEnhanceResolution => {
  const dimensions = sourceResolution.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (dimensions) {
    const longEdge = Math.max(Number(dimensions[1]), Number(dimensions[2]));
    const shortEdge = Math.min(Number(dimensions[1]), Number(dimensions[2]));
    if (longEdge > 2560 || shortEdge > 1440) return "4k";
    if (longEdge > 1920 || shortEdge > 1080) return "2k";
    return "1080p";
  }

  const normalized = sourceResolution.toLowerCase();
  if (normalized.includes("4k") || normalized.includes("2160")) return "4k";
  if (normalized.includes("2k") || normalized.includes("1440")) return "2k";
  return "1080p";
};

export const getAvailableEnhanceResolutions = (sourceResolution: string) => {
  const minimum = getMinimumEnhanceResolution(sourceResolution);
  return RESOLUTION_ORDER.filter((resolution) => RESOLUTION_ORDER.indexOf(resolution) >= RESOLUTION_ORDER.indexOf(minimum));
};

export const resolveEnhanceResolution = (
  requested: EnhanceResolution,
  sourceResolution: string,
): ResolvedEnhanceResolution => {
  const available = getAvailableEnhanceResolutions(sourceResolution);
  if (requested === "auto" || !available.includes(requested)) return available[0];
  return requested;
};

export const calculateEnhanceCredits = (
  durationSeconds: number,
  resolution: ResolvedEnhanceResolution,
  frameRate: EnhanceFrameRate,
) => {
  const billingMinutes = Math.max(1, Math.ceil(Math.max(0, durationSeconds) / 60));
  const perMinute = RESOLUTION_CREDITS[resolution] + (frameRate === "60" ? 10 : 0);
  return { billingMinutes, perMinute, total: billingMinutes * perMinute };
};

export const getEnhanceResolutionLabel = (resolution: ResolvedEnhanceResolution) => resolution === "1080p" ? "1080P" : resolution.toUpperCase();

export const getEnhanceOutputDimensions = (resolution: ResolvedEnhanceResolution) => ({
  "1080p": "1920 x 1080",
  "2k": "2560 x 1440",
  "4k": "3840 x 2160",
})[resolution];

export const buildEnhanceOutputName = (sourceName: string, resolution: ResolvedEnhanceResolution, fps: number) => {
  const baseName = sourceName.replace(/\.[^.]+$/, "");
  return `${baseName}_画质增强_${getEnhanceResolutionLabel(resolution)}_${fps}FPS.mp4`;
};
