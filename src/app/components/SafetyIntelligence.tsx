import { useState } from "react";
import { motion } from "motion/react";
import { Shield, Eye, Users, Zap, AlertTriangle, Home, Star, Cloud, Moon, ChevronRight, Info, TrendingDown, TrendingUp } from "lucide-react";

const SCORES = [
  { label: "Lighting", icon: Zap, score: 78, color: "#f59e0b", trend: "up" },
  { label: "Human Presence", icon: Users, score: 85, color: "#6366f1", trend: "up" },
  { label: "Isolation", icon: Eye, score: 62, color: "#f43f5e", trend: "down" },
  { label: "Crowd Quality", icon: Star, score: 80, color: "#10b981", trend: "stable" },
  { label: "Harassment Risk", icon: AlertTriangle, score: 71, color: "#f43f5e", trend: "down" },
  { label: "Safe Havens", icon: Home, score: 90, color: "#10b981", trend: "up" },
  { label: "Community Trust", icon: Shield, score: 88, color: "#7c3aed", trend: "up" },
  { label: "Weather Risk", icon: Cloud, score: 93, color: "#6366f1", trend: "stable" },
  { label: "Night Risk", icon: Moon, score: 55, color: "#f43f5e", trend: "down" },
];

const FORECAST = [
  { time: "Now", label: "6 PM", level: "safe", score: 82, color: "#10b981" },
  { time: "2h", label: "8 PM", level: "moderate", score: 67, color: "#f59e0b" },
  { time: "4h", label: "10 PM", level: "risky", score: 48, color: "#f97316" },
  { time: "6h", label: "12 AM", level: "unsafe", score: 31, color: "#f43f5e" },
  { time: "8h", label: "2 AM", level: "unsafe", score: 24, color: "#f43f5e" },
];

const RISK_FACTORS = [
  { icon: "🏪", label: "Shops Closing", impact: -12, time: "9 PM", detail: "Most retail closes, reducing foot traffic" },
  { icon: "👥", label: "Crowd Reduction", impact: -18, time: "10 PM", detail: "Peak crowd leaves after shows & events" },
  { icon: "🌧️", label: "Rain Forecast", impact: -8, time: "11 PM", detail: "Light rain expected, reduces street presence" },
  { icon: "🚌", label: "Public Transport", impact: -14, time: "11:30 PM", detail: "Last buses at 11:40 PM on this route" },
  { icon: "🎵", label: "Event Dispersal", impact: +6, time: "9 PM", detail: "Hyde Park concert ends, high foot traffic briefly" },
];

const DATA_SOURCES = [
  { name: "Community Reports", count: 247, freshness: "2 min" },
  { name: "Street Light Data", count: 1840, freshness: "1 hr" },
  { name: "Transit APIs", count: 12, freshness: "Live" },
  { name: "Weather Services", count: 3, freshness: "15 min" },
  { name: "Crime Statistics", count: 8920, freshness: "Daily" },
];

function ScoreRing({ score, color, size = 36 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

type SubView = "overview" | "forecast" | "confidence";

export function SafetyIntelligence() {
  const [subView, setSubView] = useState<SubView>("overview");
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null);
  const overallScore = Math.round(SCORES.reduce((s, d) => s + d.score, 0) / SCORES.length);

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">
      {/* Header + overall score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-semibold">Safety Intelligence</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Hyde Park · Updated 2 min ago</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative w-14 h-14">
            <ScoreRing score={overallScore} color="#7c3aed" size={56} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-primary">{overallScore}</span>
              <span className="text-[9px] text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(0,0,0,0.04)" }}>
        {(["overview", "forecast", "confidence"] as SubView[]).map((v) => (
          <button
            key={v}
            onClick={() => setSubView(v)}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all capitalize"
            style={{
              background: subView === v ? "#ffffff" : "transparent",
              color: subView === v ? "#7c3aed" : "#7c6a9e",
              boxShadow: subView === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {v === "confidence" ? "AI Confidence" : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {subView === "overview" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {SCORES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl p-3 flex flex-col items-center gap-1.5 bg-card border border-border">
                  <div className="relative">
                    <ScoreRing score={s.score} color={s.color} size={40} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon size={12} style={{ color: s.color }} />
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: s.color }}>{s.score}</span>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight">{s.label}</span>
                  <span className="text-[9px]" style={{ color: s.trend === "up" ? "#10b981" : s.trend === "down" ? "#f43f5e" : "#7c6a9e" }}>
                    {s.trend === "up" ? "↑" : s.trend === "down" ? "↓" : "→"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Future Risk Factors */}
          <div>
            <p className="text-foreground text-sm font-semibold mb-2">Future Risk Factors</p>
            <div className="space-y-2">
              {RISK_FACTORS.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedFactor(expandedFactor === i ? null : i)}
                  className="w-full text-left rounded-2xl p-3 bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{f.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground text-sm font-medium">{f.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground text-xs">{f.time}</span>
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                            style={{
                              color: f.impact < 0 ? "#f43f5e" : "#10b981",
                              background: f.impact < 0 ? "rgba(244,63,94,0.1)" : "rgba(16,185,129,0.1)",
                            }}
                          >
                            {f.impact > 0 ? "+" : ""}{f.impact}
                          </span>
                        </div>
                      </div>
                      {expandedFactor === i && (
                        <p className="text-muted-foreground text-xs mt-1">{f.detail}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* FORECAST */}
      {subView === "forecast" && (
        <>
          <div className="rounded-2xl p-4 bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Moon size={14} className="text-primary" />
              <span className="text-foreground text-sm font-semibold">Safety Forecast Tonight</span>
            </div>
            {/* Timeline bar */}
            <div className="flex items-end gap-1 h-24 mb-3">
              {FORECAST.map((f, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold" style={{ color: f.color }}>{f.score}</span>
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${f.score}%`, background: `${f.color}30`, border: `1px solid ${f.color}60` }} />
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {FORECAST.map((f, i) => (
                <div key={i} className="flex-1 text-center">
                  <p className="text-[10px] font-medium text-foreground">{f.label}</p>
                  <p
                    className="text-[9px] px-1 py-0.5 rounded-full mt-0.5 capitalize"
                    style={{ background: `${f.color}15`, color: f.color }}
                  >
                    {f.level}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations by time */}
          <div className="space-y-2">
            <p className="text-foreground text-sm font-semibold">Time-Based Recommendations</p>
            {[
              { time: "Before 9 PM", rec: "Safe to walk. Most routes clear.", color: "#10b981", icon: "✅" },
              { time: "9 PM – 10 PM", rec: "Use Safest Route. Avoid park shortcuts.", color: "#f59e0b", icon: "⚠️" },
              { time: "After 10 PM", rec: "Take cab. Share live location. Avoid Oak St.", color: "#f43f5e", icon: "🚨" },
            ].map((r) => (
              <div key={r.time} className="rounded-2xl p-3 bg-card border border-border flex items-start gap-3">
                <span>{r.icon}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: r.color }}>{r.time}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.rec}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CONFIDENCE */}
      {subView === "confidence" && (
        <>
          <div className="rounded-2xl p-4 bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-foreground text-sm font-semibold">AI Confidence Score</span>
              <span className="text-2xl font-bold text-primary">87%</span>
            </div>
            {/* Confidence bar */}
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-4">
              <div className="h-full rounded-full bg-primary" style={{ width: "87%" }} />
            </div>
            <p className="text-muted-foreground text-xs">
              High confidence. Based on 5 data sources with recent community activity. Score reliability is strong.
            </p>
          </div>

          {/* Data sources */}
          <div>
            <p className="text-foreground text-sm font-semibold mb-2">Data Sources Used</p>
            <div className="space-y-2">
              {DATA_SOURCES.map((ds) => (
                <div key={ds.name} className="flex items-center justify-between rounded-xl p-3 bg-card border border-border">
                  <div>
                    <p className="text-foreground text-xs font-medium">{ds.name}</p>
                    <p className="text-muted-foreground text-[11px]">{ds.count.toLocaleString()} data points</p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-1 rounded-full"
                    style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
                  >
                    {ds.freshness}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-3 bg-card border border-border">
            <p className="text-xs font-semibold text-foreground mb-1">Reasoning</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Score computed from weighted average of 9 dimensions. Community reports contribute 35% weight; infrastructure data 40%; historical patterns 25%. Recent reports from last 2 hours weighted 3× more heavily.
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
