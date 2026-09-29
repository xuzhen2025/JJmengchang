export interface AdMediaProbe {
  format: string; bytes: number; width: number; height: number;
  cover?: { format: string; bytes: number; width: number; height: number };
}

// Validate probed output files, never infer dimensions or size from a filename.
export function validateAdMedia(media: AdMediaProbe, needsCover: boolean): string {
  if (![media.width, media.height, media.bytes].every(value => Number.isFinite(value) && value > 0)) return "视频文件信息不完整，请重新检测文件";
  if (!["mp4", "mpeg", "3gp", "avi"].includes(media.format.toLowerCase())) return "视频格式不支持，请转码为mp4后重新发起";
  const ratio = media.width / media.height, vertical = Math.abs(ratio - 9 / 16) <= 0.005, horizontal = Math.abs(ratio - 16 / 9) <= 0.005;
  if (!vertical && !horizontal) return "视频比例须为9:16或16:9，请处理成片后重新发起";
  if (media.bytes > (vertical ? 100 : 1000) * 1024 * 1024) return `视频超过${vertical ? 100 : 1000}MB，请转码压缩后重新发起`;
  if (!needsCover) return "";
  const cover = media.cover;
  if (!cover) return "封面尚未生成，不能创建或追加计划";
  if (!["jpg", "jpeg", "png", "bmp"].includes(cover.format.toLowerCase()) || !(cover.bytes > 0 && cover.bytes <= 1.5 * 1024 * 1024)) return "封面须为jpg、jpeg、png或bmp，且不超过1.5MB";
  const [minW, minH, maxW, maxH] = vertical ? [720, 1280, 1440, 2560] : [1280, 720, 2560, 1440];
  if (![cover.width, cover.height].every(Number.isFinite) || Math.abs(cover.width / cover.height - (vertical ? 9 / 16 : 16 / 9)) > 0.005 || cover.width < minW || cover.height < minH || cover.width > maxW || cover.height > maxH) return `封面比例须与视频一致，尺寸范围${minW}x${minH}至${maxW}x${maxH}`;
  return "";
}
