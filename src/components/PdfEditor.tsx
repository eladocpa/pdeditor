"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import {
  FileText,
  PenTool,
  Type,
  Calendar,
  ImageIcon,
  Download,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Trash2,
  Layers,
  RefreshCw,
  Stamp,
} from "lucide-react";
import DraggableItem, { OverlayItem } from "@/components/DraggableItem";
import SignatureModal from "@/components/SignatureModal";
import TextModal from "@/components/TextModal";
import PageManager from "@/components/PageManager";
import ConvertModal from "@/components/ConvertModal";
import { removeBackground } from "@/lib/removeBackground";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfEditor() {
  const router = useRouter();
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showPageManager, setShowPageManager] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("pdfFile");
    const storedName = sessionStorage.getItem("pdfFileName");
    if (stored) {
      setPdfData(stored);
      setFileName(storedName || "document.pdf");
    } else {
      router.push("/");
    }
  }, [router]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const addItem = useCallback(
    (
      type: OverlayItem["type"],
      content: string,
      opts?: { fontSize?: number; color?: string; width?: number; height?: number }
    ) => {
      const container = pageContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const newItem: OverlayItem = {
        id: `${type}-${Date.now()}`,
        type,
        x: rect.width / 2 - (opts?.width || 100) / 2,
        y: rect.height / 3,
        width: opts?.width || (type === "text" || type === "date" ? 200 : 200),
        height:
          opts?.height || (type === "text" || type === "date" ? 30 : 80),
        content,
        fontSize: opts?.fontSize,
        color: opts?.color,
        page: currentPage,
      };
      setOverlayItems((prev) => [...prev, newItem]);
    },
    [currentPage]
  );

  const handleSignatureSave = (dataUrl: string) => {
    addItem("signature", dataUrl, { width: 200, height: 80 });
    setShowSignatureModal(false);
  };

  const handleTextSave = (text: string, fontSize: number, color: string) => {
    const estimatedWidth = Math.max(100, Math.min(text.length * fontSize * 0.6, 400));
    const lines = text.split("\n").length;
    const estimatedHeight = Math.max(30, lines * fontSize * 1.4);
    addItem("text", text, { fontSize, color, width: estimatedWidth, height: estimatedHeight });
    setShowTextModal(false);
  };

  const handleAddDate = () => {
    const today = new Date().toLocaleDateString("he-IL");
    addItem("date", today, { fontSize: 16, color: "#1e293b", width: 120, height: 28 });
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addItem("image", reader.result as string, { width: 150, height: 150 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddStamp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const transparent = await removeBackground(dataUrl);
        sessionStorage.setItem("stampImage", transparent);
        addItem("image", transparent, { width: 150, height: 150 });
      } catch {
        sessionStorage.setItem("stampImage", dataUrl);
        addItem("image", dataUrl, { width: 150, height: 150 });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddSavedStamp = () => {
    const saved = sessionStorage.getItem("stampImage");
    if (saved) {
      addItem("image", saved, { width: 150, height: 150 });
    } else {
      stampInputRef.current?.click();
    }
  };

  const updateItem = useCallback(
    (id: string, updates: Partial<OverlayItem>) => {
      setOverlayItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const deleteItem = useCallback((id: string) => {
    setOverlayItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleRemoveBg = useCallback(
    async (id: string) => {
      const item = overlayItems.find((i) => i.id === id);
      if (!item) return;
      try {
        const transparent = await removeBackground(item.content);
        updateItem(id, { content: transparent });
      } catch {
        // silently fail
      }
    },
    [overlayItems, updateItem]
  );

  const clearAll = () => {
    setOverlayItems([]);
  };

  const handlePageManagerSave = (newPdfData: string) => {
    setPdfData(newPdfData);
    sessionStorage.setItem("pdfFile", newPdfData);
    setCurrentPage(1);
    setOverlayItems([]);
    setShowPageManager(false);
  };

  const exportPdf = async () => {
    if (!pdfData) return;
    setIsExporting(true);

    try {
      const base64Data = pdfData.split(",")[1];
      const pdfBytes = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0)
      );
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      // Use clientWidth/clientHeight which are NOT affected by CSS transforms
      const canvas = pageContainerRef.current?.querySelector("canvas");
      if (!canvas) throw new Error("Canvas not found");
      const canvasW = (canvas as HTMLCanvasElement).clientWidth;
      const canvasH = (canvas as HTMLCanvasElement).clientHeight;

      for (const item of overlayItems) {
        const pageIndex = item.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const { width: pageW, height: pageH } = page.getSize();

        // Map from canvas CSS pixels (unscaled) to PDF points
        const scaleX = pageW / canvasW;
        const scaleY = pageH / canvasH;

        const pdfX = item.x * scaleX;
        const pdfY = pageH - (item.y + item.height) * scaleY;
        const pdfW = item.width * scaleX;
        const pdfH = item.height * scaleY;

        if (item.type === "signature" || item.type === "image") {
          const imgData = item.content.split(",")[1];
          const imgBytes = Uint8Array.from(atob(imgData), (c) =>
            c.charCodeAt(0)
          );
          let img;
          if (item.content.includes("image/png")) {
            img = await pdfDoc.embedPng(imgBytes);
          } else {
            img = await pdfDoc.embedJpg(imgBytes);
          }
          page.drawImage(img, {
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
          });
        } else {
          const { rgb } = await import("pdf-lib");
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
          };

          const fontSize = (item.fontSize || 16) * scaleX;
          page.drawText(item.content, {
            x: pdfX,
            y: pdfY + pdfH * 0.2,
            size: fontSize,
            color: hexToRgb(item.color || "#1e293b"),
          });
        }
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.replace(".pdf", "_edited.pdf");
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("שגיאה בייצוא הקובץ. נסה שוב.");
    } finally {
      setIsExporting(false);
    }
  };

  const currentPageItems = overlayItems.filter(
    (item) => item.page === currentPage
  );

  if (!pdfData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="bg-surface/90 glass border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="toolbar-btn"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm truncate max-w-[200px] text-text-main">
                {fileName}
              </span>
              <span className="text-[11px] text-text-muted bg-bg-dark rounded px-1.5 py-0.5">
                {numPages} עמודים
              </span>
            </div>
          </div>

          <button
            onClick={exportPdf}
            disabled={isExporting}
            className="toolbar-btn active"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "מייצא..." : "הורד PDF"}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-surface border-b border-border sticky top-[49px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setShowSignatureModal(true)}
              className="toolbar-btn"
            >
              <PenTool className="w-3.5 h-3.5" />
              חתימה
            </button>
            <button
              onClick={() => setShowTextModal(true)}
              className="toolbar-btn"
            >
              <Type className="w-3.5 h-3.5" />
              טקסט
            </button>
            <button onClick={handleAddDate} className="toolbar-btn">
              <Calendar className="w-3.5 h-3.5" />
              תאריך
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="toolbar-btn"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              תמונה
            </button>
            <button
              onClick={handleAddSavedStamp}
              className="toolbar-btn"
            >
              <Stamp className="w-3.5 h-3.5" />
              חותמת
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleAddImage}
              className="hidden"
            />
            <input
              ref={stampInputRef}
              type="file"
              accept="image/*"
              onChange={handleAddStamp}
              className="hidden"
            />

            <div className="w-px h-5 bg-border mx-0.5" />

            <button
              onClick={() => setShowPageManager(true)}
              className="toolbar-btn"
            >
              <Layers className="w-3.5 h-3.5" />
              עמודים
            </button>
            <button
              onClick={() => setShowConvertModal(true)}
              className="toolbar-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              המרה
            </button>

            {overlayItems.length > 0 && (
              <>
                <div className="w-px h-5 bg-border mx-0.5" />
                <button
                  onClick={clearAll}
                  className="toolbar-btn text-danger hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  נקה
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="p-1.5 rounded-lg hover:bg-bg-dark transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-text-secondary" />
            </button>
            <span className="text-xs font-medium min-w-[42px] text-center text-text-secondary">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2, s + 0.1))}
              className="p-1.5 rounded-lg hover:bg-bg-dark transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-6 bg-bg-dark">
        <div className="flex justify-center">
          <div
            ref={pageContainerRef}
            className="relative bg-white shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5"
            style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
          >
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-96 w-[600px]">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-text-secondary text-sm">טוען מסמך...</p>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                width={800}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {currentPageItems.map((item) => (
              <DraggableItem
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onRemoveBg={handleRemoveBg}
                containerRef={pageContainerRef}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Page navigation */}
      {numPages > 1 && (
        <div className="bg-surface border-t border-border sticky bottom-0">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-bg-dark disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-main">
                {currentPage}
              </span>
              <span className="text-xs text-text-muted">/</span>
              <span className="text-sm text-text-secondary">
                {numPages}
              </span>
            </div>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(numPages, p + 1))
              }
              disabled={currentPage >= numPages}
              className="p-1.5 rounded-lg hover:bg-bg-dark disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSignatureModal && (
        <SignatureModal
          onSave={handleSignatureSave}
          onClose={() => setShowSignatureModal(false)}
        />
      )}
      {showTextModal && (
        <TextModal
          onSave={handleTextSave}
          onClose={() => setShowTextModal(false)}
        />
      )}
      {showPageManager && (
        <PageManager
          pdfData={pdfData}
          onSave={handlePageManagerSave}
          onClose={() => setShowPageManager(false)}
        />
      )}
      {showConvertModal && (
        <ConvertModal
          pdfData={pdfData}
          fileName={fileName}
          onClose={() => setShowConvertModal(false)}
        />
      )}
    </div>
  );
}
