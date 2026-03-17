"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Maximize2 } from "lucide-react";

export interface OverlayItem {
  id: string;
  type: "signature" | "text" | "date" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  color?: string;
  page: number;
}

interface DraggableItemProps {
  item: OverlayItem;
  onUpdate: (id: string, updates: Partial<OverlayItem>) => void;
  onDelete: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function DraggableItem({
  item,
  onUpdate,
  onDelete,
  containerRef,
}: DraggableItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragOffset.current = {
        x: e.clientX - item.x,
        y: e.clientY - item.y,
      };
      setIsDragging(true);
    },
    [item.x, item.y, containerRef]
  );

  const handleResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: item.width,
        h: item.height,
      };
      setIsResizing(true);
    },
    [item.width, item.height]
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        onUpdate(item.id, { x: newX, y: newY });
      } else if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
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
  }, [isDragging, isResizing, item.id, onUpdate]);

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
