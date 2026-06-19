import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, ChevronDown, Info } from "lucide-react";

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
    name: "Busy Roads",
    color: "#6366f1",
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
  { key: "crowd", label: "Crowd Activity" },
  { key: "lighting", label: "Lighting" },
  { key: "harassRisk", label: "Harassment Risk" },
  { key: "emergencyAccess", label: "Emergency Access" },
];

type RouteKey = typeof ROUTES[0];

function CellValue({ metric, route }: { metric: string; route: RouteKey }) {
  const val = route[metric as keyof RouteKey];
  if (metric === "safetyScore") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="font-bold text-sm" style={{ color: route.color }}>{val}</span>
        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${val}%`, background: route.color }} />
        </div>
      </div>
    );
  }
  const riskColors: Record<string, string> = {
    "Very Low": "#10b981", Low: "#10b981", Moderate: "#f59e0b", High: "#f43f5e", "Very High": "#f43f5e",
    Excellent: "#10b981", "Very Good": "#10b981", Good: "#6366f1", Fair: "#f59e0b",
  };
  const textColor = riskColors[String(val)];
  return (
    <span className="text-xs font-medium text-center block" style={{ color: textColor || "#1e0a3c" }}>
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
  const [showExplanation, setShowExplanation] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="relative w-full max-w-sm rounded-t-3xl bg-background"
        style={{ maxHeight: "85vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 bg-background z-10 px-4 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground font-semibold">Compare Routes</h3>
            <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">Hyde Park → 42 Oak Street</p>
        </div>

        <div className="p-4">
          {/* Route headers */}
          <div className="grid grid-cols-4 gap-1 mb-4">
            <div />
            {ROUTES.map((r, i) => (
              <button
                key={r.name}
                onClick={() => { onSelect(i); onClose(); }}
                className="rounded-xl p-2 text-center transition-all"
                style={{
                  background: activeRoute === i ? `${r.color}15` : "rgba(0,0,0,0.04)",
                  border: `2px solid ${activeRoute === i ? r.color : "transparent"}`,
                }}
              >
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: r.color }} />
                <span className="text-[10px] font-semibold" style={{ color: r.color }}>{r.name}</span>
                {activeRoute === i && <div className="text-[9px] text-emerald-500 mt-0.5">Selected</div>}
              </button>
            ))}
          </div>

          {/* Comparison table */}
          <div className="rounded-2xl overflow-hidden border border-border">
            {METRICS.map((m, mi) => (
              <div key={m.key} className="grid grid-cols-4 gap-0" style={{ background: mi % 2 === 0 ? "rgba(0,0,0,0.02)" : "#ffffff" }}>
                <div className="px-3 py-3 flex items-center">
                  <span className="text-[10px] text-muted-foreground font-medium leading-tight">{m.label}</span>
                </div>
                {ROUTES.map((r) => (
                  <div key={r.name} className="px-2 py-3 flex items-center justify-center border-l border-border/50">
                    <CellValue metric={m.key} route={r} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Route explanation cards */}
          <p className="text-foreground text-sm font-semibold mt-4 mb-2">Why Each Route?</p>
          <div className="space-y-2">
            {ROUTES.map((r, i) => (
              <div key={r.name} className="rounded-2xl bg-card border border-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setShowExplanation(showExplanation === i ? null : i)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                    <span className="text-foreground text-sm font-medium">{r.name} Route</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${r.color}15`, color: r.color }}>{r.safetyScore}</span>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground" style={{ transform: showExplanation === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                <AnimatePresence>
                  {showExplanation === i && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="px-4 pb-4">
                        {r.highlights.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] font-semibold text-emerald-600 mb-1">✅ Why it's good</p>
                            {r.highlights.map((h) => (
                              <p key={h} className="text-xs text-muted-foreground">• {h}</p>
                            ))}
                          </div>
                        )}
                        {r.warnings.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-accent mb-1">⚠️ Watch out for</p>
                            {r.warnings.map((w) => (
                              <p key={w} className="text-xs text-muted-foreground">• {w}</p>
                            ))}
                          </div>
                        )}
                        {r.warnings.length === 0 && (
                          <p className="text-xs text-muted-foreground">No active warnings on this route.</p>
                        )}
                        <button
                          onClick={() => { onSelect(i); onClose(); }}
                          className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-white"
                          style={{ background: r.color }}
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

          {/* Late night + emergency routes */}
          <p className="text-foreground text-sm font-semibold mt-4 mb-2">Special Routes</p>
          <div className="space-y-2">
            {[
              { name: "Late Night Route", score: 88, desc: "Maximises lighting & populated streets after 10PM", color: "#a855f7", time: "22 min" },
              { name: "Emergency Route", score: 96, desc: "Passes 3 police stations & 2 hospitals. Use if unsafe.", color: "#f43f5e", time: "25 min" },
            ].map((r) => (
              <div key={r.name} className="rounded-2xl p-3.5 bg-card border flex items-start gap-3" style={{ borderColor: `${r.color}30` }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: r.color }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-foreground text-sm font-medium">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{r.time}</span>
                      <span className="text-xs font-bold" style={{ color: r.color }}>{r.score}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
