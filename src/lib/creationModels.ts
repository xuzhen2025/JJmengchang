// Prototype examples; production capabilities come from the selected provider.
export const QUICK_CREATION_MODEL_OPTIONS = [
  { name: "星绘 Pro", desc: "高质图片，适合商品视觉", imageCost: 8, videoCost: 36, maxSeconds: 8 },
  { name: "云镜 Max", desc: "高质视频，最长支持30秒", imageCost: 12, videoCost: 60, maxSeconds: 30 },
  { name: "灵感 Lite", desc: "快速出稿，节省积分", imageCost: 5, videoCost: 24, maxSeconds: 6 },
] as const;
