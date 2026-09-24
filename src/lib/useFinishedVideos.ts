import { useMemo } from "react";
import { useTaggedResources } from "./useResourceTags";
import { Asset } from "../types";
import { FinishedVideo, INITIAL_FINISHED } from "../data/finishedVideos";
import { DEFAULT_ASSOCIATED_SCRIPTS, DEFAULT_RELATED_VIDEOS } from "../data/videoResourceOptions";
import { toPublishedVideo } from "./publishedVideo";
import { useResourceEdits } from "./useResourceEdits";
import { useUploadedResources } from "./resourceUploads";

type FinishedVideoEdit = FinishedVideo & { deleted?: boolean };

export function useFinishedVideos(uploadedVideos: Asset[]) {
  const uploaded = useUploadedResources();
  const { edits, saveEdits } = useResourceEdits<FinishedVideoEdit>("finished");
  const baseVideos = useMemo(() => {
      const uniqueVideos = new Map<string, FinishedVideo>();
    for (const video of [...uploaded.filter((item) => item.resourceCategory === "成片").map(toPublishedVideo), ...uploadedVideos.map(toPublishedVideo), ...INITIAL_FINISHED]) {
        if (!uniqueVideos.has(video.id)) uniqueVideos.set(video.id, video);
      }
      return [...uniqueVideos.values()]
        .filter((video) => !edits[video.id]?.deleted)
        .map((video) => ({
          ...video,
          pushCount: video.pushCount ?? video.syncedAccounts?.length ?? 0,
          referenceCount: video.referenceCount ?? video.secondaryCount ?? video.cuts ?? 0,
          associatedScripts: DEFAULT_ASSOCIATED_SCRIPTS,
          relatedVideos: DEFAULT_RELATED_VIDEOS,
          ...edits[video.id],
        }));
  }, [uploadedVideos, uploaded, edits]);
  const videos = useTaggedResources("finished", baseVideos);
  return { videos, saveEdits };
}
