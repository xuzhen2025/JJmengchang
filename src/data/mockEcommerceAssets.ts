import { ECommerceAsset } from "../types/ecommerceAsset";

export const INITIAL_ECOMMERCE_ASSETS: ECommerceAsset[] = [
  // 1. 图片类 (Image)
  {
    id: "img-001",
    name: "雅诗兰黛小棕瓶精华透光场景大图",
    category: "image",
    url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
    fileSize: "4.2 MB",
    format: "PNG (4096x2730)",
    createdAt: "2026-07-20 14:30",
    creator: "视觉设计部-张敏",
    tags: ["主图", "高奢美妆", "透光质感", "4K"],
    copyrightStatus: "自有版权",
    usageCount: 28,
    usageLogs: [
      {
        id: "use-101",
        projectName: "7月小棕瓶混剪短视频A/B测试",
        usedAt: "2026-07-23 16:10",
        usedBy: "运营-王浩",
        usageType: "AI视频混剪",
        targetPlatform: "Douyin"
      },
      {
        id: "use-102",
        projectName: "夏季美妆狂欢节信息流广告",
        usedAt: "2026-07-22 10:45",
        usedBy: "投放-李娜",
        usageType: "信息流广告",
        targetPlatform: "Xiaohongshu"
      },
      {
        id: "use-103",
        projectName: "天猫旗舰店首页轮播Banner",
        usedAt: "2026-07-21 09:00",
        usedBy: "美工-陈晨",
        usageType: "详情页挂载",
        targetPlatform: "Taobao"
      }
    ],
    notes: "经过后期精修处理，透光感极佳，适合用于高端护肤品主图或AI重构背景"
  },
  {
    id: "img-002",
    name: "法式复古真丝吊带连衣裙模特街拍",
    category: "image",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    fileSize: "3.8 MB",
    format: "JPG (3000x4000)",
    createdAt: "2026-07-19 11:15",
    creator: "品牌摄影师-刘洋",
    tags: ["服装Lookbook", "法式复古", "外景街拍", "夏季爆款"],
    copyrightStatus: "已授权",
    expireDate: "2027-12-31",
    usageCount: 19,
    usageLogs: [
      {
        id: "use-104",
        projectName: "夏季女装新品裂变短视频",
        usedAt: "2026-07-23 14:20",
        usedBy: "剪辑师-周强",
        usageType: "AI视频混剪",
        targetPlatform: "TikTok"
      }
    ],
    notes: "模特签约拍摄，已获得肖像授权及全渠道商业传播权"
  },
  {
    id: "img-003",
    name: "智能运动手表降噪特写3D白底渲染",
    category: "image",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    fileSize: "2.1 MB",
    format: "PNG (Alpha透明底)",
    createdAt: "2026-07-18 09:40",
    creator: "3D建模组",
    tags: ["数码3D", "白底图", "透明背景", "细节特写"],
    copyrightStatus: "自有版权",
    usageCount: 45,
    usageLogs: [
      {
        id: "use-105",
        projectName: "智能手表爆款详情页生成套件",
        usedAt: "2026-07-24 08:30",
        usedBy: "设计-张敏",
        usageType: "详情页挂载",
        targetPlatform: "Taobao"
      }
    ],
    notes: "包含高精度模型深度图，可用AI批量替换各种运动场景背景"
  },

  // 2. 资质类 (Qualification)
  {
    id: "qual-001",
    name: "国家美妆重金属与微生物检测合格报告2026",
    category: "qualification",
    url: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80",
    fileSize: "1.5 MB",
    format: "PDF / 图片预览",
    certNumber: "GZ-2026-8891003",
    certScope: "护肤品/精华类/面霜类检测",
    certIssuer: "国家广州质量监督检验研究院",
    createdAt: "2026-06-01 10:00",
    expireDate: "2027-06-01",
    creator: "合规风控部-赵静",
    tags: ["质检报告", "国家级检测", "美妆必备", "合规背书"],
    copyrightStatus: "已授权",
    usageCount: 52,
    usageLogs: [
      {
        id: "use-201",
        projectName: "抖音小店美妆类目入驻资质报备",
        usedAt: "2026-07-10 11:00",
        usedBy: "运营-赵静",
        usageType: "平台资质审核",
        targetPlatform: "Douyin"
      },
      {
        id: "use-202",
        projectName: "混剪视频尾帧安心承诺贴图",
        usedAt: "2026-07-22 17:30",
        usedBy: "剪辑师-周强",
        usageType: "直播间贴图/视频水印",
        targetPlatform: "Douyin"
      }
    ],
    notes: "检测项全面包含铅、汞、砷及菌落总数，完全达标，视频切片必备信任因子"
  },
  {
    id: "qual-002",
    name: "Nike/耐克品牌一级正品经销商授权证书",
    category: "qualification",
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    fileSize: "2.8 MB",
    format: "JPG 扫码件",
    certNumber: "AUTH-NK-2026-Q2-882",
    certScope: "运动鞋服全系列线上销售",
    certIssuer: "耐克（中国）体育用品有限公司",
    createdAt: "2026-01-01 09:00",
    expireDate: "2026-12-31",
    creator: "商务部-孙薇",
    tags: ["品牌授权", "正品保证", "正规发票", "授权书"],
    copyrightStatus: "已授权",
    usageCount: 64,
    usageLogs: [
      {
        id: "use-203",
        projectName: "直播间挂壁大屏正品承诺轮播",
        usedAt: "2026-07-23 20:00",
        usedBy: "场控-王强",
        usageType: "直播间贴纸",
        targetPlatform: "Douyin"
      }
    ],
    notes: "带官方防伪钢印和防伪二维码，授权期限截至2026年底"
  },

  // 3. 文案类 (Copywriting)
  {
    id: "copy-001",
    name: "【黄金3秒】抗衰精华黄金痛点开场+买一赠三反转脚本",
    category: "copywriting",
    content: `【黄金3秒卡点钩子】
“阿姨皮肤看起来比你还紧致？别再用清水洗脸瞎折腾了！”

【痛点共鸣 (3s - 10s)】
每天熬夜加班到两点，垮脸、暗沉、法令纹比同龄人显老5岁？试过各种大牌贵妇膏还是没效果？

【产品利益点 (10s - 25s)】
看这里！专研高浓玻色因+重组胶原蛋白，专克干纹垮脸！质地像清爽润雪膏，吸收超快不粘腻。连续用上14天，脸蛋像剥了壳的鸡蛋一样透亮紧致！

【促销反转促单 (25s - 35s)】
平时天猫一瓶要¥399，今天直播间创始人直接发福利！点击下方小黄车，买30ml直接送同款30ml替换装，再加赠5片玻尿酸面膜！限量200套，抢完恢复原价！`,
    createdAt: "2026-07-21 16:20",
    creator: "爆款文案组-王雪",
    tags: ["痛点开场", "高转化脚本", "买一赠三", "美妆抗衰"],
    copyrightStatus: "自有版权",
    usageCount: 38,
    usageLogs: [
      {
        id: "use-301",
        projectName: "抗衰精华AI数字人口播混剪100条",
        usedAt: "2026-07-23 18:00",
        usedBy: "运营-陈晨",
        usageType: "AI视频混剪",
        targetPlatform: "Douyin"
      },
      {
        id: "use-302",
        projectName: "快手金牌女装美妆大促话术库",
        usedAt: "2026-07-22 14:10",
        usedBy: "主播-小雪",
        usageType: "直播间话术",
        targetPlatform: "Kuaishou"
      }
    ],
    notes: "测试转化率高达4.8%，开场前3秒留存率提高42%"
  },
  {
    id: "copy-002",
    name: "【小红书种草】法式吊带裙种草文案：穿上直接瘦5斤的视觉魔法",
    category: "copywriting",
    content: `姐妹们！终于被我淘到这条宝藏法式吊带裙了😭！！
原图无修直出，这个收腰剪裁和垂坠感真的绝了！

重点是它的X版型！瞬间遮住小肚子和假胯宽，视觉上直接显瘦5斤！
真丝混纺的面料穿上超有凉感，微风吹过来裙摆摇曳，法式浪漫感直接拉满～

无论是约会拍照还是海岛度假，出片率100%！
🛒 链接已放在左下角，姐妹们赶紧冲！`,
    createdAt: "2026-07-19 14:00",
    creator: "文案组-李婷",
    tags: ["小红书种草", "显瘦神器", "法式穿搭", "朋友圈爆款"],
    copyrightStatus: "自有版权",
    usageCount: 27,
    usageLogs: [
      {
        id: "use-303",
        projectName: "小红书图文卡片批量矩阵发布",
        usedAt: "2026-07-23 11:30",
        usedBy: "矩阵运维-小李",
        usageType: "图文发布",
        targetPlatform: "Xiaohongshu"
      }
    ],
    notes: "适配配合3-4张人像街拍图，引流评论区提问“求链接”"
  },

  // 4. 音频类 (Audio)
  {
    id: "aud-001",
    name: "AI高奢女声 - 优雅温润美妆解说词（包含情绪起伏）",
    category: "audio",
    url: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg", // 示例音频
    duration: "00:35",
    fileSize: "1.2 MB",
    format: "MP3 (320kbps)",
    createdAt: "2026-07-22 10:15",
    creator: "AI配音合成服务",
    tags: ["AI配音", "高奢女声", "清晰自然", "普通话标准"],
    copyrightStatus: "自有版权",
    usageCount: 31,
    usageLogs: [
      {
        id: "use-401",
        projectName: "雅诗兰黛AI音视频裂变20条",
        usedAt: "2026-07-23 21:00",
        usedBy: "剪辑师-周强",
        usageType: "AI视频混剪",
        targetPlatform: "Douyin"
      }
    ],
    notes: "采用Gemini TTS神经网络高奢调音，语气顿挫自然，无机械感"
  },
  {
    id: "aud-002",
    name: "真人KOC爽朗女声 - 服装实穿感受爆款口播",
    category: "audio",
    url: "https://actions.google.com/sounds/v1/foley/footsteps_on_cement.ogg",
    duration: "00:24",
    fileSize: "980 KB",
    format: "WAV (24bit)",
    createdAt: "2026-07-17 15:30",
    creator: "签约KOC-小林",
    tags: ["真人口播", "亲切自然", "真实评测", "女装爆款"],
    copyrightStatus: "已授权",
    expireDate: "2027-01-01",
    usageCount: 16,
    usageLogs: [
      {
        id: "use-402",
        projectName: "TikTok美区女装信息流投放",
        usedAt: "2026-07-21 19:40",
        usedBy: "出海组-Michael",
        usageType: "信息流广告",
        targetPlatform: "TikTok"
      }
    ],
    notes: "真实录音棚降噪版本，伴随真实语气词，提升粉丝信任感"
  },

  // 5. BGM类 (BGM)
  {
    id: "bgm-001",
    name: "【爆款节奏卡点】128BPM 欢快轻快电音节奏乐",
    category: "bgm",
    url: "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg",
    duration: "00:30",
    bpm: 128,
    genre: "卡点电音 / 欢快快节奏",
    fileSize: "2.4 MB",
    format: "MP3",
    createdAt: "2026-07-15 09:00",
    creator: "音乐库合规采购",
    tags: ["卡点神器", "BPM 128", "欢快促销", "数码潮品"],
    copyrightStatus: "已授权",
    expireDate: "2028-12-31",
    usageCount: 76,
    usageLogs: [
      {
        id: "use-501",
        projectName: "智能手表10秒快节奏转场混剪",
        usedAt: "2026-07-24 09:15",
        usedBy: "剪辑师-周强",
        usageType: "AI视频混剪",
        targetPlatform: "Douyin"
      },
      {
        id: "use-502",
        projectName: "天猫大促开场动效BGM",
        usedAt: "2026-07-20 11:20",
        usedBy: "运营-李娜",
        usageType: "详情页挂载",
        targetPlatform: "Taobao"
      }
    ],
    notes: "商用全渠道授权，鼓点清晰，非常适合0.2秒快节奏图片切换和高频视觉冲击"
  },
  {
    id: "bgm-002",
    name: "【高端奢华】优雅大提琴+温暖钢琴轻音乐",
    category: "bgm",
    url: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
    duration: "01:15",
    bpm: 92,
    genre: "高奢古典 / 舒缓疗愈",
    fileSize: "4.8 MB",
    format: "MP3",
    createdAt: "2026-07-10 14:00",
    creator: "品牌音频组",
    tags: ["高奢质感", "美妆香水", "钢琴大提琴", "舒缓背景音"],
    copyrightStatus: "自有版权",
    usageCount: 43,
    usageLogs: [
      {
        id: "use-503",
        projectName: "抗衰精华高奢品牌宣传片",
        usedAt: "2026-07-22 15:00",
        usedBy: "品牌部-陈晨",
        usageType: "品牌宣传",
        targetPlatform: "Xiaohongshu"
      }
    ],
    notes: "能够显著提升视频的高质感与留存时间，不压人声口播"
  },

  // 6. 第三方参考视频 (Ref Video)
  {
    id: "ref-001",
    name: "【抖音对标参考】单条GMV破百万元的智能手表光圈拆解短视频",
    category: "ref_video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    refSourceUrl: "https://www.douyin.com/video/73889102938101",
    refPlatform: "Douyin",
    refHighlights: "前2秒利用金属重击声+宏观光圈放大的视觉冲击钩子；5秒处展示防水浸泡实测；12秒直接给出直播间破价优惠。可完全套用其脚本与镜头节奏。",
    duration: "00:28",
    fileSize: "18.5 MB",
    format: "MP4 (1080x1920)",
    createdAt: "2026-07-22 18:30",
    creator: "对标竞品挖掘组",
    tags: ["竞品爆款", "GMV百万级", "视觉钩子拆解", "数码硬件"],
    copyrightStatus: "限制使用",
    usageCount: 22,
    usageLogs: [
      {
        id: "use-601",
        projectName: "7月智能手表同款视频重拍与分镜拆解",
        usedAt: "2026-07-23 10:00",
        usedBy: "导演-张明",
        usageType: "同款重拍/分镜借鉴",
        targetPlatform: "Douyin"
      }
    ],
    notes: "仅供团队内部分镜拆解与AI画幅同款借鉴，禁止直接原样二次上传"
  },
  {
    id: "ref-002",
    name: "【TikTok美区爆款】美容仪微电流拉提前后对比视效转场参考",
    category: "ref_video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    refSourceUrl: "https://www.tiktok.com/@beauty_trends/video/9871239102",
    refPlatform: "TikTok",
    refHighlights: "采用半脸对比（左脸下垂 vs 右脸提拉）+ 智能微电流科技感线条特效。完播率达38%，极具说服力。",
    duration: "00:19",
    fileSize: "12.2 MB",
    format: "MP4 (1080x1920)",
    createdAt: "2026-07-20 11:00",
    creator: "出海研究组",
    tags: ["TikTok爆款", "美区对标", "前后对比", "科技感特效"],
    copyrightStatus: "限制使用",
    usageCount: 18,
    usageLogs: [
      {
        id: "use-602",
        projectName: "美容仪TikTok美区投放素材生成",
        usedAt: "2026-07-22 16:30",
        usedBy: "海外运营-Sarah",
        usageType: "同款重拍/分镜借鉴",
        targetPlatform: "TikTok"
      }
    ],
    notes: "可配合我们自研的AI图像重构功能，一键将模特面部转换为欧美人人像"
  },

  // 7. 真人素材 (Human Model / KOC)
  {
    id: "hm-001",
    name: "签约KOC-小林：美妆亲切口播与试用特写素材库",
    category: "human_model",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    avatarStyle: "亲切接地气KOC / 邻家师姐",
    gender: "女性 22-26岁",
    motionType: "手持面霜涂抹 + 4K面部微距特写",
    fileSize: "128.5 MB",
    format: "MP4 (4K 60fps绿幕/实景)",
    createdAt: "2026-07-21 09:30",
    creator: "MCN合作部-王强",
    tags: ["签约KOC", "真实试用", "美妆护肤", "肖像已授权"],
    copyrightStatus: "已授权",
    expireDate: "2027-08-31",
    usageCount: 54,
    usageLogs: [
      {
        id: "use-701",
        projectName: "精华液爆款视频A/B组绿幕换背景",
        usedAt: "2026-07-23 15:20",
        usedBy: "剪辑师-周强",
        usageType: "AI视频混剪",
        targetPlatform: "Douyin"
      },
      {
        id: "use-702",
        projectName: "小红书真实测评图文素材抽取",
        usedAt: "2026-07-22 11:00",
        usedBy: "运营-陈晨",
        usageType: "图文发布",
        targetPlatform: "Xiaohongshu"
      }
    ],
    notes: "带无缝绿幕视频与多角度表情动作，可直接在AI视频生成器中挂载换背景"
  },
  {
    id: "hm-003",
    name: "短视频爆款KOC-小美：家居生活场景实测口播",
    category: "human_model",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
    avatarStyle: "温馨居家KOC / 宝妈种草博主",
    gender: "女性 26-30岁",
    motionType: "厨房/客厅开箱讲解与试用体验",
    fileSize: "185.0 MB",
    format: "MP4 (1080p 60fps)",
    createdAt: "2026-06-10 11:20",
    creator: "达人运营组-张敏",
    tags: ["居家生活", "宝妈种草", "口播实测", "即将到期"],
    copyrightStatus: "已授权",
    expireDate: "2026-08-05", // 距当前2026-07-24约12天到期 -> 临期告警
    usageCount: 42,
    usageLogs: [
      {
        id: "use-704",
        projectName: "智能扫地机夏日大促信息流",
        usedAt: "2026-07-20 14:10",
        usedBy: "投放组-李雷",
        usageType: "信息流广告",
        targetPlatform: "Douyin"
      }
    ],
    notes: "【授权临期提醒】肖像合同将于12天后(2026-08-05)到期，请及时联系商务续约，逾期下架广告"
  },
  {
    id: "hm-004",
    name: "资深外籍模特-Lucas：男装与运动健身系列镜头",
    category: "human_model",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    avatarStyle: "欧美阳光健身 / 商务男模",
    gender: "男性 25-30岁",
    motionType: "户外跑步 + 健身房穿搭肌肉展示",
    fileSize: "320.0 MB",
    format: "4K MOV (含透明通道/ProRes)",
    createdAt: "2025-06-25 10:00",
    creator: "品牌外宣部",
    tags: ["外籍男模", "运动穿搭", "授权已到期", "下线提醒"],
    copyrightStatus: "限制使用",
    expireDate: "2026-06-30", // 距当前2026-07-24已过期24天 -> 已到期
    usageCount: 88,
    usageLogs: [
      {
        id: "use-705",
        projectName: "健身服夏季新品海外广告",
        usedAt: "2026-06-28 18:00",
        usedBy: "出海组-Michael",
        usageType: "信息流广告",
        targetPlatform: "TikTok"
      }
    ],
    notes: "⚠️【授权已到期】肖像权已于2026-06-30届满！严禁新项目调用，已投广告请按合约排查下线！"
  },
  {
    id: "hm-002",
    name: "外籍高奢模特-Sophia：欧美风服装与珠宝走秀片段",
    category: "human_model",
    url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80",
    avatarStyle: "欧美高奢时尚 / 气质名媛",
    gender: "女性 20-25岁",
    motionType: "室内T台走秀 + 珠宝手势镜头",
    fileSize: "210.0 MB",
    format: "MP4 (1080x1920 60fps)",
    createdAt: "2026-07-18 16:00",
    creator: "品牌外宣部",
    tags: ["欧美模特", "高奢珠宝", "出海TikTok", "商业大片"],
    copyrightStatus: "已授权",
    expireDate: "2028-01-01",
    usageCount: 37,
    usageLogs: [
      {
        id: "use-703",
        projectName: "TikTok欧美黑五大促珠宝混剪",
        usedAt: "2026-07-22 19:30",
        usedBy: "出海组-Michael",
        usageType: "信息流广告",
        targetPlatform: "TikTok"
      }
    ],
    notes: "高级感十足，特别适合TikTok美区以及独立站首页高奢Banner视频"
  },

  // 8. 数字人 (Digital Human / AI Avatar)
  {
    id: "dh-001",
    name: "高干知性主播-艾米：24小时电商直播间超逼真数字人",
    category: "digital_human",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
    avatarStyle: "职场高干 / 知性专业 / 亲和力主播",
    gender: "女性 28-32岁",
    motionType: "微表情逼真动作 + 手势推介产品",
    fileSize: "数字人形象模型",
    format: "4K 神经网络交互模型",
    createdAt: "2026-07-22 14:00",
    creator: "AI研发中心",
    tags: ["数字人主播", "24h无休直播", "超逼真微表情", "唇形精准匹配"],
    copyrightStatus: "自有版权",
    usageCount: 89,
    usageLogs: [
      {
        id: "use-801",
        projectName: "抖音深夜无人值守美妆直播间",
        usedAt: "2026-07-24 02:00",
        usedBy: "直播中控-张伟",
        usageType: "直播间贴纸/背景",
        targetPlatform: "Douyin"
      },
      {
        id: "use-802",
        projectName: "AI数字人口播自动批量生成短视频50条",
        usedAt: "2026-07-23 20:15",
        usedBy: "剪辑师-周强",
        usageType: "AI视频混剪",
        targetPlatform: "Taobao"
      }
    ],
    notes: "支持多国语言与方言，一键挂载文案后可自动驱动唇形与手势"
  },
  {
    id: "dh-002",
    name: "阳光潮流数码主播-阿杰：数码科技产品解说数字人",
    category: "digital_human",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    avatarStyle: "阳光极客 / 数码测评发烧友",
    gender: "男性 24-28岁",
    motionType: "双持有拆解摆放动作 + 自然头摇微动作",
    fileSize: "数字人形象模型",
    format: "4K 深度模型",
    createdAt: "2026-07-20 10:30",
    creator: "AI研发中心",
    tags: ["数码测评", "男主播", "科技感强", "AI配音对齐"],
    copyrightStatus: "自有版权",
    usageCount: 42,
    usageLogs: [
      {
        id: "use-803",
        projectName: "智能耳机快速拆解测评视频生成",
        usedAt: "2026-07-23 09:40",
        usedBy: "运营-李娜",
        usageType: "AI视频混剪",
        targetPlatform: "Douyin"
      }
    ],
    notes: "对标硬件数码类博主，话术带感，转化率优秀"
  }
];
