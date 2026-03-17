"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  PenTool,
  Type,
  Calendar,
  ImageIcon,
  Upload,
  Shield,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          sessionStorage.setItem("pdfFile", base64);
          sessionStorage.setItem("pdfFileName", file.name);
          router.push("/editor");
        };
        reader.readAsDataURL(file);
      }
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const features = [
    {
      icon: <PenTool className="w-8 h-8 text-primary" />,
      title: "חתימות דיגיטליות",
      description: "צייר חתימה ישירות על המסמך או העלה תמונת חתימה",
    },
    {
      icon: <Type className="w-8 h-8 text-primary" />,
      title: "הוספת טקסט",
      description: "הוסף טקסט בכל מקום על המסמך עם בחירת גודל וצבע",
    },
    {
      icon: <Calendar className="w-8 h-8 text-primary" />,
      title: "הוספת תאריך",
      description: "הוסף תאריך אוטומטי או ידני על המסמך",
    },
    {
      icon: <ImageIcon className="w-8 h-8 text-primary" />,
      title: "הוספת תמונות",
      description: "העלה תמונות וחותמות והצמד אותן בכל מקום",
    },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-xl p-2">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-text-main">עורך PDF</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>מאובטח</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>מהיר</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-text-main">
            ערוך קבצי PDF בקלות
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            הוסף חתימות, טקסט, תאריכים ותמונות לקבצי PDF ישירות מהדפדפן.
            <br />
            ללא צורך בהתקנה, מאובטח ומהיר.
          </p>
        </div>

        {/* Upload area */}
        <div
          {...getRootProps()}
          className={`max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-primary bg-blue-50"
              : "border-border hover:border-primary hover:bg-blue-50/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload
            className={`w-16 h-16 mx-auto mb-4 ${
              isDragActive ? "text-primary" : "text-text-secondary"
            }`}
          />
          {isDragActive ? (
            <p className="text-lg font-medium text-primary">
              שחרר את הקובץ כאן...
            </p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                גרור קובץ PDF לכאן או לחץ לבחירה
              </p>
              <p className="text-sm text-text-secondary">
                קבצי PDF בלבד • הקובץ נשאר במחשב שלך
              </p>
            </>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-surface rounded-xl p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center mt-20 text-sm text-text-secondary">
          <p>
            הקבצים שלך מעובדים ישירות בדפדפן ולא נשלחים לשום שרת.
          </p>
        </footer>
      </main>
    </div>
  );
}
