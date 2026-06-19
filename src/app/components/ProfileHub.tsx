import { useState } from "react";
import { motion } from "motion/react";
import { Shield, Star, MapPin, Users, TrendingUp, Award, CheckCircle2, BarChart3 } from "lucide-react";
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts";

const PERSONAL_STATS = [
  { label: "Total Trips", value: 47, icon: "🗺️", color: "#7c3aed" },
  { label: "Safe Trips", value: 46, icon: "🛡️", color: "#10b981" },
  { label: "Reports Filed", value: 12, icon: "📍", color: "#f59e0b" },
  { label: "Upvotes Given", value: 89, icon: "👍", color: "#6366f1" },
  { label: "Lives Impacted", value: 234, icon: "❤️", color: "#f43f5e" },
  { label: "Trust Score", value: "4.9", icon: "⭐", color: "#f59e0b" },
];

const BADGES = [
  { name: "Trusted Contributor", desc: "10+ verified reports", icon: "🏅", earned: true, color: "#f59e0b" },
  { name: "Community Guardian", desc: "50+ community upvotes", icon: "🛡️", earned: true, color: "#7c3aed" },
  { name: "Safety Ambassador", desc: "Referred 5+ users", icon: "🌟", earned: false, color: "#6366f1" },
  { name: "Night Owl Reporter", desc: "3+ night reports", icon: "🦉", earned: true, color: "#1e0a3c" },
  { name: "First Responder", desc: "Reported an emergency", icon: "🚨", earned: false, color: "#f43f5e" },
  { name: "Pathfinder", desc: "Completed 50 trips", icon: "🧭", earned: false, color: "#10b981" },
];

const TREND_DATA = [
  { day: "Mon", trips: 2, reports: 1 },
  { day: "Tue", trips: 3, reports: 0 },
  { day: "Wed", trips: 1, reports: 2 },
  { day: "Thu", trips: 4, reports: 1 },
  { day: "Fri", trips: 3, reports: 3 },
  { day: "Sat", trips: 5, reports: 2 },
  { day: "Sun", trips: 2, reports: 1 },
];

const CITY_SAFE = [
  { area: "Lincoln Park", score: 91, incidents: 4 },
  { area: "River North", score: 88, incidents: 7 },
  { area: "Wicker Park", score: 85, incidents: 9 },
  { area: "Hyde Park", score: 82, incidents: 11 },
  { area: "Logan Square", score: 76, incidents: 15 },
];
const CITY_UNSAFE = [
  { area: "West Englewood", score: 31, incidents: 89 },
  { area: "Austin", score: 38, incidents: 74 },
  { area: "Roseland", score: 42, incidents: 61 },
  { area: "Pullman", score: 48, incidents: 45 },
  { area: "South Shore", score: 52, incidents: 38 },
];
const TRENDING_INCIDENTS = [
  { type: "Streetlight Outage", area: "Maple Lane", count: 14, trend: "↑" },
  { type: "Harassment Reports", area: "Oak St & 5th", count: 9, trend: "↑" },
  { type: "Suspicious Activity", area: "Park Subway", count: 7, trend: "→" },
  { type: "Unsafe Shortcut", area: "Back Alley Rd", count: 5, trend: "↓" },
];

type ProfileView = "personal" | "city" | "reputation";

export function ProfileHub() {
  const [view, setView] = useState<ProfileView>("personal");

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">
      {/* User header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
          A
        </div>
        <div>
          <p className="text-foreground font-semibold">Asha Patel</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>Community Guardian</span>
            <span className="text-muted-foreground text-xs">Member since Jan 2025</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Star size={12} className="text-amber-400" fill="#f59e0b" />
          <span className="text-foreground text-sm font-bold">4.9</span>
        </div>
      </div>

      {/* Sub nav */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(0,0,0,0.04)" }}>
        {(["personal", "reputation", "city"] as ProfileView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
            style={{
              background: view === v ? "#ffffff" : "transparent",
              color: view === v ? "#7c3aed" : "#7c6a9e",
              boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {v === "city" ? "City Map" : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* PERSONAL */}
      {view === "personal" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {PERSONAL_STATS.map((s) => (
              <div key={s.label} className="rounded-2xl p-3 bg-card border border-border flex flex-col items-center gap-1">
                <span className="text-xl">{s.icon}</span>
                <span className="font-bold text-sm" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[9px] text-muted-foreground text-center">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Weekly trend */}
          <div className="rounded-2xl p-4 bg-card border border-border">
            <p className="text-foreground text-sm font-semibold mb-3">This Week</p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={TREND_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#7c6a9e" }} axisLine={false} tickLine={false} />
                <YAxis tick={false} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="trips" stroke="#7c3aed" fill="rgba(124,58,237,0.1)" strokeWidth={2} />
                <Area type="monotone" dataKey="reports" stroke="#10b981" fill="rgba(16,185,129,0.08)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground text-xs">Trips</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-muted-foreground text-xs">Reports</span>
              </div>
            </div>
          </div>

          {/* Safety trend summary */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-emerald-600 text-xs font-semibold">Your Safety Impact</span>
            </div>
            <p className="text-foreground text-sm">Your 12 reports have been upvoted 89 times — helping <strong>234 women</strong> avoid unsafe areas this month.</p>
          </div>
        </>
      )}

      {/* REPUTATION */}
      {view === "reputation" && (
        <>
          <div className="rounded-2xl p-4 bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-foreground text-sm font-semibold">Reputation Breakdown</span>
              <span className="text-primary font-bold">87 / 100</span>
            </div>
            {[
              { label: "Report Accuracy", score: 92, color: "#10b981" },
              { label: "Community Trust", score: 88, color: "#7c3aed" },
              { label: "Verified Reports", score: 83, color: "#f59e0b" },
              { label: "Engagement", score: 79, color: "#6366f1" },
            ].map((r) => (
              <div key={r.label} className="mb-2.5">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                  <span className="text-xs font-medium" style={{ color: r.color }}>{r.score}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.score}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-foreground text-sm font-semibold">Badges & Achievements</p>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((b) => (
              <div
                key={b.name}
                className="rounded-2xl p-3.5 bg-card border flex items-start gap-3"
                style={{
                  borderColor: b.earned ? `${b.color}30` : "rgba(0,0,0,0.06)",
                  opacity: b.earned ? 1 : 0.5,
                }}
              >
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-foreground text-xs font-semibold leading-tight">{b.name}</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">{b.desc}</p>
                  {b.earned && <span className="text-[10px] text-emerald-500 font-medium">Earned ✓</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CITY */}
      {view === "city" && (
        <>
          <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
            <p className="text-emerald-600 text-xs font-semibold mb-2">🏆 Safest Areas — Chicago</p>
            <div className="space-y-2">
              {CITY_SAFE.map((a, i) => (
                <div key={a.area} className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs w-4">{i + 1}</span>
                  <span className="flex-1 text-foreground text-xs font-medium">{a.area}</span>
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${a.score}%` }} />
                  </div>
                  <span className="text-emerald-600 text-xs font-bold w-6">{a.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.18)" }}>
            <p className="text-accent text-xs font-semibold mb-2">⚠️ Most Unsafe Areas</p>
            <div className="space-y-2">
              {CITY_UNSAFE.map((a, i) => (
                <div key={a.area} className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs w-4">{i + 1}</span>
                  <span className="flex-1 text-foreground text-xs font-medium">{a.area}</span>
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${a.score}%` }} />
                  </div>
                  <span className="text-accent text-xs font-bold w-6">{a.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-card border border-border">
            <p className="text-foreground text-sm font-semibold mb-2">Trending Incidents</p>
            <div className="space-y-2">
              {TRENDING_INCIDENTS.map((inc) => (
                <div key={inc.type} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-foreground text-xs font-medium">{inc.type}</p>
                    <p className="text-muted-foreground text-[11px]">{inc.area}</p>
                  </div>
                  <span className="text-muted-foreground text-xs">{inc.count} reports</span>
                  <span className="font-bold text-sm" style={{ color: inc.trend === "↑" ? "#f43f5e" : inc.trend === "↓" ? "#10b981" : "#7c6a9e" }}>
                    {inc.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
