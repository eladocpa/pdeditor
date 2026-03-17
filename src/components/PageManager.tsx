"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import {
  X,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Trash2,
  Undo2,
  Save,
  Layers,
} from "lucide-react";

interface PageManagerProps {
  pdfData: string;
  onSave: (newPdfData: string) => void;
  onClose: () => void;
}

interface PageInfo {
  originalIndex: number;
  rotation: number;
  deleted: boolean;
}

export default function PageManager({ pdfData, onSave, onClose }: PageManagerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (numPages > 0 && pages.length === 0) {
      setPages(
        Array.from({ length: numPages }, (_, i) => ({
          originalIndex: i,
          rotation: 0,
          deleted: false,
        }))
      );
    }
  }, [numPages, pages.length]);

  const movePage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const toggleDelete = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, deleted: !p.deleted } : p
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const base64Data = pdfData.split(",")[1];
      const pdfBytes = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0)
      );
      const srcDoc = await PDFDocument.load(pdfBytes);
      const newDoc = await PDFDocument.create();

      const activePages = pages.filter((p) => !p.deleted);

      for (const pageInfo of activePages) {
        const [copiedPage] = await newDoc.copyPages(srcDoc, [
          pageInfo.originalIndex,
        ]);
        if (pageInfo.rotation !== 0) {
          copiedPage.setRotation(
            { type: "degrees", angle: (copiedPage.getRotation().angle + pageInfo.rotation) % 360 } as ReturnType<typeof copiedPage.getRotation>
          );
        }
        newDoc.addPage(copiedPage);
      }

      const newPdfBytes = await newDoc.save();
      const blob = new Blob([newPdfBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const reader = new FileReader();
      reader.onload = () => {
        onSave(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Page manager error:", error);
      alert("שגיאה בעיבוד העמודים. נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = pages.filter((p) => !p.deleted).length;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-amber-50 rounded-lg p-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-base font-bold">סידור עמודים</h3>
            <span className="text-xs text-text-muted bg-bg-dark rounded-full px-2 py-0.5">
              {activeCount} / {pages.length} פעילים
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-dark transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Pages grid */}
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Document
              file={pdfData}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-text-secondary text-sm">טוען עמודים...</p>
                  </div>
                </div>
              }
            >
              {pages.map((pageInfo, index) => (
                <div
                  key={`${pageInfo.originalIndex}-${index}`}
                  className={`relative rounded-xl overflow-hidden transition-all border-2 ${
                    pageInfo.deleted
                      ? "border-red-200 opacity-40 bg-red-50/50"
                      : "border-border hover:border-primary bg-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Page number badge */}
                  <div className="absolute top-2 right-2 z-10 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {index + 1}
                  </div>

                  {/* Thumbnail */}
                  <div
                    className="flex items-center justify-center p-2"
                    style={{
                      transform: `rotate(${pageInfo.rotation}deg)`,
                      minHeight: "180px",
                    }}
                  >
                    <Page
                      pageNumber={pageInfo.originalIndex + 1}
                      width={150}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-0.5 p-2 bg-bg border-t border-border">
                    <button
                      onClick={() => movePage(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
                      title="הזז למעלה"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => movePage(index, 1)}
                      disabled={index === pages.length - 1}
                      className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
                      title="הזז למטה"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => rotatePage(index)}
                      className="p-1.5 rounded-lg hover:bg-white transition-colors"
                      title="סובב"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleDelete(index)}
                      className={`p-1.5 rounded-lg hover:bg-white transition-colors ${
                        pageInfo.deleted ? "text-success" : "text-danger"
                      }`}
                      title={pageInfo.deleted ? "שחזר" : "מחק"}
                    >
                      {pageInfo.deleted ? (
                        <Undo2 className="w-3.5 h-3.5" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </Document>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <button onClick={onClose} className="toolbar-btn">
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || activeCount === 0}
            className="toolbar-btn active"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "שומר..." : "שמור שינויים"}
          </button>
        </div>
      </div>
    </div>
  );
}
