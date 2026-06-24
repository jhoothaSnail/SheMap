import { useState } from "react";
import { motion } from "motion/react";
import { Shield, Eye, Users, Zap, AlertTriangle, Home, Star, Cloud, Moon } from "lucide-react";

const SCORES = [
  { label: "Lighting", icon: Zap, score: 78, color: "#f59e0b", trend: "up" },
  { label: "Human Presence", icon: Users, score: 85, color: "#f07c4a", trend: "up" },
  { label: "Isolation", icon: Eye, score: 62, color: "#f43f5e", trend: "down" },
  { label: "Crowd Quality", icon: Star, score: 80, color: "#10b981", trend: "stable" },
  { label: "Harassment Risk", icon: AlertTriangle, score: 71, color: "#f43f5e", trend: "down" },
  { label: "Safe Havens", icon: Home, score: 90, color: "#10b981", trend: "up" },
  { label: "Community Trust", icon: Shield, score: 88, color: "#c94076", trend: "up" },
  { label: "Weather Risk", icon: Cloud, score: 93, color: "#f07c4a", trend: "stable" },
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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(28,15,24,0.08)" strokeWidth="3.5" />
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

// Shared sub-nav style used across all panels
function SubNav({ options, active, onChange }: { options: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div
      className="flex gap-1 p-1 rounded-2xl"
      style={{ background: "rgba(28,15,24,0.06)", border: "1px solid rgba(28,15,24,0.07)" }}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: active === opt.id ? "#ffffff" : "transparent",
            color: active === opt.id ? "#c94076" : "#6e4a60",
            boxShadow: active === opt.id ? "0 1px 6px rgba(28,15,24,0.1)" : "none",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SafetyIntelligence() {
  const [subView, setSubView] = useState<SubView>("overview");
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null);
  const overallScore = Math.round(SCORES.reduce((s, d) => s + d.score, 0) / SCORES.length);
  const scoreColor = overallScore >= 80 ? "#10b981" : overallScore >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">

      {/* Header hero — overall score + title on dark strip */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1c0f18 0%, #2e1424 100%)",
          boxShadow: "0 4px 24px rgba(28,15,24,0.2)",
        }}
      >
        <div>
          <p className="font-bold text-white" style={{ fontSize: "1rem" }}>Safety Intelligence</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Hyde Park · Updated 2 min ago</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold" style={{ color: "#34d399" }}>All systems active</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <ScoreRing score={overallScore} color={scoreColor} size={64} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold" style={{ color: scoreColor }}>{overallScore}</span>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>/ 100</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>AREA SCORE</span>
        </div>
      </div>

      {/* Sub-nav */}
      <SubNav
        options={[
          { id: "overview", label: "Overview" },
          { id: "forecast", label: "Forecast" },
          { id: "confidence", label: "AI Confidence" },
        ]}
        active={subView}
        onChange={(v) => setSubView(v as SubView)}
      />

      {/* OVERVIEW */}
      {subView === "overview" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {SCORES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl p-3 flex flex-col items-center gap-1.5"
                  style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.05)" }}
                >
                  <div className="relative">
                    <ScoreRing score={s.score} color={s.color} size={40} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon size={12} style={{ color: s.color }} />
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: s.color }}>{s.score}</span>
                  <span className="text-[9px] text-center leading-tight font-medium" style={{ color: "#6e4a60" }}>{s.label}</span>
                  <span className="text-[9px] font-bold" style={{ color: s.trend === "up" ? "#10b981" : s.trend === "down" ? "#f43f5e" : "#6e4a60" }}>
                    {s.trend === "up" ? "↑ Rising" : s.trend === "down" ? "↓ Falling" : "→ Stable"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Future Risk Factors */}
          <div>
            <p className="text-foreground text-sm font-bold mb-2">Future Risk Factors</p>
            <div className="space-y-2">
              {RISK_FACTORS.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedFactor(expandedFactor === i ? null : i)}
                  className="w-full text-left rounded-2xl p-3 transition-all"
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid rgba(28,15,24,0.09)",
                    boxShadow: "0 1px 4px rgba(28,15,24,0.04)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{f.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground text-sm font-semibold">{f.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: "#6e4a60" }}>{f.time}</span>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-lg"
                            style={{
                              color: f.impact < 0 ? "#dc2626" : "#059669",
                              background: f.impact < 0 ? "rgba(244,63,94,0.1)" : "rgba(16,185,129,0.1)",
                            }}
                          >
                            {f.impact > 0 ? "+" : ""}{f.impact}
                          </span>
                        </div>
                      </div>
                      {expandedFactor === i && (
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#6e4a60" }}>{f.detail}</p>
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
          <div
            className="rounded-2xl p-4"
            style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 8px rgba(28,15,24,0.05)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                <Moon size={13} className="text-primary" />
              </div>
              <span className="text-foreground text-sm font-bold">Safety Forecast Tonight</span>
            </div>
            <div className="flex items-end gap-1 h-24 mb-3">
              {FORECAST.map((f, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold" style={{ color: f.color }}>{f.score}</span>
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${f.score}%`, background: `${f.color}25`, border: `1.5px solid ${f.color}70` }} />
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {FORECAST.map((f, i) => (
                <div key={i} className="flex-1 text-center">
                  <p className="text-[10px] font-semibold text-foreground">{f.label}</p>
                  <p className="text-[9px] px-1 py-0.5 rounded-full mt-0.5 capitalize font-semibold" style={{ background: `${f.color}15`, color: f.color }}>
                    {f.level}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-foreground text-sm font-bold">Time-Based Recommendations</p>
            {[
              { time: "Before 9 PM", rec: "Safe to walk. Most routes clear.", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.22)", icon: "✅" },
              { time: "9 PM – 10 PM", rec: "Use Safest Route. Avoid park shortcuts.", color: "#b45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: "⚠️" },
              { time: "After 10 PM", rec: "Take cab. Share live location. Avoid Oak St.", color: "#dc2626", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", icon: "🚨" },
            ].map((r) => (
              <div
                key={r.time}
                className="rounded-2xl p-3.5 flex items-start gap-3"
                style={{ background: r.bg, border: `1.5px solid ${r.border}` }}
              >
                <span className="text-base mt-0.5">{r.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: r.color }}>{r.time}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6e4a60" }}>{r.rec}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CONFIDENCE */}
      {subView === "confidence" && (
        <>
          {/* Hero confidence card */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, #1c0f18, #2e1424)",
              boxShadow: "0 4px 24px rgba(28,15,24,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-bold">AI Confidence Score</span>
              <span className="text-3xl font-bold" style={{ color: "#c94076" }}>87%</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "87%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ background: "linear-gradient(90deg, #c94076, #f07c4a)" }}
              />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              High confidence. Based on 5 data sources with recent community activity.
            </p>
          </div>

          <div>
            <p className="text-foreground text-sm font-bold mb-2">Data Sources Used</p>
            <div className="space-y-2">
              {DATA_SOURCES.map((ds) => (
                <div
                  key={ds.name}
                  className="flex items-center justify-between rounded-2xl p-3.5"
                  style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}
                >
                  <div>
                    <p className="text-foreground text-xs font-semibold">{ds.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6e4a60" }}>{ds.count.toLocaleString()} data points</p>
                  </div>
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                    style={{ background: "rgba(201,64,118,0.1)", color: "#c94076", border: "1px solid rgba(201,64,118,0.2)" }}
                  >
                    {ds.freshness}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}
          >
            <p className="text-sm font-bold text-foreground mb-2">Reasoning</p>
            <p className="text-xs leading-relaxed" style={{ color: "#6e4a60" }}>
              Score computed from weighted average of 9 dimensions. Community reports contribute 35% weight; infrastructure data 40%; historical patterns 25%. Recent reports from last 2 hours weighted 3× more heavily.
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
