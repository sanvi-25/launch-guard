"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import LaunchGrid from "./LaunchGrid";
import CustomAuditModal from "./CustomAuditModal";
import Footer from "./Footer";
import type { LaunchRisk } from "@/lib/api-sync";
import type { Audit } from "../actions";

interface ClientPageProps {
  apod: { url: string; title: string; explanation?: string; copyright?: string } | null;
  launches: LaunchRisk[];
  audits: Audit[];
}

export default function ClientPage({ apod, launches, audits }: ClientPageProps) {
  const [isCustomAuditOpen, setIsCustomAuditOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const highRiskCount = launches.filter((l) => l.riskLevel === "HIGH").length;

  const handleAuditLogged = (msg: string, success: boolean) => {
    setToast({ text: msg, ok: success });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500/30 selection:text-sky-200">
      <div>
        <Navbar
          onOpenCustomAudit={() => setIsCustomAuditOpen(true)}
          auditCount={audits.length}
          highRiskCount={highRiskCount}
        />

        <HeroSection
          apod={apod}
          launches={launches}
          onOpenCustomAudit={() => setIsCustomAuditOpen(true)}
        />

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <LaunchGrid
            launches={launches}
            audits={audits}
            onOpenCustomAudit={() => setIsCustomAuditOpen(true)}
          />
        </main>
      </div>

      <Footer />

      <CustomAuditModal
        isOpen={isCustomAuditOpen}
        onClose={() => setIsCustomAuditOpen(false)}
        onAuditLogged={handleAuditLogged}
      />

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-5 py-3 text-xs font-bold shadow-2xl backdrop-blur-md transition-all ${
            toast.ok
              ? "border-emerald-400/50 bg-emerald-950/90 text-emerald-200"
              : "border-rose-400/50 bg-rose-950/90 text-rose-200"
          }`}
        >
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
