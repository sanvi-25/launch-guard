"use client";

import { useState, useTransition } from "react";
import { X, Send, ShieldAlert, Rocket, Building2 } from "lucide-react";
import { logRiskAudit } from "../actions";
import type { RiskLevel } from "@/lib/api-sync";

interface CustomAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditLogged: (msg: string, success: boolean) => void;
}

export default function CustomAuditModal({ isOpen, onClose, onAuditLogged }: CustomAuditModalProps) {
  const [mission, setMission] = useState("");
  const [rocket, setRocket] = useState("");
  const [agency, setAgency] = useState("SpaceX");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("HIGH");
  const [delayReason, setDelayReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mission.trim() || !rocket.trim() || !delayReason.trim()) {
      alert("Please fill in the mission name, vehicle, and delay reason.");
      return;
    }

    startTransition(async () => {
      const res = await logRiskAudit({
        mission: mission.trim(),
        rocket: rocket.trim(),
        agency: agency.trim(),
        riskLevel,
        delayReason: delayReason.trim(),
      });

      if (res.ok) {
        onAuditLogged(`Custom audit logged for ${mission}`, true);
        setMission("");
        setRocket("");
        setDelayReason("");
        onClose();
      } else {
        onAuditLogged(`Database error: ${res.error}`, false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-space-950/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-space-600 bg-space-900 p-6 shadow-2xl shadow-sky-950/60 sm:p-7">
        <div className="flex items-center justify-between border-b border-space-700/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Log Custom Risk Audit</h2>
              <p className="text-xs text-slate-400">Record a new mission delay signal to Neon DB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full bg-space-950/80 p-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300">
              Mission Name
            </label>
            <input
              type="text"
              required
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="e.g. Starship Flight 8 or GPS III SV07"
              className="mt-1.5 w-full rounded-xl border border-space-700 bg-space-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300">
                Rocket Vehicle
              </label>
              <input
                type="text"
                required
                value={rocket}
                onChange={(e) => setRocket(e.target.value)}
                placeholder="e.g. Starship, Falcon 9, Ariane 6"
                className="mt-1.5 w-full rounded-xl border border-space-700 bg-space-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300">
                Agency / Provider
              </label>
              <select
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-space-700 bg-space-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              >
                <option value="SpaceX">SpaceX</option>
                <option value="NASA">NASA</option>
                <option value="Rocket Lab">Rocket Lab</option>
                <option value="United Launch Alliance (ULA)">ULA</option>
                <option value="Arianespace / ESA">Arianespace / ESA</option>
                <option value="ISRO">ISRO</option>
                <option value="Blue Origin">Blue Origin</option>
                <option value="Other">Other Aerospace</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300">
              Risk Severity
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(["HIGH", "MEDIUM", "NORMAL"] as RiskLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRiskLevel(level)}
                  className={`rounded-xl border p-2 text-center font-bold transition-all ${
                    riskLevel === level
                      ? level === "HIGH"
                        ? "border-rose-400 bg-rose-950/80 text-rose-200 ring-2 ring-rose-500/20"
                        : level === "MEDIUM"
                        ? "border-amber-400 bg-amber-950/80 text-amber-200 ring-2 ring-amber-500/20"
                        : "border-emerald-400 bg-emerald-950/80 text-emerald-200 ring-2 ring-emerald-500/20"
                      : "border-space-700 bg-space-950/60 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {level === "HIGH" ? "Critical Risk" : level === "MEDIUM" ? "Watchlist" : "Clear"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300">
              Delay Reason / Telemetry Notes
            </label>
            <textarea
              required
              rows={3}
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              placeholder="e.g. Ground support helium valve leak identified during static fire countdown..."
              className="mt-1.5 w-full rounded-xl border border-space-700 bg-space-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-sky-600/30 transition-all hover:from-sky-400 hover:to-blue-500 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPending ? "Connecting to Neon Database…" : "Save Audit Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
