import { useState } from "react";
import type { User } from "firebase/auth";
import { motion } from "motion/react";
import { LogOut, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const PERSONAL_STATS = [
  { label: "Total Trips", value: 47, icon: "🗺️", color: "#c94076" },
  { label: "Safe Trips", value: 46, icon: "🛡️", color: "#10b981" },
  { label: "Reports Filed", value: 12, icon: "📍", color: "#f59e0b" },
  { label: "Upvotes Given", value: 89, icon: "👍", color: "#f07c4a" },
  { label: "Lives Impacted", value: 234, icon: "❤️", color: "#f43f5e" },
  { label: "Trust Score", value: "4.9", icon: "⭐", color: "#f59e0b" },
];

const BADGES = [
  { name: "Trusted Contributor", desc: "10+ verified reports", icon: "🏅", earned: true, color: "#f59e0b" },
  { name: "Community Guardian", desc: "50+ community upvotes", icon: "🛡️", earned: true, color: "#c94076" },
  { name: "Safety Ambassador", desc: "Referred 5+ users", icon: "🌟", earned: false, color: "#f07c4a" },
  { name: "Night Owl Reporter", desc: "3+ night reports", icon: "🦉", earned: true, color: "#1c0f18" },
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
  { area: "Lincoln Park", score: 91 },
  { area: "River North", score: 88 },
  { area: "Wicker Park", score: 85 },
  { area: "Hyde Park", score: 82 },
  { area: "Logan Square", score: 76 },
];
const CITY_UNSAFE = [
  { area: "West Englewood", score: 31 },
  { area: "Austin", score: 38 },
  { area: "Roseland", score: 42 },
  { area: "Pullman", score: 48 },
  { area: "South Shore", score: 52 },
];
const TRENDING_INCIDENTS = [
  { type: "Streetlight Outage", area: "Maple Lane", count: 14, trend: "↑" },
  { type: "Harassment Reports", area: "Oak St & 5th", count: 9, trend: "↑" },
  { type: "Suspicious Activity", area: "Park Subway", count: 7, trend: "→" },
  { type: "Unsafe Shortcut", area: "Back Alley Rd", count: 5, trend: "↓" },
];

type ProfileView = "personal" | "reputation" | "city";

interface ProfileHubProps {
  user: User;
  onSignOut: () => Promise<void>;
}

export function ProfileHub({ user, onSignOut }: ProfileHubProps) {
  const [view, setView] = useState<ProfileView>("personal");
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user.displayName || user.email?.split("@")[0] || "SheMaps User";
  const userEmail = user.email || "Authenticated account";
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await onSignOut(); } finally { setSigningOut(false); }
  };

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">

      {/* Profile hero — dark strip, same as other panels */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, #1c0f18 0%, #2e1424 100%)",
          boxShadow: "0 4px 24px rgba(28,15,24,0.2)",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, #c94076, #f07c4a)",
              boxShadow: "0 4px 16px rgba(201,64,118,0.4)",
            }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold truncate text-base">{displayName}</p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{userEmail}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(201,64,118,0.3)", color: "#f9a8c9", border: "1px solid rgba(201,64,118,0.4)" }}
              >
                Community Guardian
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Jan 2025</span>
            </div>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <div className="flex items-center gap-1">
              <Star size={13} style={{ color: "#f59e0b" }} fill="#f59e0b" />
              <span className="text-white font-bold">4.9</span>
            </div>
            <span className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Trust</span>
          </div>
        </div>

        {/* Reputation bar row */}
        <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { label: "Reports", value: "12", color: "#f59e0b" },
            { label: "Upvotes", value: "89", color: "#c94076" },
            { label: "Impact", value: "234", color: "#10b981" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <span className="font-bold text-sm" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub nav — consistent with other panels */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ background: "rgba(28,15,24,0.06)", border: "1px solid rgba(28,15,24,0.07)" }}
      >
        {([
          { id: "personal", label: "Personal" },
          { id: "reputation", label: "Reputation" },
          { id: "city", label: "City Map" },
        ] as { id: ProfileView; label: string }[]).map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: view === v.id ? "#ffffff" : "transparent",
              color: view === v.id ? "#c94076" : "#6e4a60",
              boxShadow: view === v.id ? "0 1px 6px rgba(28,15,24,0.1)" : "none",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* PERSONAL */}
      {view === "personal" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {PERSONAL_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-3 flex flex-col items-center gap-1.5"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(28,15,24,0.09)",
                  boxShadow: "0 1px 4px rgba(28,15,24,0.05)",
                }}
              >
                <span className="text-xl">{s.icon}</span>
                <span className="font-bold text-sm" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[9px] text-center font-medium" style={{ color: "#6e4a60" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Weekly trend chart */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}
          >
            <p className="text-foreground text-sm font-bold mb-3">This Week's Activity</p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={TREND_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6e4a60" }} axisLine={false} tickLine={false} />
                <YAxis tick={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#fff", border: "1.5px solid rgba(28,15,24,0.1)",
                    borderRadius: 12, fontSize: 11, boxShadow: "0 4px 16px rgba(28,15,24,0.1)"
                  }}
                />
                <Area type="monotone" dataKey="trips" stroke="#c94076" fill="rgba(201,64,118,0.1)" strokeWidth={2} />
                <Area type="monotone" dataKey="reports" stroke="#10b981" fill="rgba(16,185,129,0.08)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-medium" style={{ color: "#6e4a60" }}>Trips</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium" style={{ color: "#6e4a60" }}>Reports</span>
              </div>
            </div>
          </div>

          {/* Safety impact */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(16,185,129,0.03))",
              border: "1.5px solid rgba(16,185,129,0.22)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">Your Safety Impact</span>
            </div>
            <p className="text-foreground text-sm leading-relaxed">
              Your 12 reports have been upvoted 89 times — helping{" "}
              <span className="font-bold text-emerald-600">234 women</span> avoid unsafe areas this month.
            </p>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all disabled:opacity-60"
            style={{
              background: "#ffffff",
              border: "1.5px solid rgba(28,15,24,0.12)",
              color: "#6e4a60",
              boxShadow: "0 1px 4px rgba(28,15,24,0.05)",
            }}
          >
            <LogOut size={15} />
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </>
      )}

      {/* REPUTATION */}
      {view === "reputation" && (
        <>
          {/* Reputation score card */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, #1c0f18, #2e1424)",
              boxShadow: "0 4px 20px rgba(28,15,24,0.18)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-bold">Reputation Score</span>
              <span className="text-3xl font-bold" style={{ color: "#c94076" }}>87</span>
            </div>
            {[
              { label: "Report Accuracy", score: 92, color: "#10b981" },
              { label: "Community Trust", score: 88, color: "#c94076" },
              { label: "Verified Reports", score: 83, color: "#f59e0b" },
              { label: "Engagement", score: 79, color: "#f07c4a" },
            ].map((r) => (
              <div key={r.label} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{r.label}</span>
                  <span className="text-xs font-bold" style={{ color: r.color }}>{r.score}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${r.score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ background: r.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-foreground text-sm font-bold">Badges & Achievements</p>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((b) => (
              <div
                key={b.name}
                className="rounded-2xl p-3.5 flex items-start gap-3 transition-all"
                style={{
                  background: b.earned ? "#ffffff" : "rgba(28,15,24,0.03)",
                  border: b.earned ? `1.5px solid ${b.color}35` : "1.5px solid rgba(28,15,24,0.07)",
                  boxShadow: b.earned ? `0 2px 10px ${b.color}18` : "none",
                  opacity: b.earned ? 1 : 0.55,
                }}
              >
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-foreground text-xs font-bold leading-tight">{b.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6e4a60" }}>{b.desc}</p>
                  {b.earned && (
                    <div className="flex items-center gap-0.5 mt-1">
                      <CheckCircle2 size={9} className="text-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-500">Earned</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CITY */}
      {view === "city" && (
        <>
          <div
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(16,185,129,0.03))",
              border: "1.5px solid rgba(16,185,129,0.22)",
            }}
          >
            <p className="text-sm font-bold mb-3" style={{ color: "#059669" }}>🏆 Safest Areas — Chicago</p>
            <div className="space-y-2.5">
              {CITY_SAFE.map((a, i) => (
                <div key={a.area} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-4" style={{ color: "#6e4a60" }}>{i + 1}</span>
                  <span className="flex-1 text-foreground text-xs font-medium">{a.area}</span>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,15,24,0.08)" }}>
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${a.score}%` }} />
                  </div>
                  <span className="text-xs font-bold w-6" style={{ color: "#059669" }}>{a.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(244,63,94,0.05)",
              border: "1.5px solid rgba(244,63,94,0.2)",
            }}
          >
            <p className="text-sm font-bold mb-3" style={{ color: "#dc2626" }}>⚠️ Most Unsafe Areas</p>
            <div className="space-y-2.5">
              {CITY_UNSAFE.map((a, i) => (
                <div key={a.area} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-4" style={{ color: "#6e4a60" }}>{i + 1}</span>
                  <span className="flex-1 text-foreground text-xs font-medium">{a.area}</span>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,15,24,0.08)" }}>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${a.score}%` }} />
                  </div>
                  <span className="text-xs font-bold w-6" style={{ color: "#dc2626" }}>{a.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}
          >
            <p className="text-foreground text-sm font-bold mb-3">Trending Incidents</p>
            <div className="space-y-1">
              {TRENDING_INCIDENTS.map((inc, i) => (
                <div
                  key={inc.type}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: i < TRENDING_INCIDENTS.length - 1 ? "1px solid rgba(28,15,24,0.07)" : "none" }}
                >
                  <div className="flex-1">
                    <p className="text-foreground text-xs font-semibold">{inc.type}</p>
                    <p className="text-[11px]" style={{ color: "#6e4a60" }}>{inc.area}</p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#6e4a60" }}>{inc.count} reports</span>
                  <span
                    className="font-bold text-sm w-5 text-center"
                    style={{ color: inc.trend === "↑" ? "#f43f5e" : inc.trend === "↓" ? "#10b981" : "#6e4a60" }}
                  >
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
