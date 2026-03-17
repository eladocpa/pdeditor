"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

interface TextModalProps {
  onSave: (text: string, fontSize: number, color: string) => void;
  onClose: () => void;
}

export default function TextModal({ onSave, onClose }: TextModalProps) {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState("#1e293b");

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim(), fontSize, color);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">הוסף טקסט</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">טקסט</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="הקלד טקסט כאן..."
              dir="auto"
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                גודל ({fontSize}px)
              </label>
              <input
                type="range"
                min="10"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">צבע</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} className="toolbar-btn">
            ביטול
          </button>
          <button onClick={handleSave} className="toolbar-btn active">
            <Check className="w-4 h-4" />
            הוסף
          </button>
        </div>
      </div>
    </div>
  );
}
