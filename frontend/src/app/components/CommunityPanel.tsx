import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ThumbsUp, ThumbsDown, MessageCircle, MapPin, Clock, Plus, Camera,
  Mic, FileText, X, Filter, AlertTriangle, CheckCircle2,
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
    upvotes: 8, downvotes: 3, color: "#d94f86", icon: "👁️", lifecycle: "new", severity: 2, verified: false,
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
  new: "#c94076",
  verified: "#10b981",
  trending: "#f43f5e",
  resolved: "#f07c4a",
  archived: "#6e4a60",
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
        <div key={i} className="w-2 h-2 rounded-full" style={{
          background: i <= level
            ? (level === 3 ? "#f43f5e" : level === 2 ? "#f59e0b" : "#10b981")
            : "rgba(28,15,24,0.1)"
        }} />
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
    if (filter === "Nearby") return true;
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-bold">Community Reports</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6e4a60" }}>Real-time safety intelligence near you</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-xs px-4 py-2.5 rounded-xl font-bold transition-colors"
          style={{
            background: "linear-gradient(135deg, #c94076, #a8305a)",
            color: "#ffffff",
            boxShadow: "0 4px 16px rgba(201,64,118,0.35)",
          }}
        >
          <Plus size={13} /> Report
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === f ? "#1c0f18" : "#ffffff",
              color: filter === f ? "#ffffff" : "#6e4a60",
              border: filter === f ? "1.5px solid #1c0f18" : "1.5px solid rgba(28,15,24,0.1)",
              boxShadow: filter === f ? "0 2px 8px rgba(28,15,24,0.2)" : "0 1px 3px rgba(28,15,24,0.05)",
            }}
          >
            {f === "Emergency" ? "🚨 " + f : f}
          </button>
        ))}
      </div>

      {/* Ranking strip */}
      <div
        className="rounded-xl px-3 py-2.5 flex items-center gap-2"
        style={{ background: "rgba(201,64,118,0.07)", border: "1.5px solid rgba(201,64,118,0.16)" }}
      >
        <TrendingUp size={12} className="text-primary shrink-0" />
        <p className="text-[10px]" style={{ color: "#6e4a60" }}>
          Ranked by: <span className="font-bold" style={{ color: "#c94076" }}>Freshness</span> · <span className="font-bold" style={{ color: "#c94076" }}>Upvotes</span> · <span className="font-bold" style={{ color: "#c94076" }}>Severity</span> · <span className="font-bold" style={{ color: "#c94076" }}>Credibility</span>
        </p>
      </div>

      {/* Incident cards */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 && (
          <div className="flex flex-col items-center py-10 gap-3">
            <span className="text-4xl">🕊️</span>
            <p className="text-foreground font-bold">No Reports Here</p>
            <p className="text-xs text-center" style={{ color: "#6e4a60" }}>This area looks clear. Be the first to report if you see something.</p>
          </div>
        )}
        {filteredIncidents.map((inc) => (
          <motion.div
            key={inc.id}
            layout
            className="rounded-2xl p-4"
            style={{
              background: "#ffffff",
              border: inc.severity === 3
                ? `1.5px solid ${inc.color}45`
                : "1.5px solid rgba(28,15,24,0.09)",
              boxShadow: inc.severity === 3
                ? `0 2px 16px ${inc.color}18`
                : "0 1px 4px rgba(28,15,24,0.05)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
                style={{ background: `${inc.color}15`, border: `1px solid ${inc.color}30` }}
              >
                {inc.icon}
              </div>
              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-foreground text-sm font-bold">{inc.title}</span>
                    <div
                      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: `${LIFECYCLE_COLORS[inc.lifecycle]}12`, color: LIFECYCLE_COLORS[inc.lifecycle], border: `1px solid ${LIFECYCLE_COLORS[inc.lifecycle]}30` }}
                    >
                      {LIFECYCLE_ICONS[inc.lifecycle]}
                      <span className="capitalize ml-0.5">{inc.lifecycle}</span>
                    </div>
                  </div>
                  <SeverityDots level={inc.severity} />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#6e4a60" }}>
                    <MapPin size={9} />{inc.location}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "#6e4a60" }}>
                    <Clock size={9} />{inc.time}
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "#6e4a60" }}>{inc.desc}</p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => vote(inc.id, "up")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: votes[inc.id] === "up" ? "rgba(201,64,118,0.1)" : "rgba(28,15,24,0.05)",
                    }}
                  >
                    <ThumbsUp size={12} style={{ color: votes[inc.id] === "up" ? "#c94076" : "#6e4a60" }} fill={votes[inc.id] === "up" ? "#c94076" : "none"} />
                    <span className="text-xs font-semibold" style={{ color: votes[inc.id] === "up" ? "#c94076" : "#6e4a60" }}>
                      {inc.upvotes + (votes[inc.id] === "up" ? 1 : 0)}
                    </span>
                  </button>
                  <button
                    onClick={() => vote(inc.id, "down")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: votes[inc.id] === "down" ? "rgba(244,63,94,0.08)" : "rgba(28,15,24,0.05)",
                    }}
                  >
                    <ThumbsDown size={12} style={{ color: votes[inc.id] === "down" ? "#f43f5e" : "#6e4a60" }} fill={votes[inc.id] === "down" ? "#f43f5e" : "none"} />
                    <span className="text-xs font-semibold" style={{ color: votes[inc.id] === "down" ? "#f43f5e" : "#6e4a60" }}>
                      {inc.downvotes + (votes[inc.id] === "down" ? 1 : 0)}
                    </span>
                  </button>
                  <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#6e4a60" }}>
                    <MessageCircle size={12} />Comment
                  </button>
                  {inc.verified && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-600">
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative w-full max-w-sm rounded-t-3xl"
              style={{ background: "#faf4f7", maxHeight: "88vh", overflowY: "auto", scrollbarWidth: "none" }}
            >
              {submitted ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <p className="text-foreground font-bold text-lg">Report Submitted!</p>
                  <p className="text-sm" style={{ color: "#6e4a60" }}>Thank you for keeping the community safe.</p>
                </div>
              ) : (
                <div className="p-5">
                  {/* Sheet header */}
                  <div
                    className="flex items-center justify-between mb-5 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-3xl"
                    style={{ background: "linear-gradient(135deg, #1c0f18, #2e1424)" }}
                  >
                    <div>
                      <h3 className="font-bold text-white">New Safety Report</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Hyde Park, Chicago · Auto-location</p>
                    </div>
                    <button
                      onClick={() => setShowCreate(false)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                    >
                      <X size={15} style={{ color: "rgba(255,255,255,0.7)" }} />
                    </button>
                  </div>

                  {/* Type grid */}
                  <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>WHAT HAPPENED?</p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {REPORT_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedType(t.id)}
                        className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: selectedType === t.id ? "rgba(201,64,118,0.1)" : "#ffffff",
                          border: `1.5px solid ${selectedType === t.id ? "#c94076" : "rgba(28,15,24,0.09)"}`,
                          boxShadow: selectedType === t.id ? "0 2px 10px rgba(201,64,118,0.2)" : "0 1px 3px rgba(28,15,24,0.05)",
                        }}
                      >
                        <span className="text-base">{t.icon}</span>
                        <span className="text-xs font-semibold" style={{ color: selectedType === t.id ? "#c94076" : "#1c0f18" }}>{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Severity */}
                  <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>SEVERITY</p>
                  <div className="flex gap-2 mb-5">
                    {([1, 2, 3] as const).map((s) => {
                      const colors = s === 1 ? { c: "#059669", bg: "rgba(16,185,129,0.12)", brd: "rgba(16,185,129,0.4)" }
                        : s === 2 ? { c: "#b45309", bg: "rgba(245,158,11,0.12)", brd: "rgba(245,158,11,0.4)" }
                        : { c: "#dc2626", bg: "rgba(244,63,94,0.12)", brd: "rgba(244,63,94,0.4)" };
                      return (
                        <button
                          key={s}
                          onClick={() => setSeverity(s)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: severity === s ? colors.bg : "#ffffff",
                            color: severity === s ? colors.c : "#6e4a60",
                            border: `1.5px solid ${severity === s ? colors.brd : "rgba(28,15,24,0.09)"}`,
                            boxShadow: severity === s ? `0 2px 8px ${colors.brd}` : "none",
                          }}
                        >
                          {s === 1 ? "Low" : s === 2 ? "Moderate" : "High"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Description */}
                  <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>DESCRIPTION</p>
                  <textarea
                    className="w-full rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-5"
                    style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", minHeight: 80 }}
                    placeholder="Describe what happened and where exactly..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />

                  {/* Media */}
                  <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>ADD EVIDENCE</p>
                  <div className="flex gap-2 mb-5">
                    {[{ icon: Camera, label: "Photo" }, { icon: FileText, label: "Video" }, { icon: Mic, label: "Voice" }].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl transition-colors"
                        style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)" }}
                      >
                        <Icon size={16} style={{ color: "#6e4a60" }} />
                        <span className="text-[10px] font-semibold" style={{ color: "#6e4a60" }}>{label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!selectedType}
                    className="w-full py-4 rounded-2xl text-sm font-bold transition-all"
                    style={{
                      background: selectedType
                        ? "linear-gradient(135deg, #c94076, #a8305a)"
                        : "rgba(28,15,24,0.08)",
                      color: selectedType ? "#fff" : "#6e4a60",
                      boxShadow: selectedType ? "0 6px 20px rgba(201,64,118,0.35)" : "none",
                    }}
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
