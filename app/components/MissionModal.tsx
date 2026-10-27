"use client";

import { useState, useTransition } from "react";
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Radio, 
  ExternalLink, 
  Satellite, 
  CheckCircle2, 
  Flame, 
  Calendar,
  CloudSun,
  FileText,
  Send,
  Truck,
  Package,
  Building2,
  Zap,
  Check
} from "lucide-react";
import type { LaunchRisk, RiskLevel } from "@/lib/api-sync";
import { logRiskAudit, dispatchSupplierPart } from "../actions";

interface MissionModalProps {
  launch: LaunchRisk | null;
  onClose: () => void;
  onAuditLogged: (msg: string, success: boolean) => void;
}

const RISK_BADGES: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
  HIGH: { label: "High Delay Risk", bg: "bg-rose-950/80", text: "text-rose-300", border: "border-rose-500/40" },
  MEDIUM: { label: "Delay Watchlist", bg: "bg-amber-950/80", text: "text-amber-300", border: "border-amber-500/40" },
  NORMAL: { label: "Nominal / Clear", bg: "bg-emerald-950/80", text: "text-emerald-300", border: "border-emerald-500/40" },
};

export default function MissionModal({ launch, onClose, onAuditLogged }: MissionModalProps) {
  const [activeTab, setActiveTab] = useState<"intel" | "supplier" | "news" | "audit">("supplier");
  const [customRisk, setCustomRisk] = useState<RiskLevel>(launch?.riskLevel ?? "HIGH");
  const [customReason, setCustomReason] = useState<string>(launch?.delayReason ?? "");
  const [dispatchNote, setDispatchNote] = useState<string>("");
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  if (!launch) return null;

  const handleSaveAudit = () => {
    startTransition(async () => {
      const res = await logRiskAudit({
        mission: launch.name,
        rocket: launch.rocket,
        agency: launch.agency,
        riskLevel: customRisk,
        delayReason: customReason.trim() || launch.delayReason,
      });

      if (res.ok) {
        onAuditLogged(`Audit saved to Neon DB for ${launch.name}`, true);
        onClose();
      } else {
        onAuditLogged(`Error saving audit: ${res.error}`, false);
      }
    });
  };

  const handleDispatchSupplier = () => {
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
        notes: dispatchNote.trim() || part.notes,
      });

      if (res.ok) {
        setDispatchSuccess(true);
        onAuditLogged(`⚡ Supplier Alert Sent: ${part.supplierName} instructed to dispatch ${part.partName} to ${launch.pad_name}`, true);
      } else {
        onAuditLogged(`Dispatch error: ${res.error}`, false);
      }
    });
  };

  const riskMeta = RISK_BADGES[launch.riskLevel];
  const part = launch.requiredPart;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-space-950/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-space-600 bg-space-900 shadow-2xl shadow-sky-950/50 my-auto">
        {/* Banner with image */}
        <div className="relative h-44 sm:h-52 w-full bg-space-800 overflow-hidden">
          {launch.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={launch.image}
              alt={launch.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-tr from-space-950 via-space-850 to-space-700 flex items-center justify-center">
              <Satellite className="h-16 w-16 text-slate-600/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/40 to-black/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 rounded-full bg-space-950/80 p-2 text-slate-300 backdrop-blur hover:bg-space-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Badge & Title */}
          <div className="absolute left-6 bottom-4 right-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border backdrop-blur-md ${riskMeta.bg} ${riskMeta.text} ${riskMeta.border}`}>
                {launch.riskLevel === "HIGH" && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
                {riskMeta.label} • Score {launch.riskScore}/100
              </span>
              <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl leading-tight">
                {launch.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-space-700/80 bg-space-950/60 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("supplier")}
            className={`border-b-2 py-3.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "supplier"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Package className="h-3.5 w-3.5 text-amber-400" />
            <span>Supplier Dispatch & Spares</span>
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] text-amber-300 font-mono">NEW</span>
          </button>
          <button
            onClick={() => setActiveTab("intel")}
            className={`border-b-2 py-3.5 px-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeTab === "intel"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Mission & Risk Intel
          </button>
          <button
            onClick={() => setActiveTab("news")}
            className={`border-b-2 py-3.5 px-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeTab === "news"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Aerospace Signals ({launch.matchedNews.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`border-b-2 py-3.5 px-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeTab === "audit"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Log Risk Audit
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6 text-sm text-slate-300">
          
          {/* TAB: SUPPLIER DISPATCH (NEW FEATURE) */}
          {activeTab === "supplier" && (
            <div className="space-y-6">
              {/* Feature Intro Banner */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">
                      Automated Supplier Early Warning & Rapid Part Dispatch
                    </h4>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Instead of letting this launch slip while waiting for post-scrub paperwork, LaunchGuard flags the exact bottleneck part and immediately notifies the certified aerospace supplier to ready flight spares for emergency dispatch to the spaceport pad.
                    </p>
                  </div>
                </div>
              </div>

              {/* Part & Supplier Details Card */}
              <div className="rounded-2xl border border-space-700/80 bg-space-950/60 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-space-800 pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Subsystem Bottleneck
                    </span>
                    <p className="font-bold text-white text-base mt-0.5">
                      {part.subsystem}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 self-start sm:self-auto rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold uppercase border ${
                    part.dispatchUrgency === "CRITICAL_AOG" 
                      ? "bg-rose-950/80 text-rose-300 border-rose-500/40" 
                      : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  }`}>
                    <Zap className="h-3 w-3" />
                    {part.dispatchUrgency.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-space-800 bg-space-900/60 p-3.5">
                    <span className="font-mono text-[10px] text-slate-400 uppercase">Required Replacement Component</span>
                    <p className="font-semibold text-white mt-1 text-sm">{part.partName}</p>
                    <p className="font-mono text-xs text-sky-400 mt-0.5">Part #: {part.partNumber}</p>
                  </div>

                  <div className="rounded-xl border border-space-800 bg-space-900/60 p-3.5">
                    <span className="font-mono text-[10px] text-slate-400 uppercase">Certified Aerospace Vendor</span>
                    <p className="font-semibold text-white mt-1 text-sm">{part.supplierName}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-slate-500" />
                      {part.supplierLocation}
                    </p>
                  </div>
                </div>

                {/* Logistics Route */}
                <div className="rounded-xl border border-space-800 bg-space-900/40 p-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Destination Pad Logistics:</span>
                      <p className="font-semibold text-white mt-0.5">{launch.pad_name} ({launch.pad_location})</p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-slate-400">Expedited Courier Transit:</span>
                      <p className="font-mono font-bold text-amber-300 mt-0.5">{part.leadTimeHours} Hours via {part.transitMethod}</p>
                    </div>
                  </div>
                </div>

                {/* Telemetry Observation Note */}
                <div className="text-xs text-slate-400 bg-space-900/30 rounded-xl p-3 border border-space-850">
                  <span className="font-bold text-slate-300">Engineering Delay Note:</span> {part.notes}
                </div>
              </div>

              {/* Action: Send Alert to Supplier */}
              {dispatchSuccess ? (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="mt-3 font-display text-base font-bold text-white">
                    Supplier Dispatch Order Transmitted!
                  </h4>
                  <p className="mt-1 text-xs text-emerald-200">
                    An urgent part dispatch notification was dispatched to <span className="font-bold">{part.supplierName}</span>. Replacement spare <span className="font-mono">{part.partNumber}</span> is flagged for rapid transit to {launch.pad_name}.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/80 px-4 py-2 font-mono text-xs text-emerald-300">
                    <Truck className="h-4 w-4" />
                    <span>STATUS: EN ROUTE (ESTIMATED ARRIVAL IN {part.leadTimeHours} HOURS)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Add Custom Expedited Dispatch Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={dispatchNote}
                      onChange={(e) => setDispatchNote(e.target.value)}
                      placeholder="e.g. Stage at Pad Gate 4 Logistics Dock; courier must carry cleanroom double-bagging certifications..."
                      className="mt-1.5 w-full rounded-xl border border-space-700 bg-space-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <button
                    onClick={handleDispatchSupplier}
                    disabled={isPending}
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-orange-500 hover:shadow-amber-500/35 disabled:opacity-50"
                  >
                    <Truck className="h-4 w-4" />
                    <span>{isPending ? "Transmitting Alert to Vendor…" : `Notify ${part.supplierName} & Dispatch Part to Pad`}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: INTEL */}
          {activeTab === "intel" && (
            <div className="space-y-6">
              {/* Mission Summary & Specs Grid */}
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mission Profile
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  {launch.mission_description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-space-700/80 bg-space-950/60 p-3">
                    <span className="text-[11px] font-semibold text-slate-400">Rocket Vehicle</span>
                    <p className="mt-1 font-semibold text-white">{launch.rocket}</p>
                  </div>
                  <div className="rounded-xl border border-space-700/80 bg-space-950/60 p-3">
                    <span className="text-[11px] font-semibold text-slate-400">Launch Provider</span>
                    <p className="mt-1 font-semibold text-white">{launch.agency}</p>
                  </div>
                  <div className="rounded-xl border border-space-700/80 bg-space-950/60 p-3">
                    <span className="text-[11px] font-semibold text-slate-400">Target Orbit</span>
                    <p className="mt-1 font-semibold text-white truncate" title={launch.orbit}>{launch.orbit}</p>
                  </div>
                  <div className="rounded-xl border border-space-700/80 bg-space-950/60 p-3">
                    <span className="text-[11px] font-semibold text-slate-400">Weather Forecast</span>
                    <p className="mt-1 font-semibold text-white">
                      {launch.probability ? `${launch.probability}% Go` : "Awaiting Model"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pad & Window */}
              <div className="rounded-2xl border border-space-700/80 bg-space-950/60 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">{launch.pad_name}</p>
                      <p className="text-xs text-slate-400">{launch.pad_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 sm:text-right">
                    <Clock className="h-4 w-4 text-sky-400 shrink-0 mt-0.5 sm:hidden" />
                    <div>
                      <p className="font-semibold text-white">
                        {new Date(launch.net).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </p>
                      <p className="font-mono text-xs text-slate-400">
                        {new Date(launch.net).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZoneName: "short"
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delay Analysis Callout */}
              <div className="rounded-2xl border border-space-600 bg-space-850 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Primary Delay Chit Analysis</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-100">
                  {launch.delayReason}
                </p>
              </div>

              {/* Risk Factors Breakdown */}
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                  Multi-Factor Risk Assessment
                </h3>
                <div className="mt-3 space-y-2.5">
                  {launch.riskFactors.map((rf, i) => (
                    <div 
                      key={i} 
                      className="flex items-start gap-3 rounded-xl border border-space-700/60 bg-space-950/40 p-3"
                    >
                      <span className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        rf.impact === "HIGH" 
                          ? "bg-rose-950 text-rose-300 border border-rose-800" 
                          : rf.impact === "MEDIUM" 
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}>
                        {rf.impact} IMPACT
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-200">{rf.category}</p>
                        <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{rf.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEWS */}
          {activeTab === "news" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Aerospace articles scanned and matched via NLP for schedule slips, anomalies, and regulatory updates:
              </p>

              {launch.matchedNews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-space-700 p-8 text-center text-slate-500">
                  No press mentions with delay keywords recorded in the last 72 hours.
                </div>
              ) : (
                launch.matchedNews.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-space-700/80 bg-space-950/60 p-4 transition-all hover:border-sky-400/50 hover:bg-space-850 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-sky-950 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300 border border-sky-800/60">
                        {article.news_site}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-sky-400" />
                    </div>
                    <h4 className="mt-2 font-display text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                      {article.title}
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400 line-clamp-2">
                      {article.summary}
                    </p>
                  </a>
                ))
              )}
            </div>
          )}

          {/* TAB 3: AUDIT */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/30 p-4 text-xs text-sky-200">
                <p className="font-semibold">Neon Serverless Database Audit Logger</p>
                <p className="mt-1 text-slate-300">
                  Record an official aerospace assessment chit. This entry will be immediately persisted in your Neon PostgreSQL database.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assign Risk Severity
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["HIGH", "MEDIUM", "NORMAL"] as RiskLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setCustomRisk(level)}
                      className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                        customRisk === level
                          ? level === "HIGH"
                            ? "border-rose-400 bg-rose-950/80 text-rose-200 ring-2 ring-rose-500/30"
                            : level === "MEDIUM"
                            ? "border-amber-400 bg-amber-950/80 text-amber-200 ring-2 ring-amber-500/30"
                            : "border-emerald-400 bg-emerald-950/80 text-emerald-200 ring-2 ring-emerald-500/30"
                          : "border-space-700 bg-space-950/60 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {level === "HIGH" ? "Critical Risk" : level === "MEDIUM" ? "Watchlist" : "Clear"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Delay Chit / Risk Findings Note
                </label>
                <textarea
                  rows={3}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Detail anomalies, NOTAM airspace conflicts, weather violations, or ground umbilical issues..."
                  className="mt-2 w-full rounded-xl border border-space-700 bg-space-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveAudit}
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-sky-600/30 transition-all hover:from-sky-400 hover:to-blue-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isPending ? "Persisting Audit to Neon DB…" : "Commit Audit Entry"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-space-700/80 bg-space-950/80 px-6 py-4 text-xs text-slate-400">
          <span>Target Pad: {launch.pad_name}</span>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-space-800 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
