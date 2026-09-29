// 资源归属（AUTH-03 演示用）：给资源库 mock 数据按序号分配稳定归属，
// 归属借用成员表（当前用户 mem_prototype_operator/dept_1_1、同组、同部门其他组、其他部门），
// 使"仅本人/本部门及下级/全部"三种数据范围产生可见差异。

export interface ResourceOwner {
  creatorId: string;
  creatorDeptId: string;
}

// 归属池：约 1/5 归当前用户（dept_1_1），1/5 归同组，1/5 归同部门其他组，2/5 归其他部门
export const OWNER_POOL: ResourceOwner[] = [
  { creatorId: "mem_prototype_operator", creatorDeptId: "dept_1_1" }, // 当前用户（普通用户）
  { creatorId: "mem_demo_1", creatorDeptId: "dept_1_1" },             // 同分组
  { creatorId: "mem_demo_3", creatorDeptId: "dept_1_2" },             // 同部门其他分组
  { creatorId: "mem_demo_5", creatorDeptId: "dept_3_1" },             // 其他部门
  { creatorId: "mem_demo_6", creatorDeptId: "dept_3_1" },             // 其他部门
];

export const ownerOf = (index: number): ResourceOwner => OWNER_POOL[index % OWNER_POOL.length];

// 给列表数据按索引附加归属字段（不改原始数据结构）
export const withOwners = <T extends object>(items: T[]): (T & ResourceOwner)[] =>
  items.map((item, index) => ({ ...item, ...ownerOf(index) }));
