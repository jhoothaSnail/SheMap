import { Shield, Clock, ChevronRight, Star, Sparkles, Navigation } from "lucide-react";
import { motion } from "motion/react";
import type { ScoredRoute } from "../api/api";

interface RoutesPanelProps {
  routes: ScoredRoute[];
  activeRoute: number;
  destinationLabel?: string;
  onSelectRoute: (i: number) => void;
}

function levelColor(level: ScoredRoute["level"]): string {
  if (level === "safe") return "#10b981";
  if (level === "moderate") return "#f59e0b";
  return "#f43f5e";
}

function levelLabel(level: ScoredRoute["level"]): string {
  if (level === "safe") return "Safe";
  if (level === "moderate") return "Moderate";
  if (level === "risky") return "Use caution";
  return "Unsafe";
}

export function RoutesPanel({ routes, activeRoute, destinationLabel, onSelectRoute }: RoutesPanelProps) {
  if (!routes.length) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center">
        <Navigation size={22} className="text-primary" />
        <p className="text-foreground font-bold text-sm">No route yet</p>
        <p className="text-muted-foreground text-[11px]">Search a destination to see safety-ranked routes.</p>
      </div>
    );
  }

  const active = routes[activeRoute] ?? routes[0];

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-col gap-3 p-4"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-foreground font-bold text-sm">Safe Routes</p>
          {destinationLabel && (
            <p className="text-muted-foreground text-[11px] mt-0.5 truncate">To {destinationLabel}</p>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-full font-semibold shrink-0"
          style={{ background: "rgba(16,185,129,0.13)", color: "#0b7a54", border: "1px solid rgba(16,185,129,0.25)" }}
        >
          <Shield size={10} />
          AI Analyzed
        </div>
      </div>

      {/* Route cards */}
      <div className="space-y-2.5">
        {routes.map((route, i) => {
          const isActive = activeRoute === i;
          const color = levelColor(route.level);
          return (
            <button
              key={route.index}
              onClick={() => onSelectRoute(i)}
              className="w-full text-left rounded-2xl p-4 transition-all"
              style={{
                background: isActive ? `${color}10` : "#ffffff",
                border: isActive ? `2px solid ${color}` : "1.5px solid rgba(28,15,24,0.09)",
                boxShadow: isActive ? `0 4px 20px ${color}25` : "0 1px 4px rgba(28,15,24,0.05)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-foreground font-bold text-sm">
                      {route.recommended ? "Safest Route" : `Route ${i + 1}`}
                    </span>
                    {route.recommended && (
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#0b7a54" }}
                      >
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#6e4a60" }}>
                      <Clock size={11} />
                      <span className="font-semibold">{Math.round(route.eta_minutes)} min</span>
                    </span>
                    <span className="text-xs" style={{ color: "#6e4a60" }}>{route.distance_km} km</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                    style={{ background: `${color}15`, border: `1px solid ${color}35` }}
                  >
                    <Star size={11} style={{ color }} fill={color} />
                    <span className="font-bold text-base" style={{ color }}>{Math.round(route.safety_score)}</span>
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: "#6e4a60" }}>{levelLabel(route.level)}</span>
                </div>
              </div>

              {/* Safety bar */}
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,15,24,0.07)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${route.safety_score}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
                />
              </div>

              <div className="flex items-center justify-end mt-2">
                <ChevronRight size={14} style={{ color: isActive ? color : "#6e4a60" }} className="shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* AI explanation card for the selected/recommended route */}
      {active.ai_explanation && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(201,64,118,0.07), rgba(240,124,74,0.05))",
            border: "1.5px solid rgba(201,64,118,0.22)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,64,118,0.15)" }}>
              <Sparkles size={12} style={{ color: "#c94076" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: "#c94076" }}>SheMaps AI</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#1c0f18" }}>{active.ai_explanation}</p>
        </div>
      )}
    </motion.div>
  );
}
