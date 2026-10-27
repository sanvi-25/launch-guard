"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  ListTree, 
  Table2, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  SlidersHorizontal,
  ArrowUpDown,
  Send,
  Eye,
  Satellite,
  Compass,
  Radio,
  Flame,
  Check,
  Package,
  Truck,
  Building2,
  Zap
} from "lucide-react";
import { logRiskAudit, dispatchSupplierPart, type Audit } from "../actions";
import type { LaunchRisk, RiskLevel } from "@/lib/api-sync";
import MissionModal from "./MissionModal";
import AuditHistorySection from "./AuditHistorySection";

interface LaunchGridProps {
  launches: LaunchRisk[];
  audits: Audit[];
  onOpenCustomAudit: () => void;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; text: string; border: string; bars: number }> = {
  HIGH: {
    label: "Critical Risk",
    color: "#f87171",
    bg: "bg-rose-950/80",
    text: "text-rose-300",
    border: "border-rose-500/40",
    bars: 3,
  },
  MEDIUM: {
    label: "Watchlist",
    color: "#fbbf24",
    bg: "bg-amber-950/80",
    text: "text-amber-300",
    border: "border-amber-500/40",
    bars: 2,
  },
  NORMAL: {
    label: "Nominal / Clear",
    color: "#34d399",
    bg: "bg-emerald-950/80",
    text: "text-emerald-300",
    border: "border-emerald-500/40",
    bars: 1,
  },
};

type ViewMode = "cards" | "timeline" | "matrix";
type SortOption = "date-asc" | "risk-desc" | "risk-asc" | "name-asc";

function LiveCountdown({ net }: { net: string }) {
  const [timeLeft, setTimeLeft] = useState<{ text: string; isOpen: boolean }>({ text: "CALCULATING...", isOpen: false });

  useEffect(() => {
    const update = () => {
      const ms = new Date(net).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft({ text: "WINDOW OPEN", isOpen: true });
        return;
      }
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);

      const d = days > 0 ? `${days}d ` : "";
      const h = String(hours).padStart(2, "0");
      const m = String(minutes).padStart(2, "0");
      const s = String(seconds).padStart(2, "0");
      setTimeLeft({ text: `T-${d}${h}h ${m}m ${s}s`, isOpen: false });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [net]);

  return (
    <span className={`font-mono text-xs font-black tracking-wider ${timeLeft.isOpen ? "text-emerald-400" : "text-white"}`}>
      {timeLeft.text}
    </span>
  );
}

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const meta = RISK_CONFIG[level];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className="h-1.5 w-4 rounded-full transition-all"
            style={{
              backgroundColor: bar <= meta.bars ? meta.color : "#1e2c56",
            }}
          />
        ))}
      </div>
      <span className="font-mono text-xs font-bold" style={{ color: meta.color }}>
        {score}/100
      </span>
    </div>
  );
}

export default function LaunchGrid({ launches, audits, onOpenCustomAudit }: LaunchGridProps) {
  const [filterRisk, setFilterRisk] = useState<"ALL" | RiskLevel>("ALL");
  const [selectedAgency, setSelectedAgency] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortOption, setSortOption] = useState<SortOption>("date-asc");
  const [selectedLaunch, setSelectedLaunch] = useState<LaunchRisk | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [dispatchedIds, setDispatchedIds] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const agencies = Array.from(new Set(launches.map((l) => l.agency.split("/")[0].trim()))).filter(Boolean);

  const handleQuickLog = (launch: LaunchRisk) => {
    setBusyId(launch.id);
    startTransition(async () => {
      const res = await logRiskAudit({
        mission: launch.name,
        rocket: launch.rocket,
        agency: launch.agency,
        riskLevel: launch.riskLevel,
        delayReason: launch.delayReason,
      });

      setToast(
        res.ok
          ? { ok: true, text: `Audit recorded in Neon DB for ${launch.name}` }
          : { ok: false, text: `Audit failed: ${res.error}` }
      );
      setBusyId(null);
    });
  };

  const handleQuickSupplierDispatch = (launch: LaunchRisk) => {
    setBusyId(`disp-${launch.id}`);
    startTransition(async () => {
      const part = launch.requiredPart;
      const res = await dispatchSupplierPart({
        mission: launch.name,
        rocket: launch.rocket,
        subsystem: part.subsystem,
        partName: part.partName,
        partNumber: part.partNumber,
        supplierName: part.supplierName,
        spaceportPad: `${launch.pad_name}, ${launch.pad_location}`,
        urgency: part.dispatchUrgency,
        etaHours: part.leadTimeHours,
        notes: part.notes,
      });

      if (res.ok) {
        setDispatchedIds((prev) => ({ ...prev, [launch.id]: true }));
        setToast({
          ok: true,
          text: `⚡ Supplier Alert Transmitted: ${part.supplierName} dispatched ${part.partName} to ${launch.pad_name} (ETA ${part.leadTimeHours}h)`
        });
      } else {
        setToast({ ok: false, text: `Dispatch failed: ${res.error}` });
      }
      setBusyId(null);
    });
  };

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
  };

  const filteredLaunches = launches.filter((l) => {
    const matchesRisk = filterRisk === "ALL" || l.riskLevel === filterRisk;
    const matchesAgency = selectedAgency === "ALL" || l.agency.toLowerCase().includes(selectedAgency.toLowerCase());
    const matchesQuery =
      searchQuery.trim() === "" ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.rocket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.pad_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.pad_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.orbit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.delayReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.requiredPart && l.requiredPart.partName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.requiredPart && l.requiredPart.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRisk && matchesAgency && matchesQuery;
  });

  const sortedLaunches = [...filteredLaunches].sort((a, b) => {
    if (sortOption === "date-asc") {
      return new Date(a.net).getTime() - new Date(b.net).getTime();
    }
    if (sortOption === "risk-desc") {
      return b.riskScore - a.riskScore;
    }
    if (sortOption === "risk-asc") {
      return a.riskScore - b.riskScore;
    }
    if (sortOption === "name-asc") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const countByRisk = (level: RiskLevel) => launches.filter((l) => l.riskLevel === level).length;

  return (
    <div id="radar" className="scroll-mt-20">
      {/* Risk Spectrum Proportion Bar */}
      {launches.length > 0 && (
        <div className="mb-8 rounded-2xl border border-space-700/80 bg-space-900/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Radio className="h-4 w-4 text-sky-400" />
              Active Fleet Risk Spectrum & Supply Chain Mitigations
            </span>
            <span className="text-xs text-slate-400">
              {launches.length} Missions Synchronized across Global Spaceports
            </span>
          </div>

          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-space-950 p-0.5 border border-space-800">
            {countByRisk("HIGH") > 0 && (
              <div
                title={`${countByRisk("HIGH")} High Risk`}
                className="rounded-l-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
                style={{ width: `${(countByRisk("HIGH") / launches.length) * 100}%` }}
              />
            )}
            {countByRisk("MEDIUM") > 0 && (
              <div
                title={`${countByRisk("MEDIUM")} Watchlist`}
                className="bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${(countByRisk("MEDIUM") / launches.length) * 100}%` }}
              />
            )}
            {countByRisk("NORMAL") > 0 && (
              <div
                title={`${countByRisk("NORMAL")} Nominal`}
                className="rounded-r-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${(countByRisk("NORMAL") / launches.length) * 100}%` }}
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="font-bold">{countByRisk("HIGH")} Critical</span> (Supplier Spares Pre-Alerted)
              </div>
              <div className="flex items-center gap-1.5 text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="font-bold">{countByRisk("MEDIUM")} Watchlist</span> (Vendor Standby)
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-bold">{countByRisk("NORMAL")} Clear</span> (On Schedule)
              </div>
            </div>
            <button
              onClick={() => {
                setFilterRisk("ALL");
                setSelectedAgency("ALL");
                setSearchQuery("");
              }}
              className="font-mono text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Risk Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterRisk("ALL")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filterRisk === "ALL"
                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25"
                  : "border border-space-700 bg-space-900/60 text-slate-300 hover:bg-space-800"
              }`}
            >
              All Launches ({launches.length})
            </button>
            <button
              onClick={() => setFilterRisk("HIGH")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filterRisk === "HIGH"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "border border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-950/70"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Critical Risk ({countByRisk("HIGH")})
            </button>
            <button
              onClick={() => setFilterRisk("MEDIUM")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filterRisk === "MEDIUM"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
                  : "border border-amber-500/30 bg-amber-950/40 text-amber-300 hover:bg-amber-950/70"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Watchlist ({countByRisk("MEDIUM")})
            </button>
            <button
              onClick={() => setFilterRisk("NORMAL")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filterRisk === "NORMAL"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                  : "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/70"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Nominal ({countByRisk("NORMAL")})
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-space-700 bg-space-900/60 p-1 self-start lg:self-auto">
            <button
              onClick={() => setViewMode("cards")}
              title="Card Radar View"
              className={`rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === "cards" ? "bg-space-750 text-sky-300 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Radar Grid</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              title="Timeline Sequence View"
              className={`rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === "timeline" ? "bg-space-750 text-sky-300 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              title="Risk Matrix Table View"
              className={`rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === "matrix" ? "bg-space-750 text-sky-300 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Matrix</span>
            </button>
          </div>
        </div>

        {/* Search, Agency Filter, and Sort Strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Search Bar */}
          <div className="relative sm:col-span-6 lg:col-span-7">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by rocket, agency, required spare (valve, actuator), or supplier..."
              className="w-full rounded-xl border border-space-700 bg-space-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Agency Dropdown */}
          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full rounded-xl border border-space-700 bg-space-950 px-3 py-2.5 text-xs font-semibold text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="ALL">All Agencies & Providers</option>
              {agencies.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="sm:col-span-3 lg:col-span-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full rounded-xl border border-space-700 bg-space-950 px-3 py-2.5 text-xs font-semibold text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="date-asc">Nearest T-0 Date</option>
              <option value="risk-desc">Highest Risk First</option>
              <option value="risk-asc">Lowest Risk First</option>
              <option value="name-asc">Mission Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: RADAR GRID (CARDS) */}
      {viewMode === "cards" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {sortedLaunches.map((launch) => {
            const riskMeta = RISK_CONFIG[launch.riskLevel];
            const part = launch.requiredPart;
            const isDispatched = dispatchedIds[launch.id];

            return (
              <article
                key={launch.id}
                className="glass-panel-card relative flex flex-col overflow-hidden rounded-3xl"
                style={{ borderTop: `3px solid ${riskMeta.color}` }}
              >
                {/* Image & Header Overlay */}
                <div className="relative h-48 w-full bg-space-900 overflow-hidden">
                  {launch.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={launch.image}
                      alt={launch.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-space-950 via-space-900 to-space-800 flex items-center justify-center">
                      <Satellite className="h-14 w-14 text-slate-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/40 to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute left-4 top-4 right-4 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md border ${riskMeta.bg} ${riskMeta.text} ${riskMeta.border}`}
                    >
                      {launch.riskLevel === "HIGH" && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                        </span>
                      )}
                      {riskMeta.label}
                    </span>

                    {/* Live countdown */}
                    <div className="rounded-full bg-space-950/80 px-3 py-1 backdrop-blur-md border border-space-700/60">
                      <LiveCountdown net={launch.net} />
                    </div>
                  </div>

                  {/* Bottom Pad details inside Image header */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-[11px] font-medium truncate max-w-[70%]">
                      <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
                      <span className="truncate">{launch.pad_name}</span>
                    </span>
                    <span className="rounded bg-space-950/80 px-2 py-0.5 font-mono text-[10px] text-sky-300 border border-sky-800/40">
                      {launch.orbit}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  {/* Mission Title & Provider */}
                  <div>
                    <h3 className="font-display text-xl font-black text-white leading-tight">
                      {launch.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">{launch.agency}</span>
                      <span>•</span>
                      <span className="font-mono text-sky-400">{launch.rocket}</span>
                      <span>•</span>
                      <span>
                        {new Date(launch.net).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Risk Score & Weather info strip */}
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-space-700/60 bg-space-950/60 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">Slip Threat:</span>
                      <RiskMeter level={launch.riskLevel} score={launch.riskScore} />
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      {launch.probability ? (
                        <span className="text-emerald-400">{launch.probability}% Weather Go</span>
                      ) : (
                        <span className="text-slate-500">Pad Range Go</span>
                      )}
                    </div>
                  </div>

                  {/* Delay Chit Reason Box */}
                  <div className="mt-4 rounded-2xl border border-space-700/80 bg-space-900/60 p-3.5">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Primary Delay Signal</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-200">
                      {launch.delayReason}
                    </p>
                  </div>

                  {/* Supplier Early Warning & Rapid Part Dispatch Callout */}
                  {part && (
                    <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          <Package className="h-3.5 w-3.5" />
                          <span>Pre-Alert Spare Part</span>
                        </span>
                        {isDispatched ? (
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            EN ROUTE ({part.leadTimeHours}h ETA)
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-400">
                            {part.supplierName.split("/")[0]}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-white truncate" title={part.partName}>
                        {part.partName}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-sky-400">{part.partNumber}</span>
                        <span className="text-amber-200/90">{part.leadTimeHours}h rapid courier dispatch</span>
                      </div>
                    </div>
                  )}

                  {/* Matched News links preview */}
                  {launch.matchedNews.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {launch.matchedNews.slice(0, 1).map((article) => (
                        <a
                          key={article.id}
                          href={article.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border border-space-800 bg-space-950/40 p-2 text-xs text-slate-400 transition-colors hover:border-sky-500/40 hover:text-sky-300"
                        >
                          <span className="truncate pr-2 font-medium">
                            <span className="font-bold text-sky-400">{article.news_site}:</span> {article.title}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-slate-500" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="mt-5 flex items-center gap-2 pt-2 border-t border-space-800">
                    <button
                      onClick={() => setSelectedLaunch(launch)}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-space-600 bg-space-850 px-2.5 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:border-sky-400 hover:bg-space-800 hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5 text-sky-400" />
                      <span>Deep Intel</span>
                    </button>

                    <button
                      onClick={() => handleQuickSupplierDispatch(launch)}
                      disabled={isPending && busyId === `disp-${launch.id}`}
                      title={`Alert ${part.supplierName} to dispatch ${part.partName}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-2.5 text-xs font-black uppercase text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>{isDispatched ? "En Route" : busyId === `disp-${launch.id}` ? "Alerting…" : "Dispatch Part"}</span>
                    </button>

                    <button
                      onClick={() => handleQuickLog(launch)}
                      disabled={isPending && busyId === launch.id}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-space-700 bg-space-900 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-space-800 hover:text-white disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{busyId === launch.id ? "…" : "Audit"}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TIMELINE SEQUENCE */}
      {viewMode === "timeline" && (
        <div className="relative border-l-2 border-space-700/80 pl-6 sm:pl-8 ml-3 sm:ml-4 space-y-8 my-4">
          {sortedLaunches.map((launch, idx) => {
            const riskMeta = RISK_CONFIG[launch.riskLevel];
            const part = launch.requiredPart;
            return (
              <div key={launch.id} className="relative group">
                <div
                  className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-space-950 shadow-md font-mono text-[10px] font-bold text-white"
                  style={{ backgroundColor: riskMeta.color }}
                >
                  {idx + 1}
                </div>

                <div className="rounded-2xl border border-space-700/80 bg-space-900/70 p-5 backdrop-blur transition-all hover:border-sky-400/40">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${riskMeta.bg} ${riskMeta.text} ${riskMeta.border}`}>
                          {riskMeta.label}
                        </span>
                        <span className="font-mono text-xs font-bold text-white">
                          <LiveCountdown net={launch.net} />
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-black text-white">
                        {launch.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {launch.agency} • {launch.rocket} • {launch.pad_location}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLaunch(launch)}
                        className="rounded-lg border border-space-600 bg-space-850 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-sky-400 hover:text-white"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleQuickSupplierDispatch(launch)}
                        className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 flex items-center gap-1"
                      >
                        <Truck className="h-3 w-3" />
                        <span>Dispatch Part</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-space-800 bg-space-950/60 p-3 text-xs text-slate-300">
                    <div>
                      <span className="font-semibold text-amber-300">Delay Chit:</span> {launch.delayReason}
                    </div>
                    {part && (
                      <div className="text-slate-400 text-[11px] shrink-0">
                        Spare: <span className="text-white font-mono">{part.partNumber}</span> ({part.supplierName.split("/")[0]})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: RISK MATRIX TABLE */}
      {viewMode === "matrix" && (
        <div className="overflow-x-auto rounded-2xl border border-space-700/80 bg-space-900/60 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-space-700/80 bg-space-950/90 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Launch Time</th>
                <th className="px-4 py-3.5">Mission & Vehicle</th>
                <th className="px-4 py-3.5">Provider</th>
                <th className="px-4 py-3.5">Spaceport Pad</th>
                <th className="px-4 py-3.5">Delay Threat</th>
                <th className="px-4 py-3.5">Pre-Alert Replacement Spare</th>
                <th className="px-4 py-3.5">Certified Supplier</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-800/80">
              {sortedLaunches.map((launch) => {
                const riskMeta = RISK_CONFIG[launch.riskLevel];
                const part = launch.requiredPart;
                const isDispatched = dispatchedIds[launch.id];

                return (
                  <tr key={launch.id} className="transition-colors hover:bg-space-850/60">
                    <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                      <div className="text-white font-bold">
                        {new Date(launch.net).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(launch.net).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white max-w-[170px] truncate" title={launch.name}>
                        {launch.name}
                      </div>
                      <div className="font-mono text-[11px] text-sky-400">
                        {launch.rocket}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                      {launch.agency}
                    </td>
                    <td className="px-4 py-3.5 max-w-[150px] truncate text-slate-400" title={launch.pad_location}>
                      {launch.pad_name}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold border ${riskMeta.bg} ${riskMeta.text} ${riskMeta.border}`}>
                        {riskMeta.label} ({launch.riskScore})
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="font-semibold text-white truncate" title={part?.partName}>
                        {part?.partName}
                      </div>
                      <div className="font-mono text-[10px] text-sky-400">
                        {part?.partNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                      <div>{part?.supplierName.split("/")[0]}</div>
                      <div className="font-mono text-[10px] text-amber-300">{part?.leadTimeHours}h ETA</div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLaunch(launch)}
                          className="rounded-lg border border-space-600 bg-space-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-sky-400 hover:text-white"
                        >
                          Intel
                        </button>
                        <button
                          onClick={() => handleQuickSupplierDispatch(launch)}
                          className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[11px] font-black uppercase text-slate-950 hover:from-amber-400 hover:to-orange-400"
                        >
                          {isDispatched ? "En Route" : "Dispatch"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {sortedLaunches.length === 0 && (
        <div className="rounded-3xl border border-dashed border-space-700 bg-space-900/40 p-12 text-center">
          <Satellite className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-3 font-display text-lg font-bold text-white">No Launches Found</h3>
          <p className="mt-1 text-xs text-slate-400">
            No missions matched your current search and risk filters.
          </p>
          <button
            onClick={() => {
              setFilterRisk("ALL");
              setSelectedAgency("ALL");
              setSearchQuery("");
            }}
            className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Mission Deep Intel Modal with Supplier Dispatch */}
      {selectedLaunch && (
        <MissionModal
          launch={selectedLaunch}
          onClose={() => setSelectedLaunch(null)}
          onAuditLogged={showToast}
        />
      )}

      {/* Audit History Log Section */}
      <AuditHistorySection audits={audits} onAuditDeleted={showToast} />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-5 py-3 text-xs font-bold shadow-2xl backdrop-blur-md transition-all ${
            toast.ok
              ? "border-emerald-400/50 bg-emerald-950/90 text-emerald-200"
              : "border-rose-400/50 bg-rose-950/90 text-rose-200"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
