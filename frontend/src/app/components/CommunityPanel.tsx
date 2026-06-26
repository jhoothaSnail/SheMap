import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ThumbsUp, ThumbsDown, MessageCircle, MapPin, Clock, Plus,
  TrendingUp, Archive, Flame, CheckCircle2, Loader2,
} from "lucide-react";
import { reportsApi } from "../api/api";
import { ReportForm } from "./ReportForm";

type Lifecycle = "new" | "verified" | "trending" | "resolved" | "archived";

interface ApiReport {
  id: string;
  category: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location_label: string | null;
  severity: number;
  lifecycle: Lifecycle;
  is_verified: boolean;
  upvote_count: number;
  downvote_count: number;
  created_at: string;
}

interface CommunityPanelProps {
  userPos?: { lat: number; lng: number } | null;
  pickedLocation?: { lat: number; lng: number } | null;
  onPickOnMap?: () => void;
  reportFormOpen?: boolean;
  onReportFormOpenChange?: (open: boolean) => void;
}

const FILTERS = ["All", "Trending", "Verified", "Nearby", "Emergency"];

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  harassment: { icon: "⚠️", color: "#f43f5e" },
  catcalling: { icon: "📢", color: "#f59e0b" },
  following: { icon: "👤", color: "#f43f5e" },
  stalking: { icon: "🚨", color: "#f43f5e" },
  unsafe_crowd: { icon: "👥", color: "#f59e0b" },
  dark_area: { icon: "🌑", color: "#6366f1" },
  broken_streetlight: { icon: "🔦", color: "#f59e0b" },
  suspicious_person: { icon: "👁️", color: "#d94f86" },
  unsafe_shortcut: { icon: "⛔", color: "#f43f5e" },
  drunk_individuals: { icon: "🍺", color: "#f59e0b" },
};

const LIFECYCLE_COLORS: Record<Lifecycle, string> = {
  new: "#c94076", verified: "#10b981", trending: "#f43f5e", resolved: "#f07c4a", archived: "#6e4a60",
};

const LIFECYCLE_ICONS: Record<Lifecycle, React.ReactNode> = {
  new: <div className="w-1.5 h-1.5 rounded-full bg-primary" />,
  verified: <CheckCircle2 size={10} className="text-emerald-500" />,
  trending: <Flame size={10} className="text-accent" />,
  resolved: <CheckCircle2 size={10} className="text-indigo-500" />,
  archived: <Archive size={10} className="text-muted-foreground" />,
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function SeverityDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-2 h-2 rounded-full" style={{
          background: i <= level ? (level === 3 ? "#f43f5e" : level === 2 ? "#f59e0b" : "#10b981") : "rgba(28,15,24,0.1)",
        }} />
      ))}
    </div>
  );
}

export function CommunityPanel({
  userPos,
  pickedLocation,
  onPickOnMap,
  reportFormOpen,
  onReportFormOpenChange,
}: CommunityPanelProps) {
  const [filter, setFilter] = useState("All");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, "up" | "down" | null>>({});
  const [internalShowCreate, setInternalShowCreate] = useState(false);

  const showCreate = reportFormOpen ?? internalShowCreate;
  const setShowCreate = useCallback((open: boolean) => {
    onReportFormOpenChange ? onReportFormOpenChange(open) : setInternalShowCreate(open);
  }, [onReportFormOpenChange]);

  // Trending/Verified are meant for people in the same district/state, so we
  // query a much wider radius for those tabs; the rest stay tightly local.
  const isRegional = filter === "Trending" || filter === "Verified";

  const loadReports = useCallback(() => {
    setLoading(true);
    setError(null);
    const radius_m = isRegional ? 150_000 : 5_000;
    const params = userPos ? { lat: userPos.lat, lng: userPos.lng, radius_m } : undefined;
    reportsApi
      .list(params)
      .then((res: any) => setReports(res?.reports ?? []))
      .catch((e: any) => setError(e?.message ?? "Couldn't load reports."))
      .finally(() => setLoading(false));
  }, [userPos, isRegional]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const vote = async (id: string, dir: "up" | "down") => {
    const prev = votes[id] ?? null;
    const next = prev === dir ? null : dir;
    setVotes((v) => ({ ...v, [id]: next }));
    try {
      const res: any = await reportsApi.vote(id, dir);
      setReports((rs) => rs.map((r) =>
        r.id === id ? { ...r, upvote_count: res.upvote_count, downvote_count: res.downvote_count } : r,
      ));
    } catch {
      setVotes((v) => ({ ...v, [id]: prev }));
    }
  };

  const filtered = reports.filter((r) => {
    if (filter === "All" || filter === "Nearby") return true;
    if (filter === "Trending") return r.lifecycle === "trending";
    if (filter === "Verified") return r.is_verified;
    if (filter === "Emergency") return r.severity === 3;
    return true;
  });

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
          style={{ background: "linear-gradient(135deg, #c94076, #a8305a)", color: "#ffffff", boxShadow: "0 4px 16px rgba(201,64,118,0.35)" }}
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
      <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: "rgba(201,64,118,0.07)", border: "1.5px solid rgba(201,64,118,0.16)" }}>
        <TrendingUp size={12} className="text-primary shrink-0" />
        <p className="text-[10px]" style={{ color: "#6e4a60" }}>
          Ranked by: <span className="font-bold" style={{ color: "#c94076" }}>Freshness</span> · <span className="font-bold" style={{ color: "#c94076" }}>Upvotes</span> · <span className="font-bold" style={{ color: "#c94076" }}>Severity</span> · <span className="font-bold" style={{ color: "#c94076" }}>Credibility</span>
        </p>
      </div>

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <Loader2 size={22} className="animate-spin text-primary" />
          <p className="text-xs" style={{ color: "#6e4a60" }}>Loading reports near you…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-10 gap-3">
          <span className="text-3xl">📡</span>
          <p className="text-foreground font-bold">Couldn't load reports</p>
          <p className="text-xs text-center" style={{ color: "#6e4a60" }}>{error}</p>
          <button onClick={loadReports} className="text-xs font-bold px-4 py-2 rounded-xl" style={{ background: "rgba(201,64,118,0.1)", color: "#c94076" }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-3">
              <span className="text-4xl">🕊️</span>
              <p className="text-foreground font-bold">No Reports Here</p>
              <p className="text-xs text-center" style={{ color: "#6e4a60" }}>This area looks clear. Be the first to report if you see something.</p>
            </div>
          )}
          {filtered.map((inc) => {
            const meta = CATEGORY_META[inc.category] ?? { icon: "⚠️", color: "#c94076" };
            return (
              <motion.div
                key={inc.id}
                layout
                className="rounded-2xl p-4"
                style={{
                  background: "#ffffff",
                  border: inc.severity === 3 ? `1.5px solid ${meta.color}45` : "1.5px solid rgba(28,15,24,0.09)",
                  boxShadow: inc.severity === 3 ? `0 2px 16px ${meta.color}18` : "0 1px 4px rgba(28,15,24,0.05)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
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

                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#6e4a60" }}>
                        <MapPin size={9} />{inc.location_label || `${inc.latitude.toFixed(3)}, ${inc.longitude.toFixed(3)}`}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "#6e4a60" }}>
                        <Clock size={9} />{relativeTime(inc.created_at)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#6e4a60" }}>{inc.description}</p>

                    <div className="flex items-center gap-3">
                      <button onClick={() => vote(inc.id, "up")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors" style={{ background: votes[inc.id] === "up" ? "rgba(201,64,118,0.1)" : "rgba(28,15,24,0.05)" }}>
                        <ThumbsUp size={12} style={{ color: votes[inc.id] === "up" ? "#c94076" : "#6e4a60" }} fill={votes[inc.id] === "up" ? "#c94076" : "none"} />
                        <span className="text-xs font-semibold" style={{ color: votes[inc.id] === "up" ? "#c94076" : "#6e4a60" }}>{inc.upvote_count}</span>
                      </button>
                      <button onClick={() => vote(inc.id, "down")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors" style={{ background: votes[inc.id] === "down" ? "rgba(244,63,94,0.08)" : "rgba(28,15,24,0.05)" }}>
                        <ThumbsDown size={12} style={{ color: votes[inc.id] === "down" ? "#f43f5e" : "#6e4a60" }} fill={votes[inc.id] === "down" ? "#f43f5e" : "none"} />
                        <span className="text-xs font-semibold" style={{ color: votes[inc.id] === "down" ? "#f43f5e" : "#6e4a60" }}>{inc.downvote_count}</span>
                      </button>
                      <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#6e4a60" }}>
                        <MessageCircle size={12} />Comment
                      </button>
                      {inc.is_verified && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Report */}
      {showCreate && (
        <ReportForm
          defaultLocation={userPos}
          pickedLocation={pickedLocation}
          onPickOnMap={onPickOnMap}
          onClose={() => setShowCreate(false)}
          onSubmitted={loadReports}
        />
      )}
    </motion.div>
  );
}
