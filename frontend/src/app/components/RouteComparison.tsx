import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown, CheckCircle2 } from "lucide-react";

const ROUTES = [
  {
    name: "Safest",
    color: "#10b981",
    time: "18 min",
    distance: "1.4 km",
    safetyScore: 94,
    crowd: "High",
    lighting: "Excellent",
    harassRisk: "Very Low",
    emergencyAccess: "Excellent",
    highlights: ["Well-lit entire route", "High foot traffic", "2 police stations nearby"],
    warnings: [],
  },
  {
    name: "Fastest",
    color: "#f59e0b",
    time: "11 min",
    distance: "0.9 km",
    safetyScore: 71,
    crowd: "Moderate",
    lighting: "Fair",
    harassRisk: "Moderate",
    emergencyAccess: "Good",
    highlights: ["Shortest distance", "Near main road"],
    warnings: ["1 harassment report nearby"],
  },
  {
    name: "Busy",
    color: "#c94076",
    time: "15 min",
    distance: "1.2 km",
    safetyScore: 85,
    crowd: "Very High",
    lighting: "Good",
    harassRisk: "Low",
    emergencyAccess: "Very Good",
    highlights: ["Shops open late", "High foot traffic"],
    warnings: [],
  },
];

const METRICS = [
  { key: "time", label: "Travel Time" },
  { key: "distance", label: "Distance" },
  { key: "safetyScore", label: "Safety Score" },
  { key: "crowd", label: "Crowd" },
  { key: "lighting", label: "Lighting" },
  { key: "harassRisk", label: "Harass. Risk" },
  { key: "emergencyAccess", label: "Emergency" },
];

type RouteKey = typeof ROUTES[0];

const QUALITY_COLORS: Record<string, string> = {
  "Very Low": "#10b981", Low: "#10b981",
  Moderate: "#f59e0b", High: "#f07c4a", "Very High": "#f07c4a",
  Excellent: "#10b981", "Very Good": "#10b981", Good: "#f07c4a", Fair: "#f59e0b",
};

function CellValue({ metric, route }: { metric: string; route: RouteKey }) {
  const val = route[metric as keyof RouteKey];
  if (metric === "safetyScore") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="font-bold text-sm" style={{ color: route.color }}>{val}</span>
        <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,15,24,0.08)" }}>
          <div className="h-full rounded-full" style={{ width: `${val}%`, background: route.color }} />
        </div>
      </div>
    );
  }
  const textColor = QUALITY_COLORS[String(val)];
  return (
    <span className="text-[10px] font-semibold text-center block" style={{ color: textColor || "#1c0f18" }}>
      {String(val)}
    </span>
  );
}

interface RouteComparisonProps {
  onClose: () => void;
  onSelect: (i: number) => void;
  activeRoute: number;
}

export function RouteComparison({ onClose, onSelect, activeRoute }: RouteComparisonProps) {
  const [showExp, setShowExp] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="relative w-full max-w-sm rounded-t-3xl"
        style={{ maxHeight: "88vh", overflowY: "auto", scrollbarWidth: "none", background: "#faf4f7" }}
      >
        {/* Sticky header — dark */}
        <div
          className="sticky top-0 z-10 px-4 pt-5 pb-4"
          style={{
            background: "linear-gradient(135deg, #1c0f18, #2e1424)",
            borderRadius: "24px 24px 0 0",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold">Compare Routes</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Hyde Park → 42 Oak Street</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <X size={15} style={{ color: "rgba(255,255,255,0.7)" }} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Route selector headers */}
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            <div />
            {ROUTES.map((r, i) => (
              <button
                key={r.name}
                onClick={() => { onSelect(i); onClose(); }}
                className="rounded-xl p-2 text-center transition-all"
                style={{
                  background: activeRoute === i ? `${r.color}15` : "#ffffff",
                  border: `2px solid ${activeRoute === i ? r.color : "rgba(28,15,24,0.09)"}`,
                  boxShadow: activeRoute === i ? `0 2px 10px ${r.color}30` : "0 1px 3px rgba(28,15,24,0.05)",
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ background: r.color }} />
                <span className="text-[10px] font-bold" style={{ color: r.color }}>{r.name}</span>
                {activeRoute === i && (
                  <div className="text-[9px] font-bold text-emerald-500 mt-0.5">✓ Active</div>
                )}
              </button>
            ))}
          </div>

          {/* Comparison table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 6px rgba(28,15,24,0.05)" }}
          >
            {METRICS.map((m, mi) => (
              <div
                key={m.key}
                className="grid grid-cols-4"
                style={{ background: mi % 2 === 0 ? "#ffffff" : "rgba(28,15,24,0.02)" }}
              >
                <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid rgba(28,15,24,0.07)" }}>
                  <span className="text-[10px] font-semibold" style={{ color: "#6e4a60" }}>{m.label}</span>
                </div>
                {ROUTES.map((r, ri) => (
                  <div
                    key={r.name}
                    className="px-2 py-3 flex items-center justify-center"
                    style={{ borderRight: ri < ROUTES.length - 1 ? "1px solid rgba(28,15,24,0.07)" : "none" }}
                  >
                    <CellValue metric={m.key} route={r} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Why each route */}
          <p className="text-foreground text-sm font-bold mt-5 mb-3">Why Each Route?</p>
          <div className="space-y-2">
            {ROUTES.map((r, i) => (
              <div
                key={r.name}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#ffffff",
                  border: `1.5px solid ${showExp === i ? r.color + "55" : "rgba(28,15,24,0.09)"}`,
                  boxShadow: showExp === i ? `0 2px 12px ${r.color}20` : "0 1px 3px rgba(28,15,24,0.04)",
                }}
              >
                <button
                  className="w-full flex items-center justify-between p-3.5"
                  onClick={() => setShowExp(showExp === i ? null : i)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                    <span className="text-foreground text-sm font-bold">{r.name} Route</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: `${r.color}15`, color: r.color }}
                    >
                      {r.safetyScore}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className="text-muted-foreground transition-transform"
                    style={{ transform: showExp === i ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <AnimatePresence>
                  {showExp === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                      <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(28,15,24,0.07)" }}>
                        {r.highlights.length > 0 && (
                          <div className="mt-3 mb-2">
                            <p className="text-[10px] font-bold text-emerald-600 mb-1.5">✅ Why it's good</p>
                            {r.highlights.map((h) => (
                              <p key={h} className="text-xs mb-1" style={{ color: "#6e4a60" }}>• {h}</p>
                            ))}
                          </div>
                        )}
                        {r.warnings.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] font-bold mb-1.5" style={{ color: "#b45309" }}>⚠️ Watch out for</p>
                            {r.warnings.map((w) => (
                              <p key={w} className="text-xs" style={{ color: "#6e4a60" }}>• {w}</p>
                            ))}
                          </div>
                        )}
                        {r.warnings.length === 0 && r.highlights.length > 0 && (
                          <p className="text-xs mt-1" style={{ color: "#6e4a60" }}>No active warnings on this route.</p>
                        )}
                        <button
                          onClick={() => { onSelect(i); onClose(); }}
                          className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}bb)`, boxShadow: `0 3px 12px ${r.color}40` }}
                        >
                          Use {r.name} Route
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Special routes */}
          <p className="text-foreground text-sm font-bold mt-5 mb-3">Special Routes</p>
          <div className="space-y-2">
            {[
              { name: "Late Night Route", score: 88, desc: "Maximises lighting & populated streets after 10PM.", color: "#d94f86", time: "22 min" },
              { name: "Emergency Route", score: 96, desc: "Passes 3 police stations & 2 hospitals.", color: "#f43f5e", time: "25 min" },
            ].map((r) => (
              <div
                key={r.name}
                className="rounded-2xl p-3.5 flex items-start gap-3"
                style={{
                  background: "#ffffff",
                  border: `1.5px solid ${r.color}35`,
                  boxShadow: `0 1px 6px ${r.color}15`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: r.color }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-foreground text-sm font-bold">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#6e4a60" }}>{r.time}</span>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                        style={{ background: `${r.color}15`, color: r.color }}
                      >
                        {r.score}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "#6e4a60" }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
