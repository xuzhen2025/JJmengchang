import type { VideoResourcePickerItem } from "../components/VideoResourcePickerModal";
import type { RelatedResourceVideo } from "../lib/resourceBatch";

export const CATEGORY_TREE = [
  { name: "彩妆香水", subs: ["唇膏口红", "香水底妆", "眼影彩盘", "卸妆洁面"] },
  { name: "宠物食品", subs: ["猫粮", "狗粮", "零食罐头", "宠物保健品"] },
  { name: "宠物用品", subs: ["猫砂猫盆", "宠物玩具", "牵引驱虫", "清洁洗护"] },
  { name: "婴童尿裤", subs: ["婴儿纸尿裤", "拉拉裤", "湿巾/纸巾"] },
  { name: "奶粉辅食", subs: ["一段奶粉", "二段奶粉", "三段奶粉", "营养辅食"] },
  { name: "婴童用品", subs: ["童车童床", "婴儿洗护", "喂养用品"] },
  { name: "个护美妆", subs: ["美妆", "面部护肤", "身体护理", "洗护发"] },
  { name: "服饰内衣", subs: ["女装", "男装", "内衣家居", "鞋靴箱包"] },
  { name: "女士内裤", subs: ["高弹透气", "无痕塑形", "收腹高腰"] },
  { name: "8811纯棉", subs: ["情侣套盒", "居家睡衣"] },
  { name: "美妆护肤", subs: ["面部护肤", "护肤套装"] },
  { name: "日化美妆", subs: ["日常彩妆", "身体护理"] },
  { name: "数码科技", subs: ["智能手表", "头戴耳机", "智能手机", "办公键盘"] },
  { name: "鞋履服饰", subs: ["通勤女装", "运动鞋履"] },
];





export interface AssociatedScript {
  id: string;
  title: string;
  template: string;
  tag: string;
  status: string;
  publisher: string;
  publishTime: string;
}


export const DEFAULT_ASSOCIATED_SCRIPTS: AssociatedScript[] = [
    {
      id: "script_1",
      title: "剪辑脚本_5",
      template: "AI分镜拆解",
      tag: "ces1...",
      status: "1",
      publisher: "zcl8",
      publishTime: "2025-04-17 16:37:32"
    }
  ];

export const DEFAULT_RELATED_VIDEOS: RelatedResourceVideo[] = [
    {
      id: "shot_1",
      videoUrl: "./assets/viral-gallery/beauty-promo.mp4",
      videoDuration: "30s", status: "审核通过", category: "口播实拍",
      type: "素材",
      code: "38945245",
      duration: "16.7秒",
      durationNum: 16.7,
      title: "张玲静 | 口播（实拍素材）",
      author: "张玲静",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
      date: "2025-05-05",
      syncTime: "2025-05-18 03:30:12",
      viewCount: 10,
      useCount: 6,
      color: "#a855f7"
    },
    {
      id: "shot_2",
      videoUrl: "./assets/viral-gallery/serum.mp4",
      videoDuration: "22s", status: "审核通过", category: "上脸实拍",
      type: "素材",
      code: "37333498",
      duration: "14.3秒",
      durationNum: 14.3,
      title: "叶闯红 | 上脸-磨皮版（纯净",
      author: "叶闯红",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      cover: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      date: "2025-04-19",
      syncTime: "2025-05-18 03:30:12",
      viewCount: 12,
      useCount: 11,
      color: "#3b82f6"
    },
    {
      id: "shot_3",
      videoUrl: "./assets/viral-gallery/skincare-set.mp4",
      videoDuration: "15s", status: "审核通过", category: "产品展示",
      type: "素材",
      code: "38951233",
      duration: "6.3秒",
      durationNum: 6.3,
      title: "姐妹种草团 | 全网可用 | E",
      author: "姐妹种草团",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      cover: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop&q=80",
      date: "2025-05-05",
      syncTime: "2025-05-18 03:30:12",
      viewCount: 15,
      useCount: 12,
      color: "#eab308"
    },
    {
      id: "shot_4",
      videoUrl: "./assets/viral-gallery/body-care.mp4",
      videoDuration: "18s", status: "待审核", category: "效果展示",
      type: "素材",
      code: "39363858",
      duration: "4.3秒",
      durationNum: 4.3,
      title: "非模特岗 | 纯净版 | 上脸-",
      author: "非模特岗",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      cover: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80",
      date: "2025-05-08",
      syncTime: "2025-05-18 03:30:12",
      viewCount: 8,
      useCount: 1,
      color: "#06b6d4"
    }
  ];

export const RELATED_VIDEO_OPTIONS: VideoResourcePickerItem[] = [
      {
        id: "aigc-finished-39810234",
        url: "./assets/viral-gallery/beauty-promo.mp4",
        name: "高奢美妆精油近景特写成片.mp4",
        cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
        status: "生成成功",
        section: "成片" as const,
        primaryCategory: "商品展示",
        secondaryCategory: "美妆护肤",
        tags: ["美妆", "近景"],
        author: "梦畅AI智能剪辑",
        duration: "12.5秒",
        size: "18.6 MB",
      },
      {
        id: "aigc-finished-39810235",
        url: "./assets/viral-gallery/serum.mp4",
        name: "夏日素颜上脸效果展示成片.mp4",
        cover: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        status: "生成成功",
        section: "成片" as const,
        primaryCategory: "达人口播",
        secondaryCategory: "效果展示",
        tags: ["模特", "上脸"],
        author: "创意生成组",
        duration: "18.2秒",
        size: "24.3 MB",
      },
      {
        id: "aigc-finished-39810236",
        url: "./assets/viral-gallery/skincare-set.mp4",
        name: "清爽控油产品功能演示成片.mp4",
        cover: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop&q=80",
        status: "生成成功",
        section: "成片" as const,
        primaryCategory: "商品展示",
        secondaryCategory: "功能演示",
        tags: ["控油", "演示"],
        author: "徐振",
        duration: "15.0秒",
        size: "20.8 MB",
      },
      {
        id: "aigc-material-39810237",
        url: "./assets/viral-gallery/skincare-set.mp4",
        name: "精油瓶身旋转特写素材.mp4",
        cover: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&auto=format&fit=crop&q=80",
        status: "可用",
        section: "素材" as const,
        primaryCategory: "产品素材",
        secondaryCategory: "产品特写",
        tags: ["精油", "静物"],
        author: "商品素材组",
        duration: "6.8秒",
        size: "9.4 MB",
      },
      {
        id: "aigc-material-39810238",
        url: "./assets/viral-gallery/serum.mp4",
        name: "模特涂抹精华近景素材.mp4",
        cover: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
        status: "可用",
        section: "素材" as const,
        primaryCategory: "人物素材",
        secondaryCategory: "上脸实拍",
        tags: ["模特", "护肤"],
        author: "达人授权素材",
        duration: "9.6秒",
        size: "13.1 MB",
      },
      {
        id: "aigc-material-39810239",
        url: "./assets/viral-gallery/body-care.mp4",
        name: "控油效果前后对比素材.mp4",
        cover: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&auto=format&fit=crop&q=80",
        status: "可用",
        section: "素材" as const,
        primaryCategory: "效果素材",
        secondaryCategory: "对比展示",
        tags: ["控油", "对比"],
        author: "徐振",
        duration: "8.4秒",
        size: "11.7 MB",
      },
    ];
