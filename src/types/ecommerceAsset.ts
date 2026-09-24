export type ECommerceAssetCategory = 
  | "image"          // 商品/营销图片
  | "human_model"    // 真人素材/模特KOC
  | "digital_human"  // 数字人/虚拟主播
  | "qualification"  // 资质文件/质检报告/商标授权
  | "copywriting"    // 营销文案/脚本/爆款标题
  | "audio"          // 口播音频/解说音频
  | "bgm"            // 背景音乐
  | "ref_video";     // 第三方参考视频

export interface UsageRecord {
  id: string;
  projectName: string;     // 使用的项目/视频名称
  usedAt: string;          // 使用时间
  usedBy: string;          // 使用人
  usageType: string;       // 使用类型 (如 "AI视频混剪", "详情页挂载", "信息流广告", "直播间贴纸")
  targetPlatform?: string; // 目标平台 (如 "Douyin", "TikTok", "小红书", "淘宝")
}

export interface ECommerceAsset {
  id: string;
  name: string;
  category: ECommerceAssetCategory; // 分类
  url?: string;                     // 图片/资质/音频/BGM/参考视频文件地址
  content?: string;                 // 文案富文本内容
  
  // 真人素材/数字人专属字段
  avatarStyle?: string;             // 风格/形象特点 (如: "欧美高奢模特", "韩系亲切KOC", "职场高干数字人")
  gender?: string;                  // 性别/人群定位 (如: "女性 22-28岁", "男性 30-35岁")
  motionType?: string;              // 动作/肢体幅度 (如: "手持试用", "口播肢体展示", "服饰走秀")
  
  // 资质专属字段
  certNumber?: string;              // 证书/资质编号
  certScope?: string;               // 适用类目/范围
  certIssuer?: string;              // 发证机构
  
  // 第三方参考视频专属字段
  refSourceUrl?: string;            // 原始参考链接
  refPlatform?: string;             // 参考来源平台 (Douyin, TikTok, 小红书, 快手)
  refHighlights?: string;           // 拆解亮点/借鉴点 (如: "黄金3秒视觉钩子+快节奏对比")
  
  // BGM / 音频专属字段
  duration?: string;                // 时长
  bpm?: number;                     // 节奏BPM
  genre?: string;                   // 风格/曲风 (卡点/轻快/高奢/促销)
  
  // 基础元数据
  fileSize?: string;
  format?: string;
  createdAt: string;
  creator: string;
  tags: string[];
  
  // 版权与授权管理
  copyrightStatus: "已授权" | "自有版权" | "审核中" | "限制使用";
  expireDate?: string;              // 有效期/资质到期时间
  
  // 使用情况记录 (核心功能需求)
  usageCount: number;               // 总引用次数
  usageLogs: UsageRecord[];         // 详细使用明细列表
  
  notes?: string;                   // 备注说明
  deletedAt?: string;               // 回收站删除时间
}
