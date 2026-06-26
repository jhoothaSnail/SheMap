import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Shield, Eye, Users, Zap, AlertTriangle, Home, Star, Cloud, Moon, Loader2, MapPin,
} from "lucide-react";
import {
  safetyApi, type SafetyScore, type SafetyForecast, type DimensionScores,
} from "../api/api";

interface SafetyIntelligenceProps {
  userPos: { lat: number; lng: number } | null;
  areaLabel?: string;
}

// Map backend dimension keys -> display label + icon. Colors are derived from
// the real score, not hardcoded.
const DIMENSION_META: { key: keyof DimensionScores; label: string; icon: typeof Zap }[] = [
  { key: "lighting_score",   label: "Lighting",        icon: Zap },
  { key: "human_presence",   label: "Human Presence",  icon: Users },
  { key: "isolation_score",  label: "Isolation",       icon: Eye },
  { key: "crowd_quality",    label: "Crowd Quality",   icon: Star },
  { key: "harassment_risk",  label: "Harassment Risk", icon: AlertTriangle },
  { key: "safe_haven_score", label: "Safe Havens",     icon: Home },
  { key: "community_trust",  label: "Community Trust",  icon: Shield },
  { key: "weather_risk",     label: "Weather Risk",    icon: Cloud },
  { key: "night_risk",       label: "Night Risk",      icon: Moon },
];

function colorForScore(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 65) return "#f59e0b";
  if (score >= 45) return "#f97316";
  return "#f43f5e";
}

function levelColor(level: string): string {
  return level === "safe" ? "#10b981"
    : level === "moderate" ? "#f59e0b"
    : level === "risky" ? "#f97316"
    : "#f43f5e";
}

function relativeTime(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} hr ago`;
}

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

function SubNav({ options, active, onChange }: { options: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(28,15,24,0.06)", border: "1px solid rgba(28,15,24,0.07)" }}>
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

// Honest, data-derived time recommendations from the real forecast curve.
function buildRecommendations(forecast: SafetyForecast | null) {
  if (!forecast || forecast.forecast.length === 0) return [];
  return forecast.forecast.map((p) => {
    const c = levelColor(p.level);
    const rec =
      p.level === "safe" ? "Safe to walk. Most routes are clear."
      : p.level === "moderate" ? "Prefer the Safest Route. Avoid isolated shortcuts."
      : p.level === "risky" ? "Share live location. Stick to busy, well-lit streets."
      : "Consider a cab. Share live location and avoid walking alone.";
    const icon = p.level === "safe" ? "✅" : p.level === "moderate" ? "⚠️" : "🚨";
    return {
      time: p.time_label === "Now" ? "Now" : `In ${p.time_label.replace("+", "").replace("h", " hr")}`,
      rec, color: c, bg: `${c}14`, border: `${c}40`, icon, score: p.predicted_score,
    };
  });
}

export function SafetyIntelligence({ userPos, areaLabel }: SafetyIntelligenceProps) {
  const [subView, setSubView] = useState<SubView>("overview");
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null);
  const [score, setScore] = useState<SafetyScore | null>(null);
  const [forecast, setForecast] = useState<SafetyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!userPos) return;
    setLoading(true);
    setError(null);
    Promise.all([
      safetyApi.areaScore(userPos.lat, userPos.lng),
      safetyApi.forecast(userPos.lat, userPos.lng),
    ])
      .then(([s, f]) => { setScore(s); setForecast(f); })
      .catch((e: any) => setError(e?.message ?? "Couldn't load safety data."))
      .finally(() => setLoading(false));
  }, [userPos]);

  useEffect(() => { load(); }, [load]);

  const overallScore = score ? Math.round(score.overall_score) : 0;
  const scoreColor = colorForScore(overallScore);
  const recommendations = buildRecommendations(forecast);

  // --- Waiting / loading / error gates ---------------------------------
  if (!userPos) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
        <MapPin size={26} className="text-primary" />
        <p className="text-foreground font-bold text-sm">Waiting for your location</p>
        <p className="text-xs text-muted-foreground">Enable location so we can analyze the safety of your area.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">
      {/* Header hero */}
      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #1c0f18 0%, #2e1424 100%)", boxShadow: "0 4px 24px rgba(28,15,24,0.2)" }}>
        <div>
          <p className="font-bold text-white" style={{ fontSize: "1rem" }}>Safety Intelligence</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            {areaLabel || "Your current area"}{score ? ` · Updated ${relativeTime(score.computed_at)}` : ""}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold" style={{ color: "#34d399" }}>
              {score ? `${score.data_points_used} community reports nearby` : "Analyzing…"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <ScoreRing score={overallScore} color={scoreColor} size={64} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold" style={{ color: scoreColor }}>{overallScore || "–"}</span>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>/ 100</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>AREA SCORE</span>
        </div>
      </div>

      {loading && !score && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 size={20} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Computing safety score…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center py-8 gap-2">
          <p className="text-foreground font-bold text-sm">Couldn't load safety data</p>
          <p className="text-xs text-center text-muted-foreground">{error}</p>
          <button onClick={load} className="text-xs font-bold px-4 py-2 rounded-xl" style={{ background: "rgba(201,64,118,0.1)", color: "#c94076" }}>Retry</button>
        </div>
      )}

      {score && (
        <>
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
                {DIMENSION_META.map((d) => {
                  const Icon = d.icon;
                  const value = Math.round(score.dimensions[d.key]);
                  const color = colorForScore(value);
                  const label = value >= 80 ? "Good" : value >= 65 ? "Fair" : value >= 45 ? "Caution" : "Risk";
                  return (
                    <div key={d.key} className="rounded-2xl p-3 flex flex-col items-center gap-1.5" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.05)" }}>
                      <div className="relative">
                        <ScoreRing score={value} color={color} size={40} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon size={12} style={{ color }} />
                        </div>
                      </div>
                      <span className="font-bold text-sm" style={{ color }}>{value}</span>
                      <span className="text-[9px] text-center leading-tight font-medium" style={{ color: "#6e4a60" }}>{d.label}</span>
                      <span className="text-[9px] font-bold" style={{ color }}>{label}</span>
                    </div>
                  );
                })}
              </div>

              {score.ai_summary && (
                <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield size={13} className="text-primary" />
                    <span className="text-sm font-bold text-foreground">What this means</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#6e4a60" }}>{score.ai_summary}</p>
                </div>
              )}

              {/* Real risk factors from the forecast */}
              {forecast && forecast.risk_factors.length > 0 && (
                <div>
                  <p className="text-foreground text-sm font-bold mb-2">Upcoming Risk Factors</p>
                  <div className="space-y-2">
                    {forecast.risk_factors.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => setExpandedFactor(expandedFactor === i ? null : i)}
                        className="w-full text-left rounded-2xl p-3 transition-all"
                        style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{f.icon ?? "⚠️"}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-foreground text-sm font-semibold">{f.label}</span>
                              <div className="flex items-center gap-2">
                                {f.time && <span className="text-xs font-medium" style={{ color: "#6e4a60" }}>{f.time}</span>}
                                <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color: f.impact < 0 ? "#dc2626" : "#059669", background: f.impact < 0 ? "rgba(244,63,94,0.1)" : "rgba(16,185,129,0.1)" }}>
                                  {f.impact > 0 ? "+" : ""}{f.impact}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* FORECAST */}
          {subView === "forecast" && forecast && (
            <>
              <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 8px rgba(28,15,24,0.05)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                    <Moon size={13} className="text-primary" />
                  </div>
                  <span className="text-foreground text-sm font-bold">Safety Forecast (next hours)</span>
                </div>
                <div className="flex items-end gap-1 h-24 mb-3">
                  {forecast.forecast.map((f, i) => {
                    const c = levelColor(f.level);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold" style={{ color: c }}>{Math.round(f.predicted_score)}</span>
                        <div className="w-full rounded-t-lg transition-all" style={{ height: `${f.predicted_score}%`, background: `${c}25`, border: `1.5px solid ${c}70` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {forecast.forecast.map((f, i) => {
                    const c = levelColor(f.level);
                    const hourLabel = `${f.hour % 12 || 12}${f.hour < 12 ? "AM" : "PM"}`;
                    return (
                      <div key={i} className="flex-1 text-center">
                        <p className="text-[10px] font-semibold text-foreground">{hourLabel}</p>
                        <p className="text-[9px] px-1 py-0.5 rounded-full mt-0.5 capitalize font-semibold" style={{ background: `${c}15`, color: c }}>{f.level}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {forecast.ai_summary && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(201,64,118,0.06)", border: "1.5px solid rgba(201,64,118,0.18)" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#6e4a60" }}>{forecast.ai_summary}</p>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-foreground text-sm font-bold">Time-Based Guidance</p>
                  {recommendations.map((r, i) => (
                    <div key={i} className="rounded-2xl p-3.5 flex items-start gap-3" style={{ background: r.bg, border: `1.5px solid ${r.border}` }}>
                      <span className="text-base mt-0.5">{r.icon}</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: r.color }}>{r.time} · score {Math.round(r.score)}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6e4a60" }}>{r.rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* CONFIDENCE */}
          {subView === "confidence" && (
            <>
              <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #1c0f18, #2e1424)", boxShadow: "0 4px 24px rgba(28,15,24,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-bold">Confidence Score</span>
                  <span className="text-3xl font-bold" style={{ color: "#c94076" }}>{Math.round(score.confidence_pct)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${score.confidence_pct}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ background: "linear-gradient(90deg, #c94076, #f07c4a)" }} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Confidence grows with the amount of recent community data near you. Currently based on {score.data_points_used} report{score.data_points_used === 1 ? "" : "s"} within ~500m.
                </p>
              </div>

              <div>
                <p className="text-foreground text-sm font-bold mb-2">How this score is computed</p>
                <div className="rounded-2xl p-4 space-y-2" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#6e4a60" }}>
                    The area score is a weighted blend of 9 safety dimensions. Each nearby community report adjusts the relevant dimensions based on its <b>category</b>, <b>severity</b>, and how <b>recent</b> it is (older reports count less). A <b>time-of-day</b> factor lowers lighting, isolation and night-risk dimensions after dark.
                  </p>
                  <p className="text-[11px] italic" style={{ color: "#9b7d8f" }}>
                    Heuristic model based on real community reports + time of day. Not a prediction from external crime databases.
                  </p>
                </div>
              </div>

              {/* Top contributing dimensions (real) */}
              <div>
                <p className="text-foreground text-sm font-bold mb-2">Biggest factors right now</p>
                <div className="space-y-2">
                  {[...DIMENSION_META]
                    .map((d) => ({ ...d, value: Math.round(score.dimensions[d.key]) }))
                    .sort((a, b) => a.value - b.value)
                    .slice(0, 3)
                    .map((d) => (
                      <div key={d.key} className="flex items-center justify-between rounded-2xl p-3.5" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)" }}>
                        <span className="text-foreground text-xs font-semibold">{d.label}</span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: `${colorForScore(d.value)}18`, color: colorForScore(d.value) }}>{d.value}/100</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
