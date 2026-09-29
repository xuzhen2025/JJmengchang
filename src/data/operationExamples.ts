import { INITIAL_FINISHED } from "./finishedVideos";
import type { AdVideo } from "../lib/adPush";

export const OPERATION_EXAMPLE_VIDEOS: AdVideo[] = ["fv-analytics-1", "fv-analytics-4", "fv-analytics-3", "fv18", "fv14", "fv17"].map(id => {
  const video = INITIAL_FINISHED.find(item => item.id === id)!;
  return { id: video.id, title: video.title, videoUrl: video.videoUrl, coverUrl: video.coverUrl, author: video.author };
});

export function operationExampleTime(index: number, now = Date.now()) {
  const start = new Date(now).setHours(0, 0, 0, 0);
  return Math.max(start, now - (index + 1) * 60000);
}
