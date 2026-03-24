"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Maximize2, Eraser } from "lucide-react";

export type ShapeType = "checkmark" | "x-mark" | "rectangle" | "circle" | "triangle" | "arrow-left" | "arrow-right" | "line";

export interface OverlayItem {
  id: string;
  type: "signature" | "text" | "date" | "image" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  color?: string;
  page: number;
  shapeType?: ShapeType;
  strokeWidth?: number;
}

interface DraggableItemProps {
  item: OverlayItem;
  onUpdate: (id: string, updates: Partial<OverlayItem>) => void;
  onDelete: (id: string) => void;
  onRemoveBg?: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function DraggableItem({
  item,
  onUpdate,
  onDelete,
  onRemoveBg,
  containerRef,
}: DraggableItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  /** Convert a viewport mouse position to the container's local coordinate space */
  const viewportToLocal = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: clientX, y: clientY };
      const rect = container.getBoundingClientRect();
      // rect includes the CSS scale transform, so:
      // scale = rect.width / container.clientWidth
      const scaleX = rect.width / container.clientWidth;
      const scaleY = rect.height / container.clientHeight;
      return {
        x: (clientX - rect.left) / scaleX,
        y: (clientY - rect.top) / scaleY,
      };
    },
    [containerRef]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const local = viewportToLocal(e.clientX, e.clientY);
      dragOffset.current = {
        x: local.x - item.x,
        y: local.y - item.y,
      };
      setIsDragging(true);
    },
    [item.x, item.y, viewportToLocal]
  );

  const handleResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const local = viewportToLocal(e.clientX, e.clientY);
      resizeStart.current = {
        x: local.x,
        y: local.y,
        w: item.width,
        h: item.height,
      };
      setIsResizing(true);
    },
    [item.width, item.height, viewportToLocal]
  );

  const handleRemoveBg = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onRemoveBg || isRemovingBg) return;
      setIsRemovingBg(true);
      try {
        await onRemoveBg(item.id);
      } finally {
        setIsRemovingBg(false);
      }
    },
    [onRemoveBg, item.id, isRemovingBg]
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const local = viewportToLocal(e.clientX, e.clientY);
      if (isDragging) {
        const newX = local.x - dragOffset.current.x;
        const newY = local.y - dragOffset.current.y;
        onUpdate(item.id, { x: newX, y: newY });
      } else if (isResizing) {
        const dx = local.x - resizeStart.current.x;
        const dy = local.y - resizeStart.current.y;
        const newW = Math.max(30, resizeStart.current.w + dx);
        const newH = Math.max(15, resizeStart.current.h + dy);
        onUpdate(item.id, { width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, item.id, onUpdate, viewportToLocal]);

  const renderShape = () => {
    const color = item.color || "#e53e3e";
    const sw = item.strokeWidth || 3;
    const common = { stroke: color, strokeWidth: sw, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

    switch (item.shapeType) {
      case "checkmark":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polyline points="15,55 40,80 85,20" {...common} />
          </svg>
        );
      case "x-mark":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <line x1="15" y1="15" x2="85" y2="85" {...common} />
            <line x1="85" y1="15" x2="15" y2="85" {...common} />
          </svg>
        );
      case "rectangle":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <rect x={sw} y={sw} width={100 - sw * 2} height={100 - sw * 2} {...common} />
          </svg>
        );
      case "circle":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <ellipse cx="50" cy="50" rx={48 - sw} ry={48 - sw} {...common} />
          </svg>
        );
      case "triangle":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,90 10,90" {...common} />
          </svg>
        );
      case "arrow-right":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <line x1="10" y1="50" x2="80" y2="50" {...common} />
            <polyline points="65,30 85,50 65,70" {...common} />
          </svg>
        );
      case "arrow-left":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <line x1="20" y1="50" x2="90" y2="50" {...common} />
            <polyline points="35,30 15,50 35,70" {...common} />
          </svg>
        );
      case "line":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <line x1="5" y1="50" x2="95" y2="50" {...common} />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case "signature":
      case "image":
        return (
          <img
            src={item.content}
            alt={item.type === "signature" ? "חתימה" : "תמונה"}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        );
      case "shape":
        return renderShape();
      case "text":
      case "date":
        return (
          <span
            style={{
              fontSize: `${item.fontSize || 16}px`,
              color: item.color || "#1e293b",
              whiteSpace: "pre-wrap",
              lineHeight: 1.2,
            }}
            dir="auto"
          >
            {item.content}
          </span>
        );
    }
  };

  const showRemoveBg = item.type === "image" && onRemoveBg;

  return (
    <div
      className="pdf-overlay-item group"
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {renderContent()}

      {/* Delete button */}
      <button
        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
      >
        <X className="w-3 h-3" />
      </button>

      {/* Remove background button - for images */}
      {showRemoveBg && (
        <button
          className="absolute -top-3 -left-3 bg-indigo-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemoveBg}
          title="הסר רקע"
        >
          {isRemovingBg ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Eraser className="w-3 h-3" />
          )}
        </button>
      )}

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        onMouseDown={handleResizeDown}
      >
        <Maximize2 className="w-3 h-3 text-primary rotate-90" />
      </div>
    </div>
  );
}
