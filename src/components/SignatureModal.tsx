"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, RotateCcw, Check, PenTool } from "lucide-react";

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
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 rounded-lg p-1.5">
              <PenTool className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-base font-bold">צייר חתימה</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-dark transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="p-5">
          <div className="bg-bg rounded-xl overflow-hidden border border-border">
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{
                className: "signature-canvas w-full",
                height: 200,
                style: { width: "100%", height: "200px", background: "white" },
              }}
              penColor="#1e293b"
              minWidth={1.5}
              maxWidth={3}
            />
          </div>
          <p className="text-xs text-text-muted mt-2 text-center">צייר את החתימה שלך באמצעות העכבר</p>
        </div>

        <div className="flex gap-2 justify-end p-5 pt-0">
          <button onClick={handleClear} className="toolbar-btn">
            <RotateCcw className="w-3.5 h-3.5" />
            נקה
          </button>
          <button onClick={handleSave} className="toolbar-btn active">
            <Check className="w-3.5 h-3.5" />
            שמור חתימה
          </button>
        </div>
      </div>
    </div>
  );
}
