import { Shield, Clock, ChevronRight, Star, AlertTriangle, Navigation } from "lucide-react";
import { motion } from "motion/react";

interface RoutesPanelProps {
  activeRoute: number;
  onSelectRoute: (i: number) => void;
}

const ROUTES = [
  {
    name: "Safest Route",
    duration: "18 min",
    distance: "1.4 km",
    score: 94,
    label: "Recommended",
    color: "#10b981",
    highlights: ["Well-lit streets", "Busy area", "2 safe spots"],
    alerts: 0,
  },
  {
    name: "Fastest Route",
    duration: "11 min",
    distance: "0.9 km",
    score: 71,
    label: "Moderate",
    color: "#f59e0b",
    highlights: ["Shorter path", "Moderate lighting"],
    alerts: 1,
  },
  {
    name: "Busy Roads",
    duration: "15 min",
    distance: "1.2 km",
    score: 85,
    label: "Good",
    color: "#c94076",
    highlights: ["High foot traffic", "Shops open late"],
    alerts: 0,
  },
];

export function RoutesPanel({ activeRoute, onSelectRoute }: RoutesPanelProps) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-col gap-3 p-4"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground font-bold text-sm">Safe Routes</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">Hyde Park → 42 Oak Street</p>
        </div>
        <div
          className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-full font-semibold"
          style={{ background: "rgba(16,185,129,0.13)", color: "#0b7a54", border: "1px solid rgba(16,185,129,0.25)" }}
        >
          <Shield size={10} />
          AI Analyzed
        </div>
      </div>

      {/* Route cards */}
      <div className="space-y-2.5">
        {ROUTES.map((route, i) => {
          const isActive = activeRoute === i;
          return (
            <button
              key={route.name}
              onClick={() => onSelectRoute(i)}
              className="w-full text-left rounded-2xl p-4 transition-all"
              style={{
                background: isActive ? `${route.color}10` : "#ffffff",
                border: isActive
                  ? `2px solid ${route.color}`
                  : "1.5px solid rgba(28,15,24,0.09)",
                boxShadow: isActive
                  ? `0 4px 20px ${route.color}25`
                  : "0 1px 4px rgba(28,15,24,0.05)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-foreground font-bold text-sm">{route.name}</span>
                    {i === 0 && (
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#0b7a54" }}
                      >
                        BEST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#6e4a60" }}>
                      <Clock size={11} />
                      <span className="font-semibold">{route.duration}</span>
                    </span>
                    <span className="text-xs" style={{ color: "#6e4a60" }}>{route.distance}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                    style={{ background: `${route.color}15`, border: `1px solid ${route.color}35` }}
                  >
                    <Star size={11} style={{ color: route.color }} fill={route.color} />
                    <span className="font-bold text-base" style={{ color: route.color }}>{route.score}</span>
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: "#6e4a60" }}>{route.label}</span>
                </div>
              </div>

              {/* Safety bar */}
              <div className="w-full h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(28,15,24,0.07)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${route.score}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ background: `linear-gradient(90deg, ${route.color}aa, ${route.color})` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {route.highlights.map((h) => (
                    <span
                      key={h}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(28,15,24,0.06)", color: "#6e4a60" }}
                    >
                      {h}
                    </span>
                  ))}
                  {route.alerts > 0 && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: "#b45309", background: "rgba(245,158,11,0.12)" }}
                    >
                      <AlertTriangle size={9} />
                      {route.alerts} alert
                    </span>
                  )}
                </div>
                <ChevronRight size={14} style={{ color: isActive ? route.color : "#6e4a60" }} className="ml-2 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Safe spots */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(16,185,129,0.03))",
          border: "1.5px solid rgba(16,185,129,0.22)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.18)" }}>
            <Shield size={12} style={{ color: "#059669" }} />
          </div>
          <span className="text-sm font-bold" style={{ color: "#059669" }}>Safe Spots Nearby</span>
        </div>
        <div className="space-y-2.5">
          {[
            { name: "7-Eleven Convenience", dist: "200m", open: true },
            { name: "Central Police Station", dist: "450m", open: true },
            { name: "Hyde Park Pharmacy", dist: "320m", open: false },
          ].map((spot) => (
            <div key={spot.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation size={10} style={{ color: "#6e4a60" }} />
                <span className="text-xs font-medium" style={{ color: "#1c0f18" }}>{spot.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#6e4a60" }}>{spot.dist}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: spot.open ? "rgba(16,185,129,0.15)" : "rgba(28,15,24,0.06)",
                    color: spot.open ? "#059669" : "#6e4a60",
                  }}
                >
                  {spot.open ? "Open" : "Closed"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
