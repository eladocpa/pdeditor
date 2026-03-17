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
  GripVertical,
  Save,
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
            // pdf-lib uses degrees type
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold">סידור עמודים</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              {activeCount} עמודים פעילים
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pages grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Document
              file={pdfData}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<p className="text-text-secondary col-span-full text-center py-8">טוען עמודים...</p>}
            >
              {pages.map((pageInfo, index) => (
                <div
                  key={`${pageInfo.originalIndex}-${index}`}
                  className={`relative border-2 rounded-xl overflow-hidden transition-all ${
                    pageInfo.deleted
                      ? "border-red-300 opacity-40"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {/* Page number badge */}
                  <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    {index + 1}
                  </div>

                  {/* Thumbnail */}
                  <div
                    className="flex items-center justify-center bg-gray-50 p-2"
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
                  <div className="flex items-center justify-center gap-1 p-2 bg-gray-50 border-t border-border">
                    <button
                      onClick={() => movePage(index, -1)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                      title="הזז למעלה"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => movePage(index, 1)}
                      disabled={index === pages.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                      title="הזז למטה"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => rotatePage(index)}
                      className="p-1 rounded hover:bg-gray-200"
                      title="סובב"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleDelete(index)}
                      className={`p-1 rounded hover:bg-gray-200 ${
                        pageInfo.deleted ? "text-green-600" : "text-red-500"
                      }`}
                      title={pageInfo.deleted ? "שחזר" : "מחק"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </Document>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button onClick={onClose} className="toolbar-btn">
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || activeCount === 0}
            className="toolbar-btn active"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "שומר..." : "שמור שינויים"}
          </button>
        </div>
      </div>
    </div>
  );
}
