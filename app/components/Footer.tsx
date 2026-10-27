import { Rocket, Radio, Shield, ExternalLink, Heart, Globe, Terminal, Download, Package } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-space-800 bg-space-950/90 pt-12 pb-16 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white">
                <Rocket className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-black text-white">
                Launch<span className="text-sky-400">Guard</span>
              </span>
              <span className="rounded bg-sky-950 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-400 border border-sky-800/60">
                PROD v2.0
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-400">
              Autonomous aerospace and defense intelligence platform. Fusing orbital launch schedules, NLP sentiment from 50+ space news channels, spaceport weather, and automated supplier spare part dispatch.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span>TELEMETRY ACTIVE</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-300 flex items-center gap-1">
                <Package className="h-3 w-3 text-amber-400" />
                <span>SUPPLIER DISPATCH ONLINE</span>
              </span>
            </div>

            <div className="pt-2">
              <a
                href="/api/download-zip"
                download="launchguard.zip"
                className="inline-flex items-center gap-2 rounded-xl border border-space-700 bg-space-900 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-sky-400 hover:text-white"
              >
                <Download className="h-3.5 w-3.5 text-sky-400" />
                <span>Download Entire Project (.ZIP)</span>
              </a>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Intelligence Feeds
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a
                  href="https://thespacedevs.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-sky-300"
                >
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                  TheSpaceDevs 2.2.0 API
                </a>
              </li>
              <li>
                <a
                  href="https://spaceflightnewsapi.net"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-sky-300"
                >
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                  Spaceflight News API v4
                </a>
              </li>
              <li>
                <a
                  href="https://api.nasa.gov"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-sky-300"
                >
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                  NASA APOD API
                </a>
              </li>
              <li>
                <a
                  href="https://neon.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-sky-300"
                >
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                  Neon Serverless PostgreSQL
                </a>
              </li>
            </ul>
          </div>

          {/* Spaceport Ranges */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Monitored Spaceports
            </h4>
            <ul className="mt-3 space-y-1.5 font-mono text-[11px] text-slate-400">
              <li>• Cape Canaveral SFS / KSC (USA)</li>
              <li>• Starbase Orbital Pad (Boca Chica)</li>
              <li>• Vandenberg Space Force Base (USA)</li>
              <li>• Guiana Space Centre (Kourou, ESA)</li>
              <li>• Māhia Peninsula LC-1 (New Zealand)</li>
              <li>• Satish Dhawan SHAR (India)</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-space-850 pt-8 sm:flex-row">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} LaunchGuard Aerospace Intelligence. Designed for mission controllers and supply chain planners.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Security Classification: UNCLASSIFIED</span>
            <span>•</span>
            <span className="font-mono text-sky-400">STATUS: NOMINAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
