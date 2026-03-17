"use client";

import dynamic from "next/dynamic";

const PdfEditor = dynamic(() => import("@/components/PdfEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-text-secondary">טוען עורך...</p>
    </div>
  ),
});

export default function EditorPage() {
  return <PdfEditor />;
}
