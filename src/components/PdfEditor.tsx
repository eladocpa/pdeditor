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
  Shapes,
  Check,
  XIcon,
  Square,
  Circle,
  Triangle,
  ArrowLeft,
  Minus,
  ChevronDown,
} from "lucide-react";
import DraggableItem, { OverlayItem, ShapeType } from "@/components/DraggableItem";
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
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [shapeColor, setShapeColor] = useState("#e53e3e");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(3);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const shapesMenuRef = useRef<HTMLDivElement>(null);

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
      opts?: { fontSize?: number; color?: string; width?: number; height?: number; shapeType?: ShapeType; strokeWidth?: number }
    ) => {
      const container = pageContainerRef.current;
      if (!container) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;

      const newItem: OverlayItem = {
        id: `${type}-${Date.now()}`,
        type,
        x: cw / 2 - (opts?.width || 100) / 2,
        y: ch / 3,
        width: opts?.width || (type === "text" || type === "date" ? 200 : 200),
        height:
          opts?.height || (type === "text" || type === "date" ? 30 : 80),
        content,
        fontSize: opts?.fontSize,
        color: opts?.color,
        page: currentPage,
        shapeType: opts?.shapeType,
        strokeWidth: opts?.strokeWidth,
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

  const handleAddShape = useCallback(
    (shapeType: ShapeType) => {
      const isWide = shapeType === "line" || shapeType === "arrow-left" || shapeType === "arrow-right";
      const w = isWide ? 160 : 50;
      const h = isWide ? 30 : 50;
      addItem("shape", shapeType, { color: shapeColor, width: w, height: h, shapeType, strokeWidth: shapeStrokeWidth });
      setShowShapesMenu(false);
    },
    [addItem, shapeColor, shapeStrokeWidth]
  );

  // Close shapes menu on outside click
  useEffect(() => {
    if (!showShapesMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (shapesMenuRef.current && !shapesMenuRef.current.contains(e.target as Node)) {
        setShowShapesMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showShapesMenu]);

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

  // The width we pass to <Page width={...}> — must stay in sync
  const PAGE_RENDER_WIDTH = 800;

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

      // Register fontkit and embed a Unicode font that supports Hebrew + Latin
      const fontkit = (await import("@pdf-lib/fontkit")).default;
      pdfDoc.registerFontkit(fontkit);
      const fontUrl = "/fonts/Rubik-Regular.ttf";
      const fontResponse = await fetch(fontUrl);
      const fontBytes = await fontResponse.arrayBuffer();
      const unicodeFont = await pdfDoc.embedFont(fontBytes, { subset: true });

      for (const item of overlayItems) {
        const pageIndex = item.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        const page = pages[pageIndex];

        // pdf-lib getSize() returns visual dimensions (accounts for /Rotate)
        const { width: pageW, height: pageH } = page.getSize();

        // The react-pdf <Page width={PAGE_RENDER_WIDTH}> renders the page at
        // PAGE_RENDER_WIDTH px wide, scaled proportionally. So:
        // ratio = pdfPoints / cssPixels
        const ratio = pageW / PAGE_RENDER_WIDTH;

        // Convert overlay coords (top-left origin, CSS px) → PDF coords (bottom-left origin, points)
        const pdfW = item.width * ratio;
        const pdfH = item.height * ratio;
        const pdfX = item.x * ratio;
        const pdfY = pageH - (item.y * ratio) - pdfH;

        if (item.type === "shape") {
          const { rgb } = await import("pdf-lib");
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
          };
          const color = hexToRgb(item.color || "#e53e3e");
          // strokeWidth is relative to a 100×100 SVG viewBox in the UI,
          // so scale it proportionally to the PDF shape size, not the page ratio.
          const sw = (item.strokeWidth || 3) / 100 * Math.min(pdfW, pdfH);

          switch (item.shapeType) {
            case "checkmark": {
              const pts = [
                { x: pdfX + pdfW * 0.15, y: pdfY + pdfH * 0.45 },
                { x: pdfX + pdfW * 0.40, y: pdfY + pdfH * 0.20 },
                { x: pdfX + pdfW * 0.85, y: pdfY + pdfH * 0.80 },
              ];
              page.drawLine({ start: pts[0], end: pts[1], thickness: sw, color });
              page.drawLine({ start: pts[1], end: pts[2], thickness: sw, color });
              break;
            }
            case "x-mark": {
              page.drawLine({ start: { x: pdfX + pdfW * 0.15, y: pdfY + pdfH * 0.15 }, end: { x: pdfX + pdfW * 0.85, y: pdfY + pdfH * 0.85 }, thickness: sw, color });
              page.drawLine({ start: { x: pdfX + pdfW * 0.85, y: pdfY + pdfH * 0.15 }, end: { x: pdfX + pdfW * 0.15, y: pdfY + pdfH * 0.85 }, thickness: sw, color });
              break;
            }
            case "rectangle": {
              page.drawRectangle({ x: pdfX + sw, y: pdfY + sw, width: pdfW - sw * 2, height: pdfH - sw * 2, borderColor: color, borderWidth: sw, opacity: 0 });
              break;
            }
            case "circle": {
              const cx = pdfX + pdfW / 2;
              const cy = pdfY + pdfH / 2;
              const rx = (pdfW / 2) - sw;
              const ry = (pdfH / 2) - sw;
              page.drawEllipse({ x: cx, y: cy, xScale: rx, yScale: ry, borderColor: color, borderWidth: sw, opacity: 0 });
              break;
            }
            case "triangle": {
              const p1 = { x: pdfX + pdfW * 0.5, y: pdfY + pdfH * 0.9 };
              const p2 = { x: pdfX + pdfW * 0.9, y: pdfY + pdfH * 0.1 };
              const p3 = { x: pdfX + pdfW * 0.1, y: pdfY + pdfH * 0.1 };
              page.drawLine({ start: p1, end: p2, thickness: sw, color });
              page.drawLine({ start: p2, end: p3, thickness: sw, color });
              page.drawLine({ start: p3, end: p1, thickness: sw, color });
              break;
            }
            case "arrow-right": {
              const midY = pdfY + pdfH / 2;
              page.drawLine({ start: { x: pdfX + pdfW * 0.1, y: midY }, end: { x: pdfX + pdfW * 0.8, y: midY }, thickness: sw, color });
              page.drawLine({ start: { x: pdfX + pdfW * 0.65, y: pdfY + pdfH * 0.7 }, end: { x: pdfX + pdfW * 0.85, y: midY }, thickness: sw, color });
              page.drawLine({ start: { x: pdfX + pdfW * 0.65, y: pdfY + pdfH * 0.3 }, end: { x: pdfX + pdfW * 0.85, y: midY }, thickness: sw, color });
              break;
            }
            case "arrow-left": {
              const midY2 = pdfY + pdfH / 2;
              page.drawLine({ start: { x: pdfX + pdfW * 0.2, y: midY2 }, end: { x: pdfX + pdfW * 0.9, y: midY2 }, thickness: sw, color });
              page.drawLine({ start: { x: pdfX + pdfW * 0.35, y: pdfY + pdfH * 0.7 }, end: { x: pdfX + pdfW * 0.15, y: midY2 }, thickness: sw, color });
              page.drawLine({ start: { x: pdfX + pdfW * 0.35, y: pdfY + pdfH * 0.3 }, end: { x: pdfX + pdfW * 0.15, y: midY2 }, thickness: sw, color });
              break;
            }
            case "line": {
              const midY3 = pdfY + pdfH / 2;
              page.drawLine({ start: { x: pdfX + pdfW * 0.05, y: midY3 }, end: { x: pdfX + pdfW * 0.95, y: midY3 }, thickness: sw, color });
              break;
            }
          }
        } else if (item.type === "signature" || item.type === "image") {
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

          // Match CSS "object-contain": preserve the image's natural aspect ratio
          // and center it within the overlay bounds — just like the editor does.
          const imgAspect = img.width / img.height;
          const boxAspect = pdfW / pdfH;
          let drawX: number, drawY: number, drawW: number, drawH: number;

          if (imgAspect > boxAspect) {
            // Image is wider than box: fit to width, center vertically
            drawW = pdfW;
            drawH = pdfW / imgAspect;
            drawX = pdfX;
            drawY = pdfY + (pdfH - drawH) / 2;
          } else {
            // Image is taller than box: fit to height, center horizontally
            drawH = pdfH;
            drawW = pdfH * imgAspect;
            drawX = pdfX + (pdfW - drawW) / 2;
            drawY = pdfY;
          }

          page.drawImage(img, {
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
          });
        } else {
          const { rgb } = await import("pdf-lib");
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
          };

          const fontSize = (item.fontSize || 16) * ratio;
          page.drawText(item.content, {
            x: pdfX,
            y: pdfY + pdfH - fontSize,
            size: fontSize,
            font: unicodeFont,
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
      alert(`שגיאה בייצוא הקובץ: ${error instanceof Error ? error.message : error}`);
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
            <div className="relative" ref={shapesMenuRef}>
              <button
                onClick={() => setShowShapesMenu((v) => !v)}
                className={`toolbar-btn ${showShapesMenu ? "bg-bg-dark" : ""}`}
              >
                <Shapes className="w-3.5 h-3.5" />
                סימון
                <ChevronDown className="w-3 h-3" />
              </button>
              {showShapesMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-border p-3 z-50 min-w-[220px]">
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {([
                      ["checkmark", Check, "וי"],
                      ["x-mark", XIcon, "איקס"],
                      ["rectangle", Square, "מרובע"],
                      ["circle", Circle, "עיגול"],
                      ["triangle", Triangle, "משולש"],
                      ["arrow-right", ArrowRight, "חץ ימינה"],
                      ["arrow-left", ArrowLeft, "חץ שמאלה"],
                      ["line", Minus, "קו"],
                    ] as [ShapeType, React.ComponentType<{ className?: string }>, string][]).map(
                      ([shape, Icon, label]) => (
                        <button
                          key={shape}
                          onClick={() => handleAddShape(shape)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-bg-dark transition-colors"
                          title={label}
                        >
                          <span style={{ color: shapeColor }}><Icon className="w-5 h-5" /></span>
                          <span className="text-[10px] text-text-muted">{label}</span>
                        </button>
                      )
                    )}
                  </div>
                  <div className="border-t border-border pt-2">
                    <label className="text-[11px] text-text-muted mb-1.5 block">צבע סימון</label>
                    <div className="flex items-center gap-1.5">
                      {["#e53e3e", "#2563eb", "#16a34a", "#9333ea", "#ea580c", "#1e293b"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setShapeColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${shapeColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={shapeColor}
                        onChange={(e) => setShapeColor(e.target.value)}
                        className="w-6 h-6 rounded-full cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <label className="text-[11px] text-text-muted mb-1.5 block">עובי קו: {shapeStrokeWidth}px</label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5">
                        <div className="rounded-full" style={{ width: 4, height: 4, backgroundColor: shapeColor }} />
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={shapeStrokeWidth}
                        onChange={(e) => setShapeStrokeWidth(Number(e.target.value))}
                        className="flex-1 h-1.5 accent-primary cursor-pointer"
                      />
                      <div className="flex items-center justify-center w-5">
                        <div className="rounded-full" style={{ width: 12, height: 12, backgroundColor: shapeColor }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                width={PAGE_RENDER_WIDTH}
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
