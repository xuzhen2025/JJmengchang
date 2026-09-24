export interface DeptNode {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  manager: string;
  phone: string;
  memberCount: number;
  quota: number;
  levelType?: "company" | "department" | "group";
  type: "投放组" | "内容组" | "剪辑组" | "编导组" | "运营组" | "直播组" | "行政财务" | "综合部门" | "公司";
  description: string;
  createdAt: string;
  status: "active" | "disabled";
}

export interface AccountMember {
  id: string;
  employeeNo: string;
  name: string;
  avatar?: string;
  phone: string;
  email: string;
  deptId: string;
  secondaryDeptIds?: string[];
  roleIds: string[];
  roleName: string;
  dataScope: "all" | "dept_tree" | "self";
  status: "normal" | "disabled" | "pending" | "suspended" | "retired" | "bound";
  boundAccount?: string;
  createdAt: string;
  lastActiveAt: string;
  logCount: number;
  remark?: string;
}

export const ANALYTICS_DEMO_MEMBERS: AccountMember[] = [
  ["mem_demo_1", "刘小青", "dept_1_1", "role_dept_head", "分组负责人"],
  ["mem_demo_2", "王剪辑", "dept_1_1", "role_editor", "视频剪辑师"],
  ["mem_demo_3", "赵千川", "dept_1_2", "role_pitcher", "广告投手"],
  ["mem_demo_4", "周雅", "dept_1_2", "role_editor", "视频剪辑师"],
  ["mem_demo_5", "孙剧本", "dept_3_1", "role_editor", "编导"],
  ["mem_demo_6", "徐振", "dept_3_1", "role_editor", "视频剪辑师"],
].map(([id, name, deptId, roleId, roleName], index) => ({
  id, name, deptId, roleIds: [roleId], roleName, employeeNo: `ZS-${String(9 + index).padStart(3, "0")}`,
  phone: "", email: "", dataScope: "self", status: "normal", createdAt: "2026-05-08",
  lastActiveAt: "2026-09-14 09:20", logCount: 14 + index * 3, remark: "",
}));

export const INITIAL_DEPTS: DeptNode[] = [
  {
    id: "dept_root",
    name: "梦畅AIGC",
    code: "HQ-001",
    parentId: null,
    manager: "张总 (CEO / 创始人)",
    phone: "13800138000",
    memberCount: 28,
    quota: 50,
    levelType: "company",
    type: "公司",
    description: "梦畅AIGC企业最高控制与全局调度中心",
    createdAt: "2025-12-16",
    status: "active"
  },
  {
    id: "dept_1",
    name: "电商投放一部",
    code: "MKT-01",
    parentId: "dept_root",
    manager: "王大锤",
    phone: "13912345678",
    memberCount: 8,
    quota: 15,
    levelType: "department",
    type: "投放组",
    description: "主攻千川女装与珠宝类目爆款直接投放",
    createdAt: "2026-01-10",
    status: "active"
  },
  {
    id: "dept_1_1",
    name: "女装千川放量组",
    code: "MKT-01-A",
    parentId: "dept_1",
    manager: "刘小青",
    phone: "13911112222",
    memberCount: 4,
    quota: 8,
    levelType: "group",
    type: "投放组",
    description: "专注女装类目高ROI千川跑量与人群包画像定向",
    createdAt: "2026-03-10",
    status: "active"
  },
  {
    id: "dept_1_2",
    name: "美妆珠宝爆款组",
    code: "MKT-01-B",
    parentId: "dept_1",
    manager: "赵千川",
    phone: "13933334444",
    memberCount: 4,
    quota: 7,
    levelType: "group",
    type: "投放组",
    description: "主攻美妆与高客单珠宝ROI放量",
    createdAt: "2026-03-12",
    status: "active"
  },
  {
    id: "dept_2",
    name: "品牌效果投放部",
    code: "MKT-02",
    parentId: "dept_root",
    manager: "李阿牛",
    phone: "13788889999",
    memberCount: 6,
    quota: 10,
    levelType: "department",
    type: "投放组",
    description: "负责腾讯AD视频号与快手磁力金牛放量",
    createdAt: "2026-02-01",
    status: "active"
  },
  {
    id: "dept_3",
    name: "AIGC爆款内容拆解部",
    code: "CNT-01",
    parentId: "dept_root",
    manager: "陈编导",
    phone: "13655554444",
    memberCount: 7,
    quota: 12,
    levelType: "department",
    type: "编导组",
    description: "负责千川热门对标视频拆解与AI画质/脚本复刻",
    createdAt: "2026-02-15",
    status: "active"
  },
  {
    id: "dept_3_1",
    name: "千川剧本拆解小组",
    code: "CNT-01-A",
    parentId: "dept_3",
    manager: "孙剧本",
    phone: "13611223344",
    memberCount: 3,
    quota: 6,
    levelType: "group",
    type: "编导组",
    description: "对标千川Top100爆款前3秒黄金Hook拆解",
    createdAt: "2026-04-01",
    status: "active"
  },
  {
    id: "dept_4",
    name: "视频智能剪辑中心",
    code: "EDT-01",
    parentId: "dept_root",
    manager: "张剪辑",
    phone: "13566667777",
    memberCount: 5,
    quota: 10,
    levelType: "department",
    type: "剪辑组",
    description: "HappyHorse 与 Seedance 2.0 AI批量精剪与首尾帧微调",
    createdAt: "2026-03-01",
    status: "active"
  },
  {
    id: "dept_5",
    name: "达人代运营项目部",
    code: "KOL-01",
    parentId: "dept_root",
    manager: "张小花",
    phone: "13422223333",
    memberCount: 2,
    quota: 8,
    levelType: "department",
    type: "运营组",
    description: "KOL达人招募、切片授权与直播间分发",
    createdAt: "2026-04-12",
    status: "active"
  }
];

export const INITIAL_MEMBERS: AccountMember[] = [
  {
    id: "mem_1001",
    employeeNo: "ZS-001",
    name: "张总",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    phone: "13800138000",
    email: "zhang@dreamchang.com",
    deptId: "dept_root",
    roleIds: ["role_super_admin"],
    roleName: "超级管理员",
    dataScope: "all",
    status: "normal",
    createdAt: "2025-12-16",
    lastActiveAt: "2026-07-24 20:15",
    logCount: 142,
    remark: "创始人 & CEO"
  },
  {
    id: "mem_1002",
    employeeNo: "ZS-002",
    name: "王大锤",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop",
    phone: "13912345678",
    email: "wang@dreamchang.com",
    deptId: "dept_1",
    roleIds: ["role_dept_head"],
    roleName: "部门负责人/主管",
    dataScope: "dept_tree",
    status: "normal",
    createdAt: "2026-01-10",
    lastActiveAt: "2026-07-24 19:40",
    logCount: 89,
    remark: "电商投放一部总监"
  },
  {
    id: "mem_1003",
    employeeNo: "ZS-003",
    name: "张小花",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop",
    phone: "13422223333",
    email: "zhangxh@dreamchang.com",
    deptId: "dept_1",
    roleIds: ["role_pitcher"],
    roleName: "广告投手 (Media Buyer)",
    dataScope: "self",
    status: "normal",
    createdAt: "2026-01-12",
    lastActiveAt: "2026-07-24 18:22",
    logCount: 64,
    remark: "千川爆款女装主投手"
  },
  {
    id: "mem_1004",
    employeeNo: "ZS-004",
    name: "李阿牛",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&h=80&fit=crop",
    phone: "13788889999",
    email: "li@dreamchang.com",
    deptId: "dept_2",
    roleIds: ["role_dept_head"],
    roleName: "部门负责人/主管",
    dataScope: "dept_tree",
    status: "normal",
    createdAt: "2026-02-01",
    lastActiveAt: "2026-07-24 17:05",
    logCount: 51,
    remark: "腾讯与快手渠道负责人"
  },
  {
    id: "mem_1005",
    employeeNo: "ZS-005",
    name: "赵铁柱",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop",
    phone: "13511112222",
    email: "zhao@dreamchang.com",
    deptId: "dept_2",
    roleIds: ["role_pitcher"],
    roleName: "广告投手 (Media Buyer)",
    dataScope: "self",
    status: "normal",
    createdAt: "2026-02-10",
    lastActiveAt: "2026-07-24 15:30",
    logCount: 38
  },
  {
    id: "mem_1006",
    employeeNo: "ZS-006",
    name: "陈编导",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    phone: "13655554444",
    email: "chen@dreamchang.com",
    deptId: "dept_3",
    roleIds: ["role_editor"],
    roleName: "AI视频剪辑师",
    dataScope: "dept_tree",
    status: "normal",
    createdAt: "2026-02-15",
    lastActiveAt: "2026-07-24 14:10",
    logCount: 72,
    remark: "负责脚本拆解与爆款Hook研究"
  },
  {
    id: "mem_1007",
    employeeNo: "ZS-007",
    name: "刘财务",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    phone: "13977778888",
    email: "liu@dreamchang.com",
    deptId: "dept_root",
    roleIds: ["role_analyst"],
    roleName: "数据分析与财务观察员",
    dataScope: "all",
    status: "normal",
    createdAt: "2026-03-01",
    lastActiveAt: "2026-07-23 16:45",
    logCount: 19,
    remark: "监控充值扣费与投放ROI"
  },
  {
    id: "mem_1008",
    employeeNo: "ZS-008",
    name: "孙实习",
    phone: "13899990000",
    email: "sun@dreamchang.com",
    deptId: "dept_4",
    roleIds: ["role_editor"],
    roleName: "AI视频剪辑师",
    dataScope: "self",
    status: "pending",
    createdAt: "2026-07-20",
    lastActiveAt: "尚未登录",
    logCount: 0,
    remark: "新邀请剪辑师，等待激活"
  },
  ...ANALYTICS_DEMO_MEMBERS
];
