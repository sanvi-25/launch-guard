"use client";

import { useState } from "react";
import { 
  Rocket, 
  ShieldAlert, 
  Radio, 
  PlusCircle, 
  Activity, 
  Satellite, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Download,
  Package
} from "lucide-react";

interface NavbarProps {
  onOpenCustomAudit: () => void;
  auditCount: number;
  highRiskCount: number;
}

export default function Navbar({ onOpenCustomAudit, auditCount, highRiskCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-space-700/60 bg-space-950/85 backdrop-blur-md">
      {/* Top Telemetry Alert Strip */}
      <div className="border-b border-space-800/80 bg-space-900/60 px-4 py-1 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              GLOBAL TELEMETRY ACTIVE
            </span>
            <span className="hidden text-slate-600 sm:inline">•</span>
            <span className="hidden items-center gap-1 font-mono text-[11px] text-amber-300 sm:inline-flex">
              <Package className="h-3 w-3 text-amber-400" />
              SUPPLIER EARLY WARNING: ONLINE
            </span>
            <span className="hidden text-slate-600 sm:inline">•</span>
            <span className="hidden items-center gap-1 font-mono text-[11px] text-slate-300 sm:inline-flex">
              <Activity className="h-3 w-3 text-sky-400" />
              SPACE WEATHER: KP 2.1 (NOMINAL)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {highRiskCount > 0 && (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-rose-400">
                <ShieldAlert className="h-3 w-3" />
                {highRiskCount} SLIP ALERTS
              </span>
            )}
            <span className="hidden font-mono text-slate-400 md:inline">
              EASTERN RANGE: GO
            </span>
            <span className="font-mono text-sky-400">
              {auditCount} AUDITS LOGGED
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <a href="#" className="group flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/40 transition-transform group-hover:scale-105">
              <Rocket className="h-5 w-5 text-white transition-transform group-hover:-translate-y-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-black tracking-tight text-white">
                  Launch<span className="text-sky-400">Guard</span>
                </span>
                <span className="rounded bg-sky-950/80 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300 border border-sky-800/60">
                  Intel 2.0
                </span>
              </div>
              <p className="hidden text-[10px] font-medium tracking-wide text-slate-400 sm:block">
                AEROSPACE SLIPPAGE EARLY WARNING
              </p>
            </div>
          </a>
        </div>

        {/* Navigation links */}
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#radar"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-space-800 hover:text-white"
          >
            Launch Radar
          </a>
          <a
            href="#timeline"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-space-800 hover:text-white"
          >
            Timeline
          </a>
          <a
            href="#matrix"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-space-800 hover:text-white"
          >
            Risk Matrix
          </a>
          <a
            href="#audits"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-space-800 hover:text-white"
          >
            Audit History
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href="/api/download-zip"
            download="launchguard.zip"
            title="Download full project zip archive"
            className="inline-flex items-center gap-1.5 rounded-xl border border-space-600 bg-space-850 px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-sky-400 hover:bg-space-800 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export ZIP</span>
          </a>

          <button
            onClick={onOpenCustomAudit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/25 transition-all hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-500/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Log Risk Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
}
