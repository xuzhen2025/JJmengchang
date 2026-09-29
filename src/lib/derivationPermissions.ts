export const DERIVATION_PERMISSION = "uc_derivation_new";

// 衍生能力 = 衍生新视频 或 衍生视频并推送 任一权限
export function canUseDerivations(actor: { permissions: readonly string[] }) {
  return actor.permissions.includes("uc_derivation_new") || actor.permissions.includes("uc_derivation_push");
}

export function requireDerivationPermission(actor: { permissions: readonly string[] }) {
  if (!canUseDerivations(actor)) throw new Error("暂无衍生视频权限");
}
