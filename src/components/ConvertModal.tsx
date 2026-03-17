"use client";

import { useState } from "react";
import { X, FileSpreadsheet, FileText, Download, Loader2, RefreshCw } from "lucide-react";
import { pdfjs } from "react-pdf";

interface ConvertModalProps {
  pdfData: string;
  fileName: string;
  onClose: () => void;
}

export default function ConvertModal({ pdfData, fileName, onClose }: ConvertModalProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [convertType, setConvertType] = useState<"word" | "excel" | null>(null);

  const extractTextFromPdf = async (): Promise<{ pages: { pageNum: number; text: string; lines: string[] }[] }> => {
    const base64Data = pdfData.split(",")[1];
    const pdfBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const pages: { pageNum: number; text: string; lines: string[] }[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items
        .filter((item) => "str" in item)
        .map((item) => (item as { str: string }).str);

      const fullText = textItems.join(" ");
      const lines = fullText.split(/\s{2,}/).filter((l) => l.trim());
      pages.push({ pageNum: i, text: fullText, lines });
    }

    return { pages };
  };

  const convertToWord = async () => {
    setIsConverting(true);
    setConvertType("word");
    try {
      const { pages } = await extractTextFromPdf();
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = await import("docx");

      const children: InstanceType<typeof Paragraph>[] = [];

      pages.forEach((page, idx) => {
        if (idx > 0) {
          children.push(new Paragraph({ children: [new PageBreak()] }));
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `עמוד ${page.pageNum}`,
                bold: true,
                size: 28,
                font: "Arial",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            bidirectional: true,
          })
        );

        page.lines.forEach((line) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 24,
                  font: "Arial",
                }),
              ],
              bidirectional: true,
              spacing: { after: 120 },
            })
          );
        });
      });

      const doc = new Document({
        sections: [
          {
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, fileName.replace(".pdf", ".docx"));
    } catch (error) {
      console.error("Word conversion error:", error);
      alert("שגיאה בהמרה לוורד. נסה שוב.");
    } finally {
      setIsConverting(false);
      setConvertType(null);
    }
  };

  const convertToExcel = async () => {
    setIsConverting(true);
    setConvertType("excel");
    try {
      const { pages } = await extractTextFromPdf();
      const XLSX = await import("xlsx");

      const wb = XLSX.utils.book_new();

      pages.forEach((page) => {
        const rows = page.lines.map((line) => {
          const cells = line.split(/\t|,|(?:\s{2,})/).map((c) => c.trim()).filter(Boolean);
          return cells.length > 1 ? cells : [line];
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);

        if (!ws["!cols"]) ws["!cols"] = [];
        ws["!RTL"] = true;

        const sheetName = `עמוד ${page.pageNum}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
      });

      const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([xlsxBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, fileName.replace(".pdf", ".xlsx"));
    } catch (error) {
      console.error("Excel conversion error:", error);
      alert("שגיאה בהמרה לאקסל. נסה שוב.");
    } finally {
      setIsConverting(false);
      setConvertType(null);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-violet-50 rounded-lg p-1.5">
              <RefreshCw className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-base font-bold">המרת מסמך</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-dark transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Word */}
          <button
            onClick={convertToWord}
            disabled={isConverting}
            className="w-full flex items-center gap-4 p-4 border-2 border-border rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all disabled:opacity-50 group"
          >
            <div className="bg-blue-50 rounded-xl p-3 group-hover:bg-blue-100 transition-colors">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-sm">המרה לוורד</p>
              <p className="text-xs text-text-secondary">
                ייצוא כקובץ DOCX עם תמיכה ב-RTL
              </p>
            </div>
            {isConverting && convertType === "word" ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Download className="w-4 h-4 text-text-muted group-hover:text-blue-600 transition-colors" />
            )}
          </button>

          {/* Excel */}
          <button
            onClick={convertToExcel}
            disabled={isConverting}
            className="w-full flex items-center gap-4 p-4 border-2 border-border rounded-xl hover:border-green-300 hover:bg-green-50/30 transition-all disabled:opacity-50 group"
          >
            <div className="bg-green-50 rounded-xl p-3 group-hover:bg-green-100 transition-colors">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-sm">המרה לאקסל</p>
              <p className="text-xs text-text-secondary">
                ייצוא כקובץ XLSX - עמוד לכל גיליון
              </p>
            </div>
            {isConverting && convertType === "excel" ? (
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            ) : (
              <Download className="w-4 h-4 text-text-muted group-hover:text-green-600 transition-colors" />
            )}
          </button>
        </div>

        <div className="px-5 pb-5">
          <p className="text-[11px] text-text-muted text-center bg-bg-dark rounded-lg py-2">
            ההמרה מתבצעת ישירות בדפדפן - הקובץ לא נשלח לשרת
          </p>
        </div>
      </div>
    </div>
  );
}
