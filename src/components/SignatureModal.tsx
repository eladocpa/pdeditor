"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, RotateCcw, Check } from "lucide-react";

interface SignatureModalProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export default function SignatureModal({ onSave, onClose }: SignatureModalProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      onSave(dataUrl);
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">צייר חתימה</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl overflow-hidden mb-4">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              className: "signature-canvas w-full",
              height: 200,
              style: { width: "100%", height: "200px" },
            }}
            penColor="#1e293b"
            minWidth={1.5}
            maxWidth={3}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClear}
            className="toolbar-btn"
          >
            <RotateCcw className="w-4 h-4" />
            נקה
          </button>
          <button
            onClick={handleSave}
            className="toolbar-btn active"
          >
            <Check className="w-4 h-4" />
            שמור חתימה
          </button>
        </div>
      </div>
    </div>
  );
}
