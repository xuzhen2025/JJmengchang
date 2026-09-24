export const DERIVATIVE_ANALYTICS_EVENT = "mengchang-derivative-analytics";

export function openDerivativeAnalytics(derivativeId: string) {
  window.dispatchEvent(new CustomEvent(DERIVATIVE_ANALYTICS_EVENT, { detail: { derivativeId } }));
}
