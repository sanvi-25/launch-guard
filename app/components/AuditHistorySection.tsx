"use client";

import { useState, useTransition } from "react";
import { 
  FileText, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar,
  AlertTriangle,
  Building2,
  Clock
} from "lucide-react";
import type { Audit } from "../actions";
import { deleteAudit } from "../actions";
import type { RiskLevel } from "@/lib/api-sync";

interface AuditHistorySectionProps {
  audits: Audit[];
  onAuditDeleted: (msg: string, success: boolean) => void;
}

const RISK_MAP: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  HIGH: {
    label: "High Risk",
    badgeClass: "bg-rose-950/80 text-rose-300 border-rose-500/40",
    dotClass: "bg-rose-500",
  },
  MEDIUM: {
    label: "Watchlist",
    badgeClass: "bg-amber-950/80 text-amber-300 border-amber-500/40",
    dotClass: "bg-amber-500",
  },
  NORMAL: {
    label: "Clear",
    badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
    dotClass: "bg-emerald-500",
  },
};

export default function AuditHistorySection({ audits, onAuditDeleted }: AuditHistorySectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAudits = audits.filter((a) => {
    const matchesSearch =
      a.mission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.rocket_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.delay_reason && a.delay_reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRisk = selectedRisk === "ALL" || a.risk_level.toUpperCase() === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to remove this risk audit entry?")) return;
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteAudit(id);
      if (res.ok) {
        onAuditDeleted("Audit entry deleted", true);
      } else {
        onAuditDeleted(`Error deleting audit: ${res.error}`, false);
      }
      setDeletingId(null);
    });
  };

  const handleExportCSV = () => {
    if (audits.length === 0) return;
    const headers = ["ID", "Mission", "Rocket", "Agency", "Risk Level", "Delay Reason", "Logged At"];
    const rows = audits.map((a) => [
      a.id,
      `"${a.mission_name.replace(/"/g, '""')}"`,
      `"${a.rocket_name.replace(/"/g, '""')}"`,
      `"${a.agency.replace(/"/g, '""')}"`,
      a.risk_level,
      `"${(a.delay_reason || "").replace(/"/g, '""')}"`,
      a.created_at,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `launchguard-risk-audits-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="audits" className="mt-20 scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-sky-400">
              SUPPLY CHAIN COMPLIANCE
            </span>
            <span className="rounded-full bg-space-800 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">
              {audits.length} Records
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">
            Recorded Risk Audits
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Historical launch slip assessments saved to Neon PostgreSQL database.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={audits.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-space-600 bg-space-850 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-sky-400/50 hover:bg-space-800 hover:text-white disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-space-700/80 bg-space-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audits by mission, rocket, agency, or finding..."
            className="w-full rounded-xl border border-space-700 bg-space-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>

        {/* Risk Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "HIGH", "MEDIUM", "NORMAL"].map((risk) => (
            <button
              key={risk}
              onClick={() => setSelectedRisk(risk)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedRisk === risk
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "border border-space-700 bg-space-950/60 text-slate-400 hover:text-white"
              }`}
            >
              {risk === "ALL" ? "All Audits" : risk === "HIGH" ? "Critical" : risk === "MEDIUM" ? "Watchlist" : "Clear"}
            </button>
          ))}
        </div>
      </div>

      {/* Audits List */}
      {filteredAudits.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-space-700 bg-space-950/40 p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 font-semibold text-slate-300">No matching audit logs found</p>
          <p className="mt-1 text-xs text-slate-500">
            {audits.length === 0
              ? "Click 'Log Risk Audit' on any launch card above to record your first finding."
              : "Try adjusting your search query or risk filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredAudits.map((a) => {
            const riskConfig = RISK_MAP[a.risk_level.toUpperCase()] ?? RISK_MAP.NORMAL;
            return (
              <div
                key={a.id}
                className="group flex flex-col gap-3 rounded-2xl border border-space-700/80 bg-space-900/70 p-4 transition-all hover:border-space-600 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${riskConfig.dotClass}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display font-bold text-white text-sm">
                        {a.mission_name}
                      </h4>
                      <span className="rounded bg-space-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                        {a.rocket_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {a.agency}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      {a.delay_reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-space-800/80 pt-2 sm:border-t-0 sm:pt-0 sm:justify-end shrink-0">
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${riskConfig.badgeClass}`}>
                      {riskConfig.label}
                    </span>
                    <p className="mt-1 font-mono text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {new Date(a.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={isPending && deletingId === a.id}
                    title="Delete audit entry"
                    aria-label="Delete audit"
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-950 hover:text-rose-400 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
