export const DERIVATION_PERMISSION = "uc_derivation";

export function canUseDerivations(actor: { permissions: readonly string[] }) {
  return actor.permissions.includes(DERIVATION_PERMISSION);
}

export function requireDerivationPermission(actor: { permissions: readonly string[] }) {
  if (!canUseDerivations(actor)) throw new Error("暂无衍生视频权限");
}
