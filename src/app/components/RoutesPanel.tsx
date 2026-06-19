import { Shield, Clock, Users, ChevronRight, Star, AlertTriangle } from "lucide-react";
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
    color: "#6366f1",
    highlights: ["High foot traffic", "Shops open late"],
    alerts: 0,
  },
];

export function RoutesPanel({ activeRoute, onSelectRoute }: RoutesPanelProps) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-col gap-4 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-semibold">Safe Routes</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Hyde Park → 42 Oak Street</p>
        </div>
        <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs px-2.5 py-1.5 rounded-full">
          <Shield size={11} />
          <span>Analyzed</span>
        </div>
      </div>

      <div className="space-y-3">
        {ROUTES.map((route, i) => (
          <button
            key={route.name}
            onClick={() => onSelectRoute(i)}
            className="w-full text-left rounded-2xl p-4 border transition-all"
            style={{
              background: activeRoute === i ? `${route.color}12` : "#ffffff",
              borderColor: activeRoute === i ? `${route.color}60` : "rgba(0,0,0,0.07)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-foreground font-medium text-sm">{route.name}</span>
                  {i === 0 && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      Best
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Clock size={11} />
                    {route.duration}
                  </span>
                  <span className="text-muted-foreground text-xs">{route.distance}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <Star size={11} style={{ color: route.color }} fill={route.color} />
                  <span className="font-bold text-sm" style={{ color: route.color }}>{route.score}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{route.label}</span>
              </div>
            </div>

            {/* Safety bar */}
            <div className="w-full h-1.5 rounded-full bg-white/10 mb-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${route.score}%`, background: route.color }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {route.highlights.map((h) => (
                  <span key={h} className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                    {h}
                  </span>
                ))}
                {route.alerts > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={9} />
                    {route.alerts} alert
                  </span>
                )}
              </div>
              <ChevronRight size={14} className="text-muted-foreground ml-2 shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Safe spot info */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold">Safe Spots Nearby</span>
        </div>
        <div className="space-y-2">
          {[
            { name: "7-Eleven Convenience", dist: "200m", open: true },
            { name: "Central Police Station", dist: "450m", open: true },
            { name: "Hyde Park Pharmacy", dist: "320m", open: false },
          ].map((spot) => (
            <div key={spot.name} className="flex items-center justify-between">
              <span className="text-foreground/80 text-xs">{spot.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">{spot.dist}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: spot.open ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)",
                    color: spot.open ? "#10b981" : "#9d8fc2",
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
