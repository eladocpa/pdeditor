"use client";

import { useCallback, useRef } from "react";
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
  Layers,
  FileSpreadsheet,
  FileType,
  Stamp,
  ArrowLeft,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { removeBackground } from "@/lib/removeBackground";

export default function LandingPage() {
  const router = useRouter();
  const stampInputRef = useRef<HTMLInputElement>(null);

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

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const transparent = await removeBackground(dataUrl);
        sessionStorage.setItem("stampImage", transparent);
      } catch {
        sessionStorage.setItem("stampImage", dataUrl);
      }
      alert("החותמת נשמרה (רקע הוסר אוטומטית)! היא תהיה זמינה בעורך.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const features = [
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "חתימות דיגיטליות",
      description: "צייר חתימה ישירות על המסמך",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      icon: <Stamp className="w-6 h-6" />,
      title: "הוספת חותמת",
      description: "העלה תמונת חותמת והצמד למסמך",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: <Type className="w-6 h-6" />,
      title: "הוספת טקסט",
      description: "טקסט חופשי עם בחירת גודל וצבע",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "הוספת תאריך",
      description: "תאריך אוטומטי בלחיצה אחת",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: "הוספת תמונות",
      description: "העלה תמונות והצמד בכל מקום",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "סידור עמודים",
      description: "סדר מחדש, מחק וסובב עמודים",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      icon: <FileType className="w-6 h-6" />,
      title: "המרה לוורד",
      description: "ייצוא למסמך Word עם תמיכה ב-RTL",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      title: "המרה לאקסל",
      description: "המר טבלאות ונתונים לקובץ Excel",
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const badges = [
    { icon: <Shield className="w-4 h-4" />, text: "מאובטח ופרטי" },
    { icon: <Zap className="w-4 h-4" />, text: "מהיר ומיידי" },
    { icon: <Globe className="w-4 h-4" />, text: "עובד בדפדפן" },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface/80 glass border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-xl p-2 shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-main leading-tight">עורך PDF</h1>
              <p className="text-[11px] text-text-muted leading-tight">עריכה מהירה ומאובטחת</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => stampInputRef.current?.click()}
              className="toolbar-btn"
            >
              <Stamp className="w-4 h-4" />
              העלה חותמת
            </button>
            <input
              ref={stampInputRef}
              type="file"
              accept="image/*"
              onChange={handleStampUpload}
              className="hidden"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6 shadow-sm border border-accent-light">
              <CheckCircle2 className="w-4 h-4" />
              חינמי לחלוטין • ללא הרשמה
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-5 text-text-main leading-tight">
              ערוך קבצי PDF
              <br />
              <span className="text-primary">בקלות ובמהירות</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
              חתימות, טקסט, חותמות, תמונות, סידור עמודים והמרה לוורד ואקסל.
              <br />
              הכל ישירות מהדפדפן, ללא שליחת קבצים לשרת.
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {badges.map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-sm text-text-secondary bg-white/60 rounded-full px-3 py-1.5"
              >
                {badge.icon}
                <span>{badge.text}</span>
              </div>
            ))}
          </div>

          {/* Upload area */}
          <div className="max-w-2xl mx-auto">
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all bg-white/70 backdrop-blur-sm ${
                isDragActive
                  ? "border-primary bg-primary-light/80 upload-active shadow-lg"
                  : "border-border hover:border-accent hover:bg-white hover:shadow-lg"
              }`}
            >
              <input {...getInputProps()} />
              <div
                className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center ${
                  isDragActive
                    ? "bg-primary text-white"
                    : "bg-primary-light text-primary"
                } transition-all`}
              >
                <Upload className="w-8 h-8" />
              </div>
              {isDragActive ? (
                <p className="text-lg font-semibold text-primary">
                  שחרר את הקובץ כאן...
                </p>
              ) : (
                <>
                  <p className="text-lg font-semibold mb-2 text-text-main">
                    גרור קובץ PDF לכאן
                  </p>
                  <p className="text-sm text-text-secondary mb-4">
                    או לחץ לבחירת קובץ מהמחשב
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs text-text-muted bg-bg-dark rounded-full px-3 py-1.5">
                    <Shield className="w-3 h-3" />
                    הקובץ נשאר במחשב שלך ולא נשלח לשרת
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stamp upload CTA */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 mb-12">
        <div
          onClick={() => stampInputRef.current?.click()}
          className="max-w-2xl mx-auto bg-white rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all hover:border-purple-300"
        >
          <div className="bg-purple-50 rounded-xl p-3 shrink-0">
            <Stamp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">העלה תמונת חותמת מראש</p>
            <p className="text-xs text-text-secondary">
              העלה חותמת עכשיו והיא תהיה זמינה ישירות כשתפתח מסמך לעריכה
            </p>
          </div>
          <ArrowLeft className="w-5 h-5 text-text-muted shrink-0" />
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-text-main mb-2">כל מה שצריך לעריכת PDF</h3>
          <p className="text-text-secondary">כלים מתקדמים בממשק פשוט ונוח</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card bg-white rounded-xl p-5 border border-border"
            >
              <div className={`${feature.bg} ${feature.color} rounded-xl w-10 h-10 flex items-center justify-center mb-3`}>
                {feature.icon}
              </div>
              <h4 className="font-bold text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-text-muted">
            הקבצים שלך מעובדים ישירות בדפדפן ולא נשלחים לשום שרת.
          </p>
        </div>
      </footer>
    </div>
  );
}
