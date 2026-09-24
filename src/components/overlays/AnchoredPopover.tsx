import React, { RefObject, useLayoutEffect, useRef, useState } from "react";
import OverlayPortal from "./OverlayPortal";

type PopoverAlign = "start" | "center" | "end";
type PopoverSide = "bottom" | "top";

interface AnchoredPopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  getAnchorRect?: () => DOMRect | DOMRectReadOnly | null;
  children: React.ReactNode;
  className?: string;
  align?: PopoverAlign;
  side?: PopoverSide;
  gap?: number;
  viewportPadding?: number;
  width?: number | string;
  maxHeight?: number;
  matchAnchorWidth?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onPointerEnter?: React.PointerEventHandler<HTMLDivElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLDivElement>;
  onClose: () => void;
}

interface PopoverPosition {
  left: number;
  top: number;
  maxHeight: number;
  anchorWidth: number;
  visibility: "hidden" | "visible";
}

export default function AnchoredPopover({
  anchorRef,
  getAnchorRect,
  children,
  className = "",
  align = "start",
  side = "bottom",
  gap = 8,
  viewportPadding = 12,
  width,
  maxHeight,
  matchAnchorWidth = false,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onClose
}: AnchoredPopoverProps) {
  const [popover, setPopover] = useState<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const getAnchorRectRef = useRef(getAnchorRect);
  const [position, setPosition] = useState<PopoverPosition>({
    left: 0,
    top: 0,
    maxHeight: 0,
    anchorWidth: 0,
    visibility: "hidden"
  });

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    getAnchorRectRef.current = getAnchorRect;
  }, [getAnchorRect, onClose]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !popover) return;

    let animationFrame = 0;
    const updatePosition = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        if (!anchor.isConnected || !popover.isConnected) return;

        const anchorRect = getAnchorRectRef.current?.() || anchor.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const availableBelow = viewportHeight - anchorRect.bottom - gap - viewportPadding;
        const availableAbove = anchorRect.top - gap - viewportPadding;
        const shouldFlip = side === "bottom"
          ? popoverRect.height > availableBelow && availableAbove > availableBelow
          : popoverRect.height > availableAbove && availableBelow > availableAbove;
        const resolvedSide: PopoverSide = shouldFlip
          ? (side === "bottom" ? "top" : "bottom")
          : side;
        const availableHeight = resolvedSide === "bottom" ? availableBelow : availableAbove;
        const maxHeight = Math.max(120, availableHeight);
        const renderedHeight = Math.min(popoverRect.height, maxHeight);

        let left = anchorRect.left;
        if (align === "center") left = anchorRect.left + (anchorRect.width - popoverRect.width) / 2;
        if (align === "end") left = anchorRect.right - popoverRect.width;
        left = Math.min(
          Math.max(left, viewportPadding),
          Math.max(viewportPadding, viewportWidth - popoverRect.width - viewportPadding)
        );

        const naturalTop = resolvedSide === "bottom"
          ? anchorRect.bottom + gap
          : anchorRect.top - gap - renderedHeight;
        const top = Math.min(
          Math.max(naturalTop, viewportPadding),
          Math.max(viewportPadding, viewportHeight - renderedHeight - viewportPadding)
        );

        setPosition({ left, top, maxHeight, anchorWidth: anchorRect.width, visibility: "visible" });
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchor.contains(target) && !popover.contains(target)) onCloseRef.current();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(anchor);
    resizeObserver.observe(popover);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
      resizeObserver.disconnect();
    };
  }, [align, anchorRef, gap, popover, side, viewportPadding]);

  return (
    <OverlayPortal
      ref={setPopover}
      layer="popover"
      role="dialog"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={`fixed overflow-y-auto overscroll-contain ${className}`}
      style={{
        left: position.left,
        top: position.top,
        width,
        minWidth: matchAnchorWidth ? position.anchorWidth : undefined,
        maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
        maxHeight: position.maxHeight
          ? (maxHeight === undefined ? position.maxHeight : Math.min(position.maxHeight, maxHeight))
          : (maxHeight ?? `calc(100vh - ${viewportPadding * 2}px)`),
        visibility: position.visibility
      }}
    >
      {children}
    </OverlayPortal>
  );
}
