import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown } from "lucide-react";
import type { ScoredRoute } from "../api/api";

interface RouteComparisonProps {
  routes: ScoredRoute[];
  onClose: () => void;
  onSelect: (i: number) => void;
  activeRoute: number;
}

function levelColor(level: ScoredRoute["level"]): string {
  if (level === "safe") return "#10b981";
  if (level === "moderate") return "#f59e0b";
  return "#f43f5e";
}

function levelLabel(level: ScoredRoute["level"]): string {
  if (level === "safe") return "Safe";
  if (level === "moderate") return "Moderate";
  if (level === "risky") return "Caution";
  return "Unsafe";
}

function routeName(r: ScoredRoute, i: number): string {
  return r.recommended ? "Safest" : `Route ${i + 1}`;
}

export function RouteComparison({ routes, onClose, onSelect, activeRoute }: RouteComparisonProps) {
  const [showExp, setShowExp] = useState<number | null>(activeRoute);

  const metrics: { key: keyof ScoredRoute | "level"; label: string }[] = [
    { key: "eta_minutes", label: "Travel Time" },
    { key: "distance_km", label: "Distance" },
    { key: "safety_score", label: "Safety Score" },
    { key: "level", label: "Safety Level" },
  ];

  const cellValue = (m: { key: string }, r: ScoredRoute) => {
    if (m.key === "safety_score") {
      const color = levelColor(r.level);
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-sm" style={{ color }}>{Math.round(r.safety_score)}</span>
          <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,15,24,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: `${r.safety_score}%`, background: color }} />
          </div>
        </div>
      );
    }
    if (m.key === "eta_minutes") {
      return <span className="text-[10px] font-semibold text-center block" style={{ color: "#1c0f18" }}>{Math.round(r.eta_minutes)} min</span>;
    }
    if (m.key === "distance_km") {
      return <span className="text-[10px] font-semibold text-center block" style={{ color: "#1c0f18" }}>{r.distance_km} km</span>;
    }
    return <span className="text-[10px] font-semibold text-center block" style={{ color: levelColor(r.level) }}>{levelLabel(r.level)}</span>;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="relative w-full max-w-sm rounded-t-3xl"
        style={{ maxHeight: "88vh", overflowY: "auto", scrollbarWidth: "none", background: "#faf4f7" }}
      >
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 px-4 pt-5 pb-4"
          style={{ background: "linear-gradient(135deg, #1c0f18, #2e1424)", borderRadius: "24px 24px 0 0" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold">Compare Routes</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {routes.length} route{routes.length > 1 ? "s" : ""} ranked by safety
              </p>
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
          {routes.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "#6e4a60" }}>No routes to compare yet.</p>
          ) : (
            <>
              {/* Route selector headers */}
              <div
                className="grid gap-1.5 mb-4"
                style={{ gridTemplateColumns: `1.2fr repeat(${routes.length}, 1fr)` }}
              >
                <div />
                {routes.map((r, i) => {
                  const color = levelColor(r.level);
                  return (
                    <button
                      key={r.index}
                      onClick={() => { onSelect(i); onClose(); }}
                      className="rounded-xl p-2 text-center transition-all"
                      style={{
                        background: activeRoute === i ? `${color}15` : "#ffffff",
                        border: `2px solid ${activeRoute === i ? color : "rgba(28,15,24,0.09)"}`,
                        boxShadow: activeRoute === i ? `0 2px 10px ${color}30` : "0 1px 3px rgba(28,15,24,0.05)",
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ background: color }} />
                      <span className="text-[10px] font-bold" style={{ color }}>{routeName(r, i)}</span>
                      {activeRoute === i && <div className="text-[9px] font-bold text-emerald-500 mt-0.5">✓ Active</div>}
                    </button>
                  );
                })}
              </div>

              {/* Comparison table */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 6px rgba(28,15,24,0.05)" }}
              >
                {metrics.map((m, mi) => (
                  <div
                    key={m.key as string}
                    className="grid"
                    style={{
                      gridTemplateColumns: `1.2fr repeat(${routes.length}, 1fr)`,
                      background: mi % 2 === 0 ? "#ffffff" : "rgba(28,15,24,0.02)",
                    }}
                  >
                    <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid rgba(28,15,24,0.07)" }}>
                      <span className="text-[10px] font-semibold" style={{ color: "#6e4a60" }}>{m.label}</span>
                    </div>
                    {routes.map((r, ri) => (
                      <div
                        key={r.index}
                        className="px-2 py-3 flex items-center justify-center"
                        style={{ borderRight: ri < routes.length - 1 ? "1px solid rgba(28,15,24,0.07)" : "none" }}
                      >
                        {cellValue(m as { key: string }, r)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Why each route */}
              <p className="text-foreground text-sm font-bold mt-5 mb-3">Why Each Route?</p>
              <div className="space-y-2">
                {routes.map((r, i) => {
                  const color = levelColor(r.level);
                  return (
                    <div
                      key={r.index}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        background: "#ffffff",
                        border: `1.5px solid ${showExp === i ? color + "55" : "rgba(28,15,24,0.09)"}`,
                        boxShadow: showExp === i ? `0 2px 12px ${color}20` : "0 1px 3px rgba(28,15,24,0.04)",
                      }}
                    >
                      <button className="w-full flex items-center justify-between p-3.5" onClick={() => setShowExp(showExp === i ? null : i)}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-foreground text-sm font-bold">{routeName(r, i)} Route</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: `${color}15`, color }}>
                            {Math.round(r.safety_score)}
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
                              <p className="text-xs leading-relaxed mt-3 mb-3" style={{ color: "#6e4a60" }}>
                                {r.ai_explanation
                                  ? r.ai_explanation
                                  : `Safety score ${Math.round(r.safety_score)}/100 (${levelLabel(r.level)}), about ${Math.round(r.eta_minutes)} min over ${r.distance_km} km.`}
                              </p>
                              <button
                                onClick={() => { onSelect(i); onClose(); }}
                                className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
                                style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 3px 12px ${color}40` }}
                              >
                                Use {routeName(r, i)} Route
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
