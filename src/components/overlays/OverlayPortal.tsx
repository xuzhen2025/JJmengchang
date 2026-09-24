import React, { forwardRef } from "react";
import { createPortal } from "react-dom";

export type OverlayLayer = "popover" | "drawer" | "modal" | "dialog" | "toast";

export const OVERLAY_Z_INDEX: Record<OverlayLayer, number> = {
  drawer: 70,
  modal: 1200,
  dialog: 1300,
  popover: 1350,
  toast: 1400
};

interface OverlayPortalProps extends React.HTMLAttributes<HTMLDivElement> {
  layer?: OverlayLayer;
}

const OverlayPortal = forwardRef<HTMLDivElement, OverlayPortalProps>(function OverlayPortal(
  { layer = "modal", style, ...props },
  ref
) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      data-overlay-layer={layer}
      {...props}
      style={{ ...style, zIndex: OVERLAY_Z_INDEX[layer] }}
    />,
    document.body
  );
});

export default OverlayPortal;
