"use client";

import { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Clock, 
  Satellite, 
  Radio, 
  Sparkles, 
  ArrowDown, 
  Layers,
  Activity,
  Flame,
  CheckCircle2
} from "lucide-react";
import type { LaunchRisk } from "@/lib/api-sync";

interface HeroSectionProps {
  apod: { url: string; title: string; explanation?: string; copyright?: string } | null;
  launches: LaunchRisk[];
  onOpenCustomAudit: () => void;
}

export default function HeroSection({ apod, launches, onOpenCustomAudit }: HeroSectionProps) {
  const [nearestCountdown, setNearestCountdown] = useState<string>("T-00:00:00");
  const [nearestLaunch, setNearestLaunch] = useState<LaunchRisk | null>(null);

  // Compute stats
  const totalLaunches = launches.length;
  const highRiskLaunches = launches.filter((l) => l.riskLevel === "HIGH");
  const mediumRiskLaunches = launches.filter((l) => l.riskLevel === "MEDIUM");
  const clearLaunches = launches.filter((l) => l.riskLevel === "NORMAL");

  const riskExposurePercent = totalLaunches > 0
    ? Math.round(((highRiskLaunches.length * 1.0 + mediumRiskLaunches.length * 0.5) / totalLaunches) * 100)
    : 0;

  useEffect(() => {
    if (launches.length === 0) return;
    // Sort by NET to find nearest
    const sorted = [...launches].sort((a, b) => new Date(a.net).getTime() - new Date(b.net).getTime());
    const next = sorted[0];
    setNearestLaunch(next);

    const updateTimer = () => {
      const ms = new Date(next.net).getTime() - Date.now();
      if (ms <= 0) {
        setNearestCountdown("LAUNCH WINDOW OPEN");
        return;
      }
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((ms % (1000 * 60)) / 1000);

      const dStr = days > 0 ? `${days}d ` : "";
      const hStr = String(hours).padStart(2, "0");
      const mStr = String(mins).padStart(2, "0");
      const sStr = String(secs).padStart(2, "0");
      setNearestCountdown(`T-${dStr}${hStr}h ${mStr}m ${sStr}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [launches]);

  return (
    <section className="relative overflow-hidden border-b border-space-700/80 bg-space-950 pb-16 pt-12 sm:pb-20 sm:pt-16">
      {/* Background NASA APOD or Cosmos imagery */}
      <div className="absolute inset-0 z-0">
        {apod ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={apod.url}
            alt={apod.title}
            className="h-full w-full object-cover object-center opacity-25 filter blur-[1px]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-space-900 via-space-950 to-space-950 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/80 to-space-950/40" />
        <div className="absolute inset-0 space-grid opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/60 px-3.5 py-1 text-xs font-semibold text-sky-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
          <span>AUTONOMOUS AEROSPACE EARLY SLIP INTELLIGENCE</span>
        </div>

        {/* Main Title & Subtitle */}
        <div className="mt-6 max-w-4xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.08] lg:text-7xl">
            Know which launches will <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">slip</span> before they do.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-relaxed">
            We continuously synthesize global spaceflight manifests, real-time aerospace news sentiment, FAA airspace filings, and spaceport weather models to pinpoint delay threats up to 14 days in advance.
          </p>
        </div>

        {/* Hero CTA & Quick Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#radar"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-400 hover:shadow-sky-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <span>Explore Mission Radar</span>
            <ArrowDown className="h-4 w-4" />
          </a>
          <button
            onClick={onOpenCustomAudit}
            className="inline-flex items-center gap-2 rounded-xl border border-space-600 bg-space-850/80 px-5 py-3 text-sm font-semibold text-slate-200 backdrop-blur transition-colors hover:border-sky-400/50 hover:bg-space-800 hover:text-white"
          >
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Submit Delay Signal</span>
          </button>
          {apod && (
            <span className="text-xs text-slate-400 italic">
              NASA APOD: {apod.title}
            </span>
          )}
        </div>

        {/* Telemetry Metric Cards */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {/* Total Monitored */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">Active Radar</span>
              <Satellite className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-white sm:text-3xl">
                {totalLaunches}
              </span>
              <span className="text-xs font-medium text-slate-400">missions tracked</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Multi-agency sync</span>
            </div>
          </div>

          {/* High Risk Alerts */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border-rose-500/30">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-rose-300">Delay Warning</span>
              <div className="relative">
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                </span>
                <ShieldAlert className="h-4 w-4 text-rose-400" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-rose-400 sm:text-3xl">
                {highRiskLaunches.length}
              </span>
              <span className="text-xs font-medium text-slate-400">critical chits</span>
            </div>
            <div className="mt-2 text-xs text-rose-300/80">
              <span>{mediumRiskLaunches.length} on active watch</span>
            </div>
          </div>

          {/* Slippage Risk Index */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-300">Slip Exposure</span>
              <Activity className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-amber-400 sm:text-3xl">
                {riskExposurePercent}%
              </span>
              <span className="text-xs font-medium text-slate-400">fleet volatility</span>
            </div>
            <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-space-800">
              <div 
                className="rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500" 
                style={{ width: `${Math.min(riskExposurePercent, 100)}%` }} 
              />
            </div>
          </div>

          {/* Next T-0 Imminent Countdown */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-sky-300">Next T-0</span>
              <Clock className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-3">
              <span className="font-mono text-xl font-black tabular-nums tracking-tight text-white sm:text-2xl">
                {nearestCountdown}
              </span>
            </div>
            <div className="mt-2 truncate text-xs text-slate-400" title={nearestLaunch ? nearestLaunch.name : "Awaiting sync"}>
              {nearestLaunch ? `${nearestLaunch.rocket} (${nearestLaunch.agency})` : "Awaiting telemetry"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
