"use client";

import { useState } from "react";
import { X, Check, Type } from "lucide-react";

interface TextModalProps {
  onSave: (text: string, fontSize: number, color: string) => void;
  onClose: () => void;
}

const presetColors = ["#0f172a", "#1e40af", "#dc2626", "#059669", "#7c3aed", "#ea580c"];

export default function TextModal({ onSave, onClose }: TextModalProps) {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState("#0f172a");

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim(), fontSize, color);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 rounded-lg p-1.5">
              <Type className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold">הוסף טקסט</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-dark transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">טקסט</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-border rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
              rows={3}
              placeholder="הקלד טקסט כאן..."
              dir="auto"
              autoFocus
              style={{ fontSize: `${Math.min(fontSize, 24)}px`, color }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              גודל גופן: <span className="text-primary">{fontSize}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="48"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
              <span>10px</span>
              <span>48px</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">צבע</label>
            <div className="flex items-center gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c ? "border-primary scale-110 shadow-md" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="w-px h-6 bg-border mx-1" />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full border border-border cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end p-5 pt-0">
          <button onClick={onClose} className="toolbar-btn">
            ביטול
          </button>
          <button onClick={handleSave} className="toolbar-btn active">
            <Check className="w-3.5 h-3.5" />
            הוסף
          </button>
        </div>
      </div>
    </div>
  );
}
