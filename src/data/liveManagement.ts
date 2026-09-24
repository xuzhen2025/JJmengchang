export type LiveRole = "主播" | "助播" | "场控" | "中控" | "投手" | "部门管理员";
export type AccountStatus = "已绑定" | "首次同步中" | "授权即将到期" | "已解绑";
export type SessionStatus = "直播中" | "已结束" | "数据同步中" | "数据异常";
export type EmployeeStatus = "在职" | "已停用" | "已离职";
export type ShiftStatus = "待确认" | "已确认" | "已取消";

export interface LiveAccount {
  id: string;
  name: string;
  handle: string;
  manager: string;
  status: AccountStatus;
  lastSync: string;
  likes: number;
  followers: number;
  avatarTone: string;
}

export interface LiveRoom {
  id: string;
  accountId: string;
  name: string;
  roomNo: string;
}

export interface LiveSession {
  id: string;
  accountId: string;
  roomId: string;
  title: string;
  hostId: string;
  startedAt: string;
  durationMinutes: number;
  viewers: number;
  exposure: number;
  peakOnline: number;
  avgOnline: number;
  avgStaySeconds: number;
  newFollowers: number;
  comments: number;
  likes: number;
  shares: number;
  productClicks: number;
  orders: number;
  revenue: number;
  spend: number;
  sales: number;
  presaleOrders: number;
  directOrders: number;
  roi: number;
  conversionRate: number;
  refundRate: number;
  status: SessionStatus;
  dataNote?: string;
  productIds: string[];
}

export interface EmployeeAssignment {
  accountId: string;
  role: LiveRole;
}

export interface LiveEmployee {
  id: string;
  name: string;
  login: string;
  phone: string;
  employment: "全职" | "兼职";
  joinDate: string;
  status: EmployeeStatus;
  nightShift: boolean;
  assignments: EmployeeAssignment[];
}

export interface LiveShift {
  id: string;
  accountId: string;
  roomId: string;
  date: string;
  start: number;
  end: number;
  title: string;
  participantIds: string[];
  status: ShiftStatus;
  invalidReason?: string;
  updatedAt: string;
  operator: string;
}

export interface LiveStore {
  id: string;
  accountId: string;
  name: string;
  platform: "抖店" | "快手小店";
  status: "已授权" | "即将到期" | "已失效";
  authorizedAt: string;
  expiresAt: string;
}

export interface LiveProduct {
  id: string;
  accountId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  warningStock: number;
  sales: number;
  gmv: number;
  refundRate: number;
  status: "在售" | "已售罄" | "已下架";
}

export interface ReductionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  roles: string;
  joinDate: string;
  reducedAt: string;
  reason: string;
  lastWorkDate: string;
  operator: string;
  note: string;
}

export const INITIAL_LIVE_ACCOUNTS: LiveAccount[] = [
  { id: "acc-1", name: "梦畅美妆旗舰店", handle: "MCBeauty_2026", manager: "徐振", status: "已绑定", lastSync: "今天 10:26", likes: 286400, followers: 128600, avatarTone: "bg-violet-600" },
  { id: "acc-2", name: "梦畅服饰直播号", handle: "MCFashion_Live", manager: "沈念", status: "已绑定", lastSync: "今天 10:24", likes: 184600, followers: 93600, avatarTone: "bg-rose-500" },
  { id: "acc-3", name: "梦畅家居好物", handle: "MCHome_Select", manager: "梁浩然", status: "授权即将到期", lastSync: "昨天 23:58", likes: 93200, followers: 48100, avatarTone: "bg-cyan-600" },
  { id: "acc-4", name: "梦畅个护精选", handle: "MCCare_Select", manager: "汤小真", status: "首次同步中", lastSync: "等待首次同步", likes: 0, followers: 12600, avatarTone: "bg-amber-500" },
];

export const INITIAL_LIVE_ROOMS: LiveRoom[] = [
  { id: "room-1", accountId: "acc-1", name: "美妆旗舰店 1 号间", roomNo: "MC-BEAUTY-01" },
  { id: "room-2", accountId: "acc-1", name: "美妆新品测试间", roomNo: "MC-BEAUTY-02" },
  { id: "room-3", accountId: "acc-1", name: "品牌会员专享间", roomNo: "MC-BEAUTY-03" },
  { id: "room-4", accountId: "acc-2", name: "服饰穿搭 1 号间", roomNo: "MC-FASHION-01" },
  { id: "room-5", accountId: "acc-2", name: "服饰清仓专场间", roomNo: "MC-FASHION-02" },
  { id: "room-6", accountId: "acc-3", name: "家居生活馆 1 号间", roomNo: "MC-HOME-01" },
  { id: "room-7", accountId: "acc-4", name: "个护精选 1 号间", roomNo: "MC-CARE-01" },
];

export const INITIAL_EMPLOYEES: LiveEmployee[] = [
  { id: "emp-1", name: "徐云卿", login: "xuyunqing", phone: "138****5678", employment: "全职", joinDate: "2025-03-15", status: "在职", nightShift: true, assignments: [{ accountId: "acc-1", role: "主播" }, { accountId: "acc-2", role: "助播" }] },
  { id: "emp-2", name: "沈念", login: "shennian", phone: "139****2345", employment: "全职", joinDate: "2025-05-20", status: "在职", nightShift: true, assignments: [{ accountId: "acc-2", role: "主播" }] },
  { id: "emp-3", name: "张雨晴", login: "zhangyuqing", phone: "137****8901", employment: "兼职", joinDate: "2025-08-10", status: "在职", nightShift: false, assignments: [{ accountId: "acc-3", role: "主播" }, { accountId: "acc-1", role: "助播" }] },
  { id: "emp-4", name: "谭明珠", login: "tanmingzhu", phone: "136****4310", employment: "全职", joinDate: "2025-11-02", status: "在职", nightShift: true, assignments: [{ accountId: "acc-1", role: "助播" }, { accountId: "acc-2", role: "中控" }] },
  { id: "emp-5", name: "冯浩伦", login: "fenghaolun", phone: "135****2266", employment: "全职", joinDate: "2026-01-08", status: "在职", nightShift: true, assignments: [{ accountId: "acc-1", role: "场控" }, { accountId: "acc-3", role: "场控" }] },
  { id: "emp-6", name: "刘弯", login: "liuwan", phone: "133****9072", employment: "兼职", joinDate: "2026-02-18", status: "在职", nightShift: false, assignments: [{ accountId: "acc-2", role: "投手" }] },
  { id: "emp-7", name: "梁浩然", login: "lianghaoran", phone: "132****6348", employment: "全职", joinDate: "2025-09-21", status: "在职", nightShift: true, assignments: [{ accountId: "acc-3", role: "部门管理员" }, { accountId: "acc-1", role: "投手" }] },
  { id: "emp-8", name: "霍小棠", login: "huoxiaotang", phone: "131****1850", employment: "兼职", joinDate: "2026-07-12", status: "已停用", nightShift: false, assignments: [{ accountId: "acc-2", role: "助播" }] },
  { id: "former-1", name: "周可欣", login: "zhoukexin", phone: "130****5294", employment: "全职", joinDate: "2025-06-12", status: "已离职", nightShift: false, assignments: [{ accountId: "acc-2", role: "助播" }] },
];

export const INITIAL_PRODUCTS: LiveProduct[] = [
  { id: "prod-1", accountId: "acc-1", name: "焕亮修护精华液 30ml", category: "美妆护肤", price: 199, stock: 286, warningStock: 100, sales: 1468, gmv: 292132, refundRate: 2.8, status: "在售" },
  { id: "prod-2", accountId: "acc-1", name: "玻尿酸深润面膜 20 片", category: "美妆护肤", price: 129, stock: 78, warningStock: 100, sales: 1126, gmv: 145254, refundRate: 1.9, status: "在售" },
  { id: "prod-3", accountId: "acc-1", name: "净透卸妆油双支装", category: "美妆护肤", price: 159, stock: 0, warningStock: 80, sales: 936, gmv: 148824, refundRate: 3.4, status: "已售罄" },
  { id: "prod-4", accountId: "acc-2", name: "高腰显瘦直筒西裤", category: "服饰内衣", price: 169, stock: 352, warningStock: 120, sales: 1328, gmv: 224432, refundRate: 7.6, status: "在售" },
  { id: "prod-5", accountId: "acc-2", name: "轻暖无痕打底衫", category: "服饰内衣", price: 139, stock: 164, warningStock: 80, sales: 986, gmv: 137054, refundRate: 5.2, status: "在售" },
  { id: "prod-6", accountId: "acc-3", name: "多功能厨房清洁套装", category: "家居日用", price: 89, stock: 416, warningStock: 120, sales: 742, gmv: 66038, refundRate: 1.6, status: "在售" },
  { id: "prod-7", accountId: "acc-3", name: "可折叠分区收纳箱", category: "家居日用", price: 109, stock: 95, warningStock: 100, sales: 638, gmv: 69542, refundRate: 2.1, status: "在售" },
  { id: "prod-8", accountId: "acc-4", name: "氨基酸净澈洗发露", category: "个人护理", price: 99, stock: 320, warningStock: 100, sales: 0, gmv: 0, refundRate: 0, status: "在售" },
  { id: "prod-9", accountId: "acc-2", name: "复古格纹羊毛短外套", category: "服饰内衣", price: 329, stock: 46, warningStock: 60, sales: 418, gmv: 137522, refundRate: 8.2, status: "已下架" },
];

export const INITIAL_SESSIONS: LiveSession[] = [
  { id: "live-10086", accountId: "acc-1", roomId: "room-1", title: "秋季焕亮精华首发专场", hostId: "emp-1", startedAt: "2026-09-08 09:30", durationMinutes: 222, viewers: 158620, exposure: 426800, peakOnline: 8920, avgOnline: 5236, avgStaySeconds: 222, newFollowers: 3286, comments: 18420, likes: 68420, shares: 2168, productClicks: 28640, orders: 386, revenue: 92680, spend: 19220, sales: 612, presaleOrders: 86, directOrders: 300, roi: 4.82, conversionRate: 4.18, refundRate: 2.6, status: "直播中", productIds: ["prod-1", "prod-2", "prod-3"] },
  { id: "live-10085", accountId: "acc-1", roomId: "room-2", title: "面膜囤货节会员返场", hostId: "emp-1", startedAt: "2026-09-07 19:00", durationMinutes: 246, viewers: 136800, exposure: 382100, peakOnline: 7640, avgOnline: 4680, avgStaySeconds: 208, newFollowers: 2810, comments: 15680, likes: 59300, shares: 1870, productClicks: 23860, orders: 342, revenue: 81620, spend: 17430, sales: 548, presaleOrders: 74, directOrders: 268, roi: 4.68, conversionRate: 3.96, refundRate: 2.2, status: "已结束", productIds: ["prod-2", "prod-1"] },
  { id: "live-10084", accountId: "acc-1", roomId: "room-3", title: "品牌会员卸妆专享", hostId: "emp-3", startedAt: "2026-09-06 14:00", durationMinutes: 178, viewers: 92800, exposure: 264500, peakOnline: 5120, avgOnline: 3380, avgStaySeconds: 186, newFollowers: 1640, comments: 9460, likes: 38200, shares: 1024, productClicks: 15420, orders: 214, revenue: 48680, spend: 10860, sales: 326, presaleOrders: 38, directOrders: 176, roi: 4.48, conversionRate: 3.52, refundRate: 3.1, status: "已结束", productIds: ["prod-3", "prod-1"] },
  { id: "live-10083", accountId: "acc-1", roomId: "room-1", title: "早八通勤底妆实测", hostId: "emp-1", startedAt: "2026-09-05 08:00", durationMinutes: 125, viewers: 68400, exposure: 195600, peakOnline: 4280, avgOnline: 2760, avgStaySeconds: 164, newFollowers: 986, comments: 6820, likes: 25600, shares: 780, productClicks: 10860, orders: 156, revenue: 36480, spend: 0, sales: 248, presaleOrders: 24, directOrders: 132, roi: 0, conversionRate: 3.21, refundRate: 2.4, status: "已结束", productIds: ["prod-1", "prod-2"] },
  { id: "live-20041", accountId: "acc-2", roomId: "room-4", title: "秋季通勤衣橱上新", hostId: "emp-2", startedAt: "2026-09-08 10:00", durationMinutes: 198, viewers: 128600, exposure: 356200, peakOnline: 7210, avgOnline: 4380, avgStaySeconds: 198, newFollowers: 2180, comments: 12680, likes: 52100, shares: 1680, productClicks: 22460, orders: 328, revenue: 86420, spend: 16820, sales: 486, presaleOrders: 68, directOrders: 260, roi: 5.14, conversionRate: 4.02, refundRate: 6.8, status: "直播中", productIds: ["prod-4", "prod-5"] },
  { id: "live-20040", accountId: "acc-2", roomId: "room-5", title: "无痕打底衫清仓返场", hostId: "emp-2", startedAt: "2026-09-07 20:00", durationMinutes: 232, viewers: 116400, exposure: 329800, peakOnline: 6480, avgOnline: 3960, avgStaySeconds: 184, newFollowers: 1860, comments: 11240, likes: 47600, shares: 1420, productClicks: 19680, orders: 286, revenue: 71860, spend: 15480, sales: 422, presaleOrders: 56, directOrders: 230, roi: 4.64, conversionRate: 3.72, refundRate: 5.6, status: "已结束", productIds: ["prod-5", "prod-4"] },
  { id: "live-20039", accountId: "acc-2", roomId: "room-4", title: "高腰西裤版型专测", hostId: "emp-2", startedAt: "2026-09-06 19:30", durationMinutes: 205, viewers: 98600, exposure: 286700, peakOnline: 5860, avgOnline: 3540, avgStaySeconds: 176, newFollowers: 1540, comments: 9640, likes: 39400, shares: 1160, productClicks: 16920, orders: 242, revenue: 62480, spend: 13820, sales: 358, presaleOrders: 42, directOrders: 200, roi: 4.52, conversionRate: 3.48, refundRate: 7.2, status: "数据同步中", dataNote: "订单明细仍在同步，预计 3 分钟后补齐。", productIds: ["prod-4"] },
  { id: "live-30018", accountId: "acc-3", roomId: "room-6", title: "厨房焕新清洁专场", hostId: "emp-3", startedAt: "2026-09-07 14:00", durationMinutes: 186, viewers: 74600, exposure: 216800, peakOnline: 4120, avgOnline: 2680, avgStaySeconds: 168, newFollowers: 1120, comments: 7240, likes: 28600, shares: 860, productClicks: 12680, orders: 188, revenue: 42680, spend: 8460, sales: 302, presaleOrders: 34, directOrders: 154, roi: 5.04, conversionRate: 3.36, refundRate: 1.8, status: "已结束", productIds: ["prod-6", "prod-7"] },
  { id: "live-30017", accountId: "acc-3", roomId: "room-6", title: "收纳箱换季整理实测", hostId: "emp-3", startedAt: "2026-09-05 15:00", durationMinutes: 162, viewers: 58200, exposure: 174600, peakOnline: 3480, avgOnline: 2210, avgStaySeconds: 152, newFollowers: 820, comments: 5180, likes: 21400, shares: 620, productClicks: 9480, orders: 136, revenue: 28640, spend: 6120, sales: 214, presaleOrders: 22, directOrders: 114, roi: 4.68, conversionRate: 2.98, refundRate: 2.3, status: "数据异常", dataNote: "店铺授权即将到期，部分退款数据暂不可用。", productIds: ["prod-7", "prod-6"] },
];

export const INITIAL_SHIFTS: LiveShift[] = [
  { id: "shift-1", accountId: "acc-1", roomId: "room-1", date: "2026-09-08", start: 9, end: 13, title: "焕亮精华首发", participantIds: ["emp-1", "emp-4", "emp-5", "emp-7"], status: "已确认", updatedAt: "今天 08:32", operator: "徐振" },
  { id: "shift-2", accountId: "acc-2", roomId: "room-4", date: "2026-09-08", start: 14, end: 18, title: "秋季通勤上新", participantIds: ["emp-2", "emp-1", "emp-4", "emp-6"], status: "已确认", updatedAt: "昨天 19:18", operator: "沈念" },
  { id: "shift-3", accountId: "acc-1", roomId: "room-2", date: "2026-09-09", start: 9, end: 12, title: "面膜会员返场", participantIds: ["emp-1", "emp-3", "emp-5"], status: "待确认", updatedAt: "今天 09:10", operator: "徐振" },
  { id: "shift-4", accountId: "acc-3", roomId: "room-6", date: "2026-09-09", start: 14, end: 18, title: "厨房清洁实测", participantIds: ["emp-3", "emp-5", "emp-7"], status: "已确认", updatedAt: "昨天 16:42", operator: "梁浩然" },
  { id: "shift-5", accountId: "acc-2", roomId: "room-5", date: "2026-09-10", start: 19, end: 23, title: "无痕打底清仓", participantIds: ["emp-2", "emp-4", "emp-6"], status: "待确认", updatedAt: "今天 10:02", operator: "沈念" },
  { id: "shift-6", accountId: "acc-1", roomId: "room-3", date: "2026-09-11", start: 14, end: 17, title: "品牌会员专享", participantIds: ["emp-1", "emp-4", "emp-7"], status: "已确认", updatedAt: "09-07 15:20", operator: "徐振" },
  { id: "shift-7", accountId: "acc-3", roomId: "room-6", date: "2026-09-12", start: 10, end: 14, title: "换季收纳专场", participantIds: ["emp-3", "emp-5", "emp-7"], status: "待确认", updatedAt: "09-07 13:46", operator: "梁浩然" },
  { id: "shift-8", accountId: "acc-2", roomId: "room-4", date: "2026-09-13", start: 9, end: 13, title: "周末穿搭精选", participantIds: ["emp-2", "emp-1", "emp-6"], status: "已取消", invalidReason: "主播临时请假", updatedAt: "今天 09:48", operator: "沈念" },
];

export const INITIAL_STORES: LiveStore[] = [
  { id: "store-1", accountId: "acc-1", name: "梦畅美妆旗舰店", platform: "抖店", status: "已授权", authorizedAt: "2026-02-18", expiresAt: "2027-02-18" },
  { id: "store-2", accountId: "acc-2", name: "梦畅服饰旗舰店", platform: "抖店", status: "已授权", authorizedAt: "2026-03-06", expiresAt: "2027-03-06" },
  { id: "store-3", accountId: "acc-3", name: "梦畅家居生活馆", platform: "抖店", status: "即将到期", authorizedAt: "2025-09-22", expiresAt: "2026-09-22" },
  { id: "store-4", accountId: "acc-4", name: "梦畅个护精选店", platform: "抖店", status: "已失效", authorizedAt: "2025-08-28", expiresAt: "2026-08-28" },
];

export const INITIAL_REDUCTION_RECORDS: ReductionRecord[] = [
  { id: "reduce-1", employeeId: "former-1", employeeName: "周可欣", roles: "梦畅服饰直播号-助播", joinDate: "2025-06-12", reducedAt: "2026-08-26", reason: "主动离职", lastWorkDate: "2026-08-31", operator: "沈念", note: "已完成直播素材和排班交接" },
  { id: "reduce-2", employeeId: "former-2", employeeName: "陈一诺", roles: "梦畅美妆旗舰店-场控", joinDate: "2025-09-03", reducedAt: "2026-07-18", reason: "合同到期", lastWorkDate: "2026-07-22", operator: "徐振", note: "账号权限已回收" },
];

export const LIVE_ROLES: LiveRole[] = ["主播", "助播", "场控", "中控", "投手", "部门管理员"];

export const DEFAULT_ROLE_PERMISSIONS: Record<LiveRole, string[]> = {
  主播: ["查看我的直播号", "查看直播记录", "查看主播数据", "查看直播排班"],
  助播: ["查看我的直播号", "查看直播记录", "查看主播数据", "查看直播排班"],
  场控: ["查看运营控制台", "查看直播记录", "查看直播排班"],
  中控: ["查看运营控制台", "查看直播商品", "查看直播记录", "查看直播排班"],
  投手: ["查看投放数据", "查看直播记录", "查看主播数据"],
  部门管理员: ["直播管理全部功能", "部门配置", "店铺授权", "排班管理"],
};
