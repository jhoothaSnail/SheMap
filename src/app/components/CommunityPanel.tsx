import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ThumbsUp, ThumbsDown, MessageCircle, MapPin, Clock, Plus, Camera,
  Mic, FileText, X, ChevronRight, Filter, AlertTriangle, CheckCircle2,
  TrendingUp, Archive, Flame
} from "lucide-react";

type Lifecycle = "new" | "verified" | "trending" | "resolved" | "archived";

interface Report {
  id: number;
  type: string;
  title: string;
  location: string;
  time: string;
  desc: string;
  upvotes: number;
  downvotes: number;
  color: string;
  icon: string;
  lifecycle: Lifecycle;
  severity: 1 | 2 | 3;
  verified: boolean;
}

const INCIDENTS: Report[] = [
  {
    id: 1, type: "harassment", title: "Street Harassment", location: "Oak St & 5th Ave",
    time: "32 min ago", desc: "Man following women near the bus stop. Area poorly lit.",
    upvotes: 14, downvotes: 1, color: "#f43f5e", icon: "⚠️", lifecycle: "trending", severity: 3, verified: true,
  },
  {
    id: 2, type: "lighting", title: "Broken Street Lights", location: "Maple Lane, Block 3",
    time: "2 hrs ago", desc: "Three consecutive street lights out. Very dark at night.",
    upvotes: 27, downvotes: 2, color: "#f59e0b", icon: "🔦", lifecycle: "verified", severity: 2, verified: true,
  },
  {
    id: 3, type: "safe", title: "Well-Lit Shortcut", location: "Park Walkway via Rose Ave",
    time: "5 hrs ago", desc: "New LED lighting installed. Great alternative to the main road.",
    upvotes: 41, downvotes: 0, color: "#10b981", icon: "✅", lifecycle: "verified", severity: 1, verified: true,
  },
  {
    id: 4, type: "suspicious", title: "Suspicious Activity", location: "Central Park Subway",
    time: "Yesterday", desc: "Group loitering at entrance late at night. Multiple reports.",
    upvotes: 8, downvotes: 3, color: "#a855f7", icon: "👁️", lifecycle: "new", severity: 2, verified: false,
  },
  {
    id: 5, type: "stalking", title: "Reported Stalking", location: "Riverside Dr",
    time: "3 hrs ago", desc: "Someone followed me for 2 blocks before I entered a store.",
    upvotes: 19, downvotes: 0, color: "#f43f5e", icon: "🚨", lifecycle: "new", severity: 3, verified: false,
  },
];

const REPORT_TYPES = [
  { id: "catcalling", label: "Catcalling", icon: "📢" },
  { id: "harassment", label: "Harassment", icon: "⚠️" },
  { id: "following", label: "Following", icon: "👤" },
  { id: "stalking", label: "Stalking", icon: "🚨" },
  { id: "unsafe_crowd", label: "Unsafe Crowd", icon: "👥" },
  { id: "dark_area", label: "Dark Area", icon: "🌑" },
  { id: "broken_light", label: "Broken Streetlight", icon: "🔦" },
  { id: "suspicious", label: "Suspicious Person", icon: "👁️" },
  { id: "unsafe_shortcut", label: "Unsafe Shortcut", icon: "⛔" },
  { id: "drunk", label: "Drunk Individuals", icon: "🍺" },
];

const FILTERS = ["All", "Trending", "Verified", "Nearby", "Emergency"];

const LIFECYCLE_COLORS: Record<Lifecycle, string> = {
  new: "#7c3aed",
  verified: "#10b981",
  trending: "#f43f5e",
  resolved: "#6366f1",
  archived: "#7c6a9e",
};

const LIFECYCLE_ICONS: Record<Lifecycle, React.ReactNode> = {
  new: <div className="w-1.5 h-1.5 rounded-full bg-primary" />,
  verified: <CheckCircle2 size={10} className="text-emerald-500" />,
  trending: <Flame size={10} className="text-accent" />,
  resolved: <CheckCircle2 size={10} className="text-indigo-500" />,
  archived: <Archive size={10} className="text-muted-foreground" />,
};

function SeverityDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i <= level ? (level === 3 ? "#f43f5e" : level === 2 ? "#f59e0b" : "#10b981") : "rgba(0,0,0,0.1)" }} />
      ))}
    </div>
  );
}

export function CommunityPanel() {
  const [filter, setFilter] = useState("All");
  const [votes, setVotes] = useState<Record<number, "up" | "down" | null>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [severity, setSeverity] = useState<1 | 2 | 3>(2);
  const [desc, setDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const filteredIncidents = INCIDENTS.filter((inc) => {
    if (filter === "All") return true;
    if (filter === "Trending") return inc.lifecycle === "trending";
    if (filter === "Verified") return inc.verified;
    if (filter === "Nearby") return true; // all are "nearby" in mock
    if (filter === "Emergency") return inc.severity === 3;
    return true;
  });

  const vote = (id: number, dir: "up" | "down") => {
    setVotes((prev) => ({ ...prev, [id]: prev[id] === dir ? null : dir }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => { setShowCreate(false); setSubmitted(false); setSelectedType(null); setDesc(""); setSeverity(2); }, 1500);
  };

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-semibold">Community Reports</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Real-time safety intelligence near you</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition-colors font-medium"
          style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}
        >
          <Plus size={12} /> Report
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs transition-all font-medium"
            style={{
              background: filter === f ? "rgba(124,58,237,0.12)" : "#ffffff",
              color: filter === f ? "#7c3aed" : "#7c6a9e",
              border: filter === f ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(0,0,0,0.07)",
            }}
          >
            {f === "Emergency" ? "🚨 " + f : f}
          </button>
        ))}
      </div>

      {/* Ranking explainer strip */}
      <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)" }}>
        <TrendingUp size={12} className="text-primary shrink-0" />
        <p className="text-[10px] text-muted-foreground">Ranked by: <span className="text-primary font-medium">Freshness</span> · <span className="text-primary font-medium">Upvotes</span> · <span className="text-primary font-medium">Severity</span> · <span className="text-primary font-medium">Credibility</span></p>
      </div>

      {/* Incident cards */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 && (
          <div className="flex flex-col items-center py-10 gap-3">
            <span className="text-4xl">🕊️</span>
            <p className="text-foreground font-medium">No Reports Here</p>
            <p className="text-muted-foreground text-xs text-center">This area looks clear. Be the first to report if you see something.</p>
          </div>
        )}
        {filteredIncidents.map((inc) => (
          <motion.div key={inc.id} layout className="rounded-2xl p-4 bg-card border border-border">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${inc.color}12` }}>
                {inc.icon}
              </div>
              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-foreground text-sm font-medium">{inc.title}</span>
                    <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${LIFECYCLE_COLORS[inc.lifecycle]}12`, color: LIFECYCLE_COLORS[inc.lifecycle] }}>
                      {LIFECYCLE_ICONS[inc.lifecycle]}
                      <span className="capitalize ml-0.5">{inc.lifecycle}</span>
                    </div>
                  </div>
                  <SeverityDots level={inc.severity} />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                    <MapPin size={9} />{inc.location}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                    <Clock size={9} />{inc.time}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">{inc.desc}</p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button onClick={() => vote(inc.id, "up")} className="flex items-center gap-1.5 transition-colors">
                    <ThumbsUp size={13} style={{ color: votes[inc.id] === "up" ? "#7c3aed" : "#7c6a9e" }} fill={votes[inc.id] === "up" ? "#7c3aed" : "none"} />
                    <span className="text-xs" style={{ color: votes[inc.id] === "up" ? "#7c3aed" : "#7c6a9e" }}>
                      {inc.upvotes + (votes[inc.id] === "up" ? 1 : 0)}
                    </span>
                  </button>
                  <button onClick={() => vote(inc.id, "down")} className="flex items-center gap-1.5 transition-colors">
                    <ThumbsDown size={13} style={{ color: votes[inc.id] === "down" ? "#f43f5e" : "#7c6a9e" }} fill={votes[inc.id] === "down" ? "#f43f5e" : "none"} />
                    <span className="text-xs" style={{ color: votes[inc.id] === "down" ? "#f43f5e" : "#7c6a9e" }}>
                      {inc.downvotes + (votes[inc.id] === "down" ? 1 : 0)}
                    </span>
                  </button>
                  <button className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle size={13} /><span className="text-xs">Comment</span>
                  </button>
                  {inc.verified && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Report Sheet */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative w-full max-w-sm rounded-t-3xl bg-background"
              style={{ maxHeight: "88vh", overflowY: "auto", scrollbarWidth: "none" }}
            >
              {submitted ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                  <p className="text-foreground font-semibold">Report Submitted!</p>
                  <p className="text-muted-foreground text-sm">Thank you for keeping the community safe.</p>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-foreground font-semibold">New Safety Report</h3>
                    <button onClick={() => setShowCreate(false)}><X size={18} className="text-muted-foreground" /></button>
                  </div>

                  {/* Type grid */}
                  <p className="text-foreground text-xs font-semibold mb-2">What happened?</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {REPORT_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedType(t.id)}
                        className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: selectedType === t.id ? "rgba(124,58,237,0.1)" : "rgba(0,0,0,0.04)",
                          border: `1.5px solid ${selectedType === t.id ? "rgba(124,58,237,0.4)" : "rgba(0,0,0,0.07)"}`,
                        }}
                      >
                        <span className="text-base">{t.icon}</span>
                        <span className="text-xs font-medium" style={{ color: selectedType === t.id ? "#7c3aed" : "#1e0a3c" }}>{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Severity */}
                  <p className="text-foreground text-xs font-semibold mb-2">Severity</p>
                  <div className="flex gap-2 mb-4">
                    {([1, 2, 3] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSeverity(s)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: severity === s ? (s === 1 ? "rgba(16,185,129,0.12)" : s === 2 ? "rgba(245,158,11,0.12)" : "rgba(244,63,94,0.12)") : "rgba(0,0,0,0.04)",
                          color: severity === s ? (s === 1 ? "#10b981" : s === 2 ? "#f59e0b" : "#f43f5e") : "#7c6a9e",
                          border: `1.5px solid ${severity === s ? (s === 1 ? "rgba(16,185,129,0.4)" : s === 2 ? "rgba(245,158,11,0.4)" : "rgba(244,63,94,0.4)") : "rgba(0,0,0,0.07)"}`,
                        }}
                      >
                        {s === 1 ? "Low" : s === 2 ? "Moderate" : "High"}
                      </button>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-foreground text-xs font-semibold mb-2">Description</p>
                  <textarea
                    className="w-full rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-4"
                    style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", minHeight: 80 }}
                    placeholder="Describe what happened and where exactly..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />

                  {/* Media */}
                  <p className="text-foreground text-xs font-semibold mb-2">Add Evidence</p>
                  <div className="flex gap-2 mb-5">
                    {[
                      { icon: Camera, label: "Photo" },
                      { icon: FileText, label: "Video" },
                      { icon: Mic, label: "Voice" },
                    ].map(({ icon: Icon, label }) => (
                      <button key={label} className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-colors" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}>
                        <Icon size={16} className="text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Location row */}
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-5" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)" }}>
                    <MapPin size={14} className="text-primary" />
                    <div className="flex-1">
                      <p className="text-foreground text-xs font-medium">Current Location</p>
                      <p className="text-muted-foreground text-[11px]">Hyde Park, Chicago · Auto-detected</p>
                    </div>
                    <button className="text-primary text-xs font-medium">Change</button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!selectedType}
                    className="w-full py-4 rounded-2xl text-white font-semibold text-sm transition-all"
                    style={{ background: selectedType ? "#7c3aed" : "rgba(0,0,0,0.1)", color: selectedType ? "#fff" : "#7c6a9e" }}
                  >
                    Submit Report
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
