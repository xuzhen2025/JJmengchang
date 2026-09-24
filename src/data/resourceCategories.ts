export interface CategoryL2Node { id: string; name: string }
export interface CategoryL1Node { id: string; name: string; children: CategoryL2Node[] }

export const INITIAL_CATEGORIES: Record<string, CategoryL1Node[]> = {
  "成片": [
    {
      id: "sp1-c1",
      name: "彩妆护肤",
      children: [
        { id: "sp1-c1-1", name: "美妆-123456" },
        { id: "sp1-c1-2", name: "彩妆口播选辑" },
        { id: "sp1-c1-3", name: "护肤试用片" },
      ]
    },
    {
      id: "sp1-c2",
      name: "彩妆香水",
      children: [
        { id: "sp1-c2-1", name: "口播切片" },
        { id: "sp1-c2-2", name: "粉底隐形" },
        { id: "sp1-c2-3", name: "口红试色" },
      ]
    },
    {
      id: "sp2-c1",
      name: "女士内衣",
      children: [
        { id: "sp2-c1-1", name: "抹胸款" },
        { id: "sp2-c1-2", name: "无钢圈" },
        { id: "sp2-c1-3", name: "聚拢款" },
      ]
    },
    {
      id: "sp2-c2",
      name: "塑身衣",
      children: [
        { id: "sp2-c2-1", name: "无痕塑形" },
        { id: "sp2-c2-2", name: "高弹透气" },
        { id: "sp2-c2-3", name: "收腹高腰" },
      ]
    },
    {
      id: "sp3-c1",
      name: "购买达人视频",
      children: [
        { id: "sp3-c1-1", name: "爆款走秀" },
        { id: "sp3-c1-2", name: "情侣套盒" },
      ]
    },
    {
      id: "sp4-c1",
      name: "千川引流",
      children: [
        { id: "sp4-c1-1", name: "直播高光切片" },
      ]
    },
  ],
  "脚本": [
    {
      id: "scr1-c1",
      name: "美妆护肤",
      children: [
        { id: "scr1-c1-1", name: "开场吸睛三秒" },
        { id: "scr1-c1-2", name: "痛点导入脚本" },
        { id: "scr1-c1-3", name: "成分对比拆解" },
      ]
    },
    {
      id: "scr1-c2",
      name: "彩妆香水",
      children: [
        { id: "scr1-c2-1", name: "试色种草" },
        { id: "scr1-c2-2", name: "妆容教程" },
      ]
    },
    {
      id: "scr2-c1",
      name: "传统滋补",
      children: [
        { id: "scr2-c1-1", name: "养生口服" },
        { id: "scr2-c1-2", name: "破壁灵芝" },
      ]
    },
    {
      id: "scr3-c1",
      name: "童装/童鞋",
      children: [
        { id: "scr3-c1-1", name: "亲子穿搭" },
        { id: "scr3-c1-2", name: "萌宝走秀" },
      ]
    },
  ],
  "音频": [
    {
      id: "aud1-c1",
      name: "美妆护肤",
      children: [
        { id: "aud1-c1-1", name: "口播旁白" },
        { id: "aud1-c1-2", name: "女声温柔解说" },
        { id: "aud1-c1-3", name: "趣味音效" },
      ]
    },
    {
      id: "aud1-c2",
      name: "彩妆香水",
      children: [
        { id: "aud1-c2-1", name: "欢快BGM" },
        { id: "aud1-c2-2", name: "品牌调性" },
      ]
    },
    {
      id: "aud2-c1",
      name: "宠物食品",
      children: [
        { id: "aud2-c1-1", name: "猫粮" },
        { id: "aud2-c1-2", name: "狗粮" },
      ]
    },
    {
      id: "aud2-c2",
      name: "婴童用品",
      children: [
        { id: "aud2-c2-1", name: "促销大促" },
        { id: "aud2-c2-2", name: "轻快衬乐" },
      ]
    },
    {
      id: "aud3-c1",
      name: "休闲零食",
      children: [
        { id: "aud3-c1-1", name: "吃播咔嚓声" },
        { id: "aud3-c1-2", name: "欢快节奏音效" },
      ]
    },
  ],
  "素材": [
    {
      id: "mat-c1",
      name: "美妆",
      children: [
        { id: "mat-c1-1", name: "美妆原片" },
        { id: "mat-c1-2", name: "高清白底图" },
        { id: "mat-c1-3", name: "特写质感镜头" },
      ]
    },
    {
      id: "mat-c2",
      name: "服饰内衣",
      children: [
        { id: "mat-c2-1", name: "服饰穿搭" },
        { id: "mat-c2-2", name: "走秀动态视频" },
        { id: "mat-c2-3", name: "面料细节展示" },
      ]
    },
    {
      id: "mat-c3",
      name: "个护家清",
      children: [
        { id: "mat-c3-1", name: "洗护展示" },
        { id: "mat-c3-2", name: "对比体验" },
      ]
    },
  ],
  "图片": [
    {
      id: "img-c1",
      name: "电商营销",
      children: [
        { id: "img-c1-1", name: "主图宣发" },
        { id: "img-c1-2", name: "首图爆款精选" },
        { id: "img-c1-3", name: "利益点海报" },
      ]
    },
    {
      id: "img-c2",
      name: "详情页套图",
      children: [
        { id: "img-c2-1", name: "长图拼接组" },
        { id: "img-c2-2", name: "产品规格切点" },
      ]
    },
    {
      id: "img-c3",
      name: "模特切片",
      children: [
        { id: "img-c3-1", name: "正面展示图" },
        { id: "img-c3-2", name: "背面细节图" },
      ]
    },
  ],
};

// Keep existing resource examples represented in the management catalog.
const RESOURCE_CATEGORY_PATHS: Record<string, string[][]> = {
  "成片": [
    [
      "女士内衣",
      ""
    ],
    [
      "草本初色内衣",
      ""
    ],
    [
      "女士睡衣",
      ""
    ],
    [
      "塑身裤",
      ""
    ],
    [
      "女士内裤",
      "高弹透气"
    ],
    [
      "4199美肤衣",
      ""
    ],
    [
      "保暖内衣",
      ""
    ],
    [
      "秒缇8024前扣内衣",
      ""
    ],
    [
      "男士内裤",
      ""
    ],
    [
      "少女内衣",
      ""
    ],
    [
      "8811纯棉",
      "情侣套盒"
    ],
    [
      "草本8018",
      ""
    ],
    [
      "美妆护肤",
      "面部护肤"
    ],
    [
      "日化美妆",
      "日常彩妆"
    ],
    [
      "日化美妆",
      "身体护理"
    ],
    [
      "数码科技",
      "智能手表"
    ],
    [
      "数码科技",
      "头戴耳机"
    ],
    [
      "数码科技",
      "智能手机"
    ],
    [
      "数码科技",
      "办公键盘"
    ],
    [
      "鞋履服饰",
      "通勤女装"
    ],
    [
      "鞋履服饰",
      "运动鞋履"
    ]
  ],
  "素材": [
    [
      "女士内衣",
      ""
    ],
    [
      "草本初色内衣",
      ""
    ],
    [
      "女士睡衣",
      ""
    ],
    [
      "塑身裤",
      ""
    ],
    [
      "女士内裤",
      ""
    ],
    [
      "4199美肤衣",
      ""
    ],
    [
      "保暖内衣",
      ""
    ],
    [
      "秒缇8024前扣内衣",
      ""
    ],
    [
      "男士内裤",
      ""
    ],
    [
      "少女内衣",
      ""
    ],
    [
      "8811纯棉",
      ""
    ],
    [
      "草本8018",
      ""
    ]
  ],
  "图片": [
    [
      "美妆护肤",
      "致上旗舰店"
    ],
    [
      "服饰内衣",
      "致上旗舰店"
    ],
    [
      "宣发图库",
      "云享专营店"
    ],
    [
      "资质文件",
      "云享专营店"
    ],
    [
      "宣发图库",
      "致上旗舰店"
    ],
    [
      "美妆护肤",
      "云享专营店"
    ]
  ],
  "音频": [
    [
      "美容美体",
      "医疗机构"
    ],
    [
      "美容美体",
      "警示解说"
    ],
    [
      "美容美体",
      "短对话"
    ],
    [
      "个人护理",
      "口播切片"
    ],
    [
      "美妆护肤",
      "洗护系列"
    ],
    [
      "休闲零食",
      "促销大促"
    ],
    [
      "服饰内衣",
      "品牌调性"
    ],
    [
      "家居优选",
      "趣味音效"
    ]
  ],
  "脚本": [
    [
      "个人护理",
      "洗发护发"
    ],
    [
      "美妆护肤",
      "卸妆清洁"
    ],
    [
      "美妆护肤",
      "面部精华"
    ],
    [
      "童装/童鞋",
      "女装外套"
    ]
  ]
};
for (const [type, paths] of Object.entries(RESOURCE_CATEGORY_PATHS)) {
  for (const [primaryName, secondaryName] of paths) {
    let primary = INITIAL_CATEGORIES[type].find(item => item.name === primaryName);
    if (!primary) {
      primary = { id: `category-${type}-${INITIAL_CATEGORIES[type].length + 1}`, name: primaryName, children: [] };
      INITIAL_CATEGORIES[type].push(primary);
    }
    if (secondaryName && !primary.children.some(item => item.name === secondaryName)) {
      primary.children.push({ id: `${primary.id}-child-${primary.children.length + 1}`, name: secondaryName });
    }
  }
}

// Start from the same taxonomy, with independent IDs and future edits.
INITIAL_CATEGORIES["第三方"] = INITIAL_CATEGORIES["素材"].map(parent => ({
  ...parent, id: `third-${parent.id}`,
  children: parent.children.map(child => ({ ...child, id: `third-${child.id}` })),
}));
