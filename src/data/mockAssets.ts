import { Asset } from "../types";

export const INITIAL_FULL_ASSETS: Asset[] = [
  // 1. 成片库 (Finished Videos)
  {
    id: "asset_f1",
    name: "【终版】2026日系高奢美妆精油15s信息流成片_v2.0.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
    size: "42.5 MB",
    createdAt: "2026-07-22 14:30",
    category: "成品视频",
    libraryType: "finished",
    isViral: true,
    viralRank: "S级",
    version: "v2.0 终版",
    creator: "剪辑专家小王",
    project: "2026夏季新品上市营销",
    platforms: ["Douyin", "TikTok", "小红书"],
    deliveryStatus: "投放中",
    copyrightStatus: "自有版权",
    permission: "商业全渠道授权",
    expireDate: "2028-12-31",
    notes: "前3秒黄金开头采用瓶身滴管近景特写，背景音加入水滴音效，卡点节奏优秀，转化率极高。",
    tags: ["美妆精华", "高奢日系", "信息流成片", "爆款推流", "卡点节奏"],
    fileInfo: {
      size: "42.5 MB",
      resolution: "1080x1920 (9:16)",
      duration: "00:15",
      format: "MP4",
      bitrate: "12.5 Mbps",
      aspectRatio: "9:16"
    },
    performance: {
      views: 1285000,
      likes: 86400,
      comments: 3240,
      shares: 11200,
      completionRate: "42.5%",
      gmv: 452000,
      roi: 4.25,
      orders: 3120,
      conversionRate: "5.8%"
    },
    versions: [
      {
        id: "v2",
        version: "v2.0",
        label: "终版 (音效加强)",
        url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
        updatedAt: "2026-07-22 14:30",
        updatedBy: "小王",
        changelog: "调整配乐EQ，替换最后3秒促单花字角标",
        fileSize: "42.5 MB",
        isCurrent: true
      },
      {
        id: "v1",
        version: "v1.0",
        label: "初版",
        url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
        updatedAt: "2026-07-18 10:15",
        updatedBy: "小王",
        changelog: "完成初步音画对齐剪辑",
        fileSize: "41.8 MB",
        isCurrent: false
      }
    ],
    rawMaterials: [
      {
        id: "rm1",
        name: "雅诗兰黛精华空瓶_主图主体.png",
        type: "image",
        url: "./assets/prototype/skincare-product.jpg",
        role: "产品主体3D建模渲染图"
      },
      {
        id: "rm2",
        name: "晨光透射大理石特写底片.mp4",
        type: "video",
        url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
        role: "背景氛围视频B-roll"
      },
      {
        id: "rm3",
        name: "ASMR水滴清脆开盖音效.mp3",
        type: "audio",
        role: "卡点音效组件"
      }
    ]
  },
  {
    id: "asset_f2",
    name: "【爆品】法式优雅吊带裙模特走秀30s高转化剪辑_v1.5.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    size: "68.1 MB",
    createdAt: "2026-07-20 16:45",
    category: "成品视频",
    libraryType: "finished",
    isViral: true,
    viralRank: "A级",
    version: "v1.5 修改版",
    creator: "李剪辑",
    project: "法式服装大促",
    platforms: ["Douyin", "快手", "小红书"],
    deliveryStatus: "投放中",
    copyrightStatus: "已授权",
    permission: "商业全渠道授权",
    expireDate: "2027-06-30",
    notes: "真丝质感光泽特写镜头提升停留时长，中段插入场景搭配动图，互动率提升35%。",
    tags: ["女装穿搭", "法式轻奢", "模特走秀", "高转化", "真丝面料"],
    fileInfo: {
      size: "68.1 MB",
      resolution: "1080x1920 (9:16)",
      duration: "00:30",
      format: "MP4",
      bitrate: "15.0 Mbps",
      aspectRatio: "9:16"
    },
    performance: {
      views: 890000,
      likes: 54200,
      comments: 1890,
      shares: 6500,
      completionRate: "38.2%",
      gmv: 318000,
      roi: 3.85,
      orders: 1980,
      conversionRate: "4.6%"
    },
    versions: [
      {
        id: "v1.5",
        version: "v1.5",
        label: "修改版",
        url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
        updatedAt: "2026-07-20 16:45",
        updatedBy: "李剪辑",
        changelog: "增加面料微距特写，优化色调为高光轻奢风格",
        fileSize: "68.1 MB",
        isCurrent: true
      }
    ],
    rawMaterials: [
      {
        id: "rm4",
        name: "模特红裙走秀素材_原图.mp4",
        type: "video",
        url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
        role: "真人模特走秀底片"
      }
    ]
  },

  // 2. 爆款库 (Viral / Hit Library)
  {
    id: "asset_v1",
    name: "【S级爆款】赛博智能手表动态光圈黑科技种草视效_v2.0.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-smart-watch-with-black-screen-40503-large.mp4",
    size: "52.3 MB",
    createdAt: "2026-07-15 09:20",
    category: "爆款视频",
    libraryType: "viral",
    isViral: true,
    viralRank: "S级",
    version: "v2.0 终版",
    creator: "AIGC爆款实验室",
    project: "智能穿戴新品破局爆量",
    platforms: ["Douyin", "TikTok", "快手", "视频号"],
    deliveryStatus: "投放中",
    copyrightStatus: "商业专有",
    permission: "商业全渠道授权",
    expireDate: "长期有效",
    notes: "黑科技赛博风光圈转场，搭配震动重低音音效，单条跑出超百万流水，可直接作为标杆复刻模板。",
    tags: ["S级爆款", "黑科技", "智能手表", "赛博朋克", "高ROI"],
    fileInfo: {
      size: "52.3 MB",
      resolution: "1080x1920 (9:16)",
      duration: "00:18",
      format: "MP4",
      bitrate: "18.0 Mbps",
      aspectRatio: "9:16"
    },
    performance: {
      views: 3420000,
      likes: 245000,
      comments: 12800,
      shares: 38900,
      completionRate: "54.1%",
      gmv: 1280000,
      roi: 5.2,
      orders: 8600,
      conversionRate: "7.2%"
    },
    rawMaterials: [
      {
        id: "rm5",
        name: "智能蓝牙音箱白色_高对比度.png",
        type: "image",
        role: "数码细节贴图"
      }
    ]
  },
  {
    id: "asset_v2",
    name: "【A级爆款】法式复古高帮帆布鞋户外场景爆款视频_v1.2.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-running-shoes-being-tied-41711-large.mp4",
    size: "48.6 MB",
    createdAt: "2026-07-12 11:30",
    category: "爆款视频",
    libraryType: "viral",
    isViral: true,
    viralRank: "A级",
    version: "v1.2",
    creator: "内容制作一组",
    project: "鞋履夏季推流",
    platforms: ["小红书", "Douyin"],
    deliveryStatus: "投放中",
    copyrightStatus: "自有版权",
    permission: "内部使用",
    expireDate: "2027-12-31",
    notes: "巴黎石板路复古街景，自然光照射，吸引大量年轻人互动询价。",
    tags: ["A级爆款", "鞋履爆款", "法式街头", "小红书种草"],
    fileInfo: {
      size: "48.6 MB",
      resolution: "1080x1920 (9:16)",
      duration: "00:20",
      format: "MP4",
      bitrate: "14.0 Mbps",
      aspectRatio: "9:16"
    },
    performance: {
      views: 1850000,
      likes: 112000,
      comments: 6400,
      shares: 18200,
      completionRate: "46.0%",
      gmv: 620000,
      roi: 4.1,
      orders: 4200,
      conversionRate: "5.1%"
    }
  },

  // 3. 模板库 (Template Library)
  {
    id: "asset_t1",
    name: "【脚本模板】3秒黄金痛点+产品对比+限时优惠通用模板.json",
    type: "template",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
    size: "2.4 MB",
    createdAt: "2026-07-10 14:00",
    category: "复用模板",
    libraryType: "template",
    isViral: false,
    version: "v1.0 标版",
    creator: "编剧张老师",
    project: "电商短视频SOP规范",
    platforms: ["Douyin", "TikTok", "快手", "小红书"],
    deliveryStatus: "未投放",
    copyrightStatus: "自有版权",
    permission: "内部使用",
    expireDate: "长期有效",
    notes: "预置黄金3秒开场痛点文案、主体转场轨道、角标引导买赠话术，可直接导入脚本自动化生成。",
    tags: ["黄金3秒", "痛点脚本", "促销模板", "复用率99%"],
    fileInfo: {
      size: "2.4 MB",
      resolution: "矢量结构/分镜轨",
      duration: "15s-30s可调",
      format: "JSON/PRPROJ"
    }
  },
  {
    id: "asset_t2",
    name: "【剪辑工程】美妆护肤品极简杂志高奢风转场套件.aep",
    type: "template",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80",
    size: "185.0 MB",
    createdAt: "2026-07-08 09:40",
    category: "复用模板",
    libraryType: "template",
    version: "v2.1",
    creator: "视觉总监陈",
    project: "美妆视觉SOP",
    platforms: ["Douyin", "小红书"],
    deliveryStatus: "未投放",
    copyrightStatus: "自有版权",
    permission: "商业全渠道授权",
    expireDate: "长期有效",
    notes: "包含高奢杂志扫光、水墨渐变、大理石裂变等8种高端动效模板。",
    tags: ["AE工程", "美妆高奢", "杂志风", "转场套件"],
    fileInfo: {
      size: "185.0 MB",
      resolution: "4K (3840x2160)",
      duration: "模板预置",
      format: "AEP"
    }
  },

  // 4. 组件库 (Component Library)
  {
    id: "asset_c1",
    name: "【高亮花字】黑金奢华价格弹窗与促单爆品角标套组.png",
    type: "image",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
    size: "8.5 MB",
    createdAt: "2026-07-19 11:20",
    category: "视觉组件",
    libraryType: "component",
    version: "v1.0",
    creator: "UI组",
    project: "品牌视觉资产库",
    platforms: ["Douyin", "快手", "小红书"],
    deliveryStatus: "未投放",
    copyrightStatus: "自有版权",
    permission: "商业全渠道授权",
    expireDate: "长期有效",
    notes: "透明背景PNG序列，支持买一赠一、限时抄底价、镇店之宝等12种爆款角标。",
    tags: ["促单角标", "黑金花字", "透明背景", "贴纸组件"],
    fileInfo: {
      size: "8.5 MB",
      resolution: "2160x3840",
      duration: "静态/透明图层",
      format: "PNG (Alpha)"
    }
  },
  {
    id: "asset_c2",
    name: "【音效组件】ASMR爽感解压开盖与液体滴落特效音.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    size: "1.2 MB",
    createdAt: "2026-07-16 15:10",
    category: "音效组件",
    libraryType: "component",
    version: "v1.0",
    creator: "音效师",
    project: "声音质感升级",
    platforms: ["Douyin", "TikTok", "快手"],
    deliveryStatus: "未投放",
    copyrightStatus: "已授权",
    permission: "商业全渠道授权",
    expireDate: "长期有效",
    notes: "超高清沉浸式ASMR音频，增强产品质感与爽感感官印象。",
    tags: ["ASMR音效", "解压开盖", "液体滴落", "声音组件"],
    fileInfo: {
      size: "1.2 MB",
      resolution: "48kHz / 24bit",
      duration: "00:03",
      format: "MP3/WAV"
    }
  },

  // 5. 投放素材库 (Ad Delivery Media Library)
  {
    id: "asset_d1",
    name: "【TikTok 9:16】英美区美容美体仪高转化多语规格素材_v2.0.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
    size: "54.0 MB",
    createdAt: "2026-07-21 08:30",
    category: "投放素材",
    libraryType: "ad_delivery",
    version: "v2.0 终版",
    creator: "出海投放组",
    project: "2026 Q3 TikTok北美大促",
    platforms: ["TikTok"],
    deliveryStatus: "投放中",
    copyrightStatus: "商业专有",
    permission: "对外分发",
    expireDate: "2027-01-01",
    notes: "专为TikTok广告流量优化，配有美式英文语音口播与原生感字幕，转化率稳定在6.2%。",
    tags: ["TikTok投放", "北美出海", "9:16竖屏", "英文口播", "高转化"],
    fileInfo: {
      size: "54.0 MB",
      resolution: "1080x1920 (9:16)",
      duration: "00:20",
      format: "MP4",
      bitrate: "16 Mbps",
      aspectRatio: "9:16"
    },
    performance: {
      views: 2150000,
      likes: 135000,
      comments: 7200,
      shares: 19400,
      completionRate: "48.2%",
      gmv: 890000,
      roi: 4.8,
      orders: 5400,
      conversionRate: "6.2%"
    }
  },

  // 6. 归档库 (Archive Library)
  {
    id: "asset_a1",
    name: "【已归档】2025冬季暖阳羽绒服过季宣传视频_v1.0.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    size: "72.4 MB",
    createdAt: "2025-11-10 10:00",
    category: "历史归档",
    libraryType: "archive",
    version: "v1.0",
    creator: "历史制作组",
    project: "2025冬季旧活动",
    platforms: ["Douyin"],
    deliveryStatus: "已结束",
    copyrightStatus: "待核验",
    permission: "内部使用",
    expireDate: "2026-03-01 (已到期)",
    notes: "过季款式素材归档，仅作为剪辑B-roll镜头或历史数据对照参考。",
    tags: ["历史归档", "过季羽绒服", "老素材"],
    fileInfo: {
      size: "72.4 MB",
      resolution: "1080x1920",
      duration: "00:30",
      format: "MP4"
    }
  },

  // 7. 回收站 (Recycle Bin / Trash)
  {
    id: "asset_trash1",
    name: "【弃用片段】未过审口播语音误录音轨_20260701.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-smart-watch-with-black-screen-40503-large.mp4",
    size: "32.1 MB",
    createdAt: "2026-07-01 11:00",
    category: "垃圾废件",
    libraryType: "trash",
    deletedAt: "2026-07-23 18:20",
    version: "v0.8 废稿",
    creator: "实习生小李",
    project: "草稿弃用",
    platforms: [],
    deliveryStatus: "已暂停",
    copyrightStatus: "待核验",
    permission: "内部使用",
    expireDate: "-",
    notes: "误录杂音弃用，放入回收站，可随时彻底删除。",
    tags: ["废稿", "待清理"],
    fileInfo: {
      size: "32.1 MB",
      resolution: "1080x1920",
      duration: "00:10",
      format: "MP4"
    }
  }
];
