import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Siren, Shield, MapPin, Phone, Video, Mic, Radio,
  CheckCircle2, Clock, AlertTriangle, Navigation, Users,
  Play, Square, Upload, Lock, ChevronRight, X, Zap, Camera
} from "lucide-react";

type JourneyState = "idle" | "active" | "delayed" | "interrupted" | "complete";
type EvidenceState = "off" | "audio" | "video";

const SAFE_SPOTS = [
  { name: "Central Police Station", type: "police", dist: "450m", open: true, time: "24/7", icon: "🚔" },
  { name: "Hyde Park Hospital", type: "hospital", dist: "680m", open: true, time: "24/7", icon: "🏥" },
  { name: "Oak Street Pharmacy", type: "pharmacy", dist: "320m", open: false, time: "Closed", icon: "💊" },
  { name: "Shell Petrol Station", type: "petrol", dist: "210m", open: true, time: "24/7", icon: "⛽" },
  { name: "7-Eleven Convenience", type: "store", dist: "190m", open: true, time: "24/7", icon: "🏪" },
  { name: "Women's Safety Office", type: "office", dist: "900m", open: false, time: "9AM–6PM", icon: "🛡️" },
];

const ESCALATION_LEVELS = [
  { level: 1, label: "SOS Activated", desc: "App records location & time", color: "#f59e0b", icon: Siren },
  { level: 2, label: "Contacts Alerted", desc: "Mom, Sarah K. notified via SMS", color: "#f97316", icon: Users },
  { level: 3, label: "Live Tracking", desc: "Location shared every 30 seconds", color: "#ef4444", icon: Navigation },
  { level: 4, label: "Evidence Recording", desc: "Audio/video capture begins silently", color: "#dc2626", icon: Mic },
  { level: 5, label: "Emergency Services", desc: "911 recommended. Evidence ready to upload.", color: "#991b1b", icon: Phone },
];

const CONTACTS = [
  { name: "Mom", phone: "+1 (555) 234-5678", avatar: "M", color: "#f43f5e", priority: 1 },
  { name: "Sarah K.", phone: "+1 (555) 876-5432", avatar: "S", color: "#d94f86", priority: 2 },
  { name: "Jamie L.", phone: "+1 (555) 345-6789", avatar: "J", color: "#f07c4a", priority: 3 },
];

interface EmergencyHubProps {
  onSOS: () => void;
}

export function EmergencyHub({ onSOS }: EmergencyHubProps) {
  const [journeyState, setJourneyState] = useState<JourneyState>("idle");
  const [evidenceState, setEvidenceState] = useState<EvidenceState>("off");
  const [currentEscLevel, setCurrentEscLevel] = useState(0);
  const [showEscalation, setShowEscalation] = useState(false);
  const [showDeviation, setShowDeviation] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [journeyDest, setJourneyDest] = useState("42 Oak Street");
  const [subView, setSubView] = useState<"main" | "spots" | "evidence" | "contacts">("main");

  const startJourney = () => {
    setJourneyState("active");
    setCurrentEscLevel(0);
    setTimeout(() => setShowDeviation(true), 3000);
  };

  const completeJourney = () => {
    setJourneyState("complete");
    setShowDeviation(false);
  };

  const toggleEvidence = (type: "audio" | "video") => {
    setEvidenceState((prev) => (prev === type ? "off" : type));
  };

  const journeyColors: Record<JourneyState, string> = {
    idle: "#c94076", active: "#10b981", delayed: "#f59e0b",
    interrupted: "#f43f5e", complete: "#10b981",
  };
  const journeyLabels: Record<JourneyState, string> = {
    idle: "No active journey", active: "Journey Active", delayed: "Journey Delayed",
    interrupted: "Journey Interrupted", complete: "Arrived Safely ✓",
  };

  const subNavOptions = [
    { id: "main", label: "Main" },
    { id: "spots", label: "Safe Spots" },
    { id: "evidence", label: "Evidence" },
    { id: "contacts", label: "Contacts" },
  ];

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div
        className="rounded-2xl px-4 py-3.5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1c0f18 0%, #2e1424 100%)",
          boxShadow: "0 4px 24px rgba(28,15,24,0.2)",
        }}
      >
        <div>
          <p className="font-bold text-white">Emergency Hub</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Your safety command center</p>
        </div>
        <div
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full font-bold"
          style={{ background: "rgba(16,185,129,0.2)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Protected
        </div>
      </div>

      {/* Sub nav */}
      <div
        className="grid grid-cols-4 gap-1 p-1 rounded-2xl"
        style={{ background: "rgba(28,15,24,0.06)", border: "1px solid rgba(28,15,24,0.07)" }}
      >
        {subNavOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSubView(opt.id as typeof subView)}
            className="py-2 rounded-xl text-[10px] font-bold capitalize transition-all"
            style={{
              background: subView === opt.id ? "#ffffff" : "transparent",
              color: subView === opt.id ? "#c94076" : "#6e4a60",
              boxShadow: subView === opt.id ? "0 1px 6px rgba(28,15,24,0.1)" : "none",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* MAIN */}
      {subView === "main" && (
        <>
          {/* Big SOS — unchanged, keep prominence */}
          <button
            onClick={onSOS}
            className="relative w-full rounded-3xl flex flex-col items-center justify-center py-7 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
              boxShadow: "0 10px 40px rgba(244,63,94,0.5), 0 0 0 1px rgba(244,63,94,0.3)",
            }}
          >
            <div className="absolute inset-0 opacity-25">
              <div className="absolute inset-0 rounded-3xl animate-ping" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)", animationDuration: "2s" }} />
            </div>
            <Siren size={36} className="text-white mb-2" />
            <span className="text-white text-3xl font-bold tracking-widest">SOS</span>
            <span className="text-white/75 text-xs mt-1.5 font-medium">Hold or tap · Contacts alerted in 5s</span>
          </button>

          {/* Journey Monitor */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "#ffffff",
              border: journeyState === "active"
                ? "1.5px solid rgba(16,185,129,0.4)"
                : "1.5px solid rgba(28,15,24,0.09)",
              boxShadow: journeyState === "active"
                ? "0 2px 16px rgba(16,185,129,0.12)"
                : "0 1px 4px rgba(28,15,24,0.05)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                  <Navigation size={13} className="text-primary" />
                </div>
                <span className="text-foreground text-sm font-bold">Journey Monitor</span>
              </div>
              <div
                className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                style={{ background: `${journeyColors[journeyState]}15`, color: journeyColors[journeyState], border: `1px solid ${journeyColors[journeyState]}35` }}
              >
                {journeyLabels[journeyState]}
              </div>
            </div>

            {journeyState === "idle" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium" style={{ background: "rgba(28,15,24,0.05)", border: "1px solid rgba(28,15,24,0.08)", color: "#1c0f18" }}>
                    {journeyDest}
                  </div>
                  <button
                    onClick={startJourney}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #c94076, #a8305a)", boxShadow: "0 3px 12px rgba(201,64,118,0.35)" }}
                  >
                    Start
                  </button>
                </div>
                <p className="text-xs" style={{ color: "#6e4a60" }}>Contacts will be notified if you don't arrive on time.</p>
              </>
            )}

            {journeyState === "active" && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="w-0.5 h-8" style={{ background: "rgba(28,15,24,0.12)" }} />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground text-xs font-semibold">Hyde Park (Current)</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6e4a60" }}>→ {journeyDest}</p>
                    <p className="text-[11px] mt-1 font-bold text-emerald-600">ETA: 18 min · Safest Route</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEscalation(true)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: "rgba(244,63,94,0.1)", border: "1.5px solid rgba(244,63,94,0.3)", color: "#dc2626" }}
                  >
                    🚨 Alert Contacts
                  </button>
                  <button
                    onClick={completeJourney}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.3)", color: "#059669" }}
                  >
                    ✓ I've Arrived
                  </button>
                </div>
              </>
            )}

            {journeyState === "complete" && (
              <div className="flex flex-col items-center py-2 gap-2">
                <CheckCircle2 size={28} className="text-emerald-500" />
                <p className="text-foreground text-sm font-bold">Safe Arrival Confirmed</p>
                <p className="text-xs text-center" style={{ color: "#6e4a60" }}>Mom, Sarah K. and Jamie L. have been notified.</p>
                <button onClick={() => setJourneyState("idle")} className="text-primary text-xs font-bold mt-1">
                  Start New Journey
                </button>
              </div>
            )}
          </div>

          {/* Escalation workflow CTA */}
          <button
            onClick={() => setShowEscalation(true)}
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-all"
            style={{
              background: "#ffffff",
              border: "1.5px solid rgba(28,15,24,0.09)",
              boxShadow: "0 1px 4px rgba(28,15,24,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,63,94,0.1)" }}>
                <Zap size={16} style={{ color: "#f43f5e" }} />
              </div>
              <div className="text-left">
                <p className="text-foreground text-sm font-bold">Escalation Workflow</p>
                <p className="text-xs" style={{ color: "#6e4a60" }}>5-level emergency response system</p>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: "#6e4a60" }} />
          </button>

          {/* Quick safety stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Safe Trips", value: "47", icon: "🛡️", color: "#10b981" },
              { label: "Contacts", value: "3", icon: "👥", color: "#c94076" },
              { label: "Reports", value: "12", icon: "📍", color: "#f59e0b" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-3 flex flex-col items-center gap-1.5"
                style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}
              >
                <span className="text-xl">{s.icon}</span>
                <span className="font-bold text-base" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[10px] font-medium" style={{ color: "#6e4a60" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SAFE SPOTS */}
      {subView === "spots" && (
        <>
          <p className="text-xs font-medium" style={{ color: "#6e4a60" }}>Tap to get directions. Sorted by distance.</p>
          <div className="space-y-2">
            {SAFE_SPOTS.map((spot) => (
              <button
                key={spot.name}
                className="w-full text-left rounded-2xl p-3.5 flex items-center gap-3 transition-all"
                style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(201,64,118,0.08)" }}>
                  {spot.icon}
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-semibold">{spot.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "#6e4a60" }}>{spot.dist}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: spot.open ? "rgba(16,185,129,0.12)" : "rgba(28,15,24,0.06)",
                        color: spot.open ? "#059669" : "#6e4a60",
                      }}
                    >
                      {spot.time}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                  <Navigation size={14} className="text-primary" />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* EVIDENCE */}
      {subView === "evidence" && (
        <>
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(244,63,94,0.07)", border: "1.5px solid rgba(244,63,94,0.22)" }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Lock size={13} style={{ color: "#f43f5e" }} />
              <span className="text-sm font-bold" style={{ color: "#dc2626" }}>Evidence Protection Mode</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#6e4a60" }}>All recordings are encrypted and automatically backed up to secure cloud. Only you control access.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["audio", "video"] as const).map((type) => {
              const active = evidenceState === type;
              const Icon = type === "audio" ? Mic : Camera;
              return (
                <button
                  key={type}
                  onClick={() => toggleEvidence(type)}
                  className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
                  style={{
                    background: active ? "rgba(244,63,94,0.1)" : "#ffffff",
                    border: `2px solid ${active ? "#f43f5e" : "rgba(28,15,24,0.09)"}`,
                    boxShadow: active ? "0 4px 20px rgba(244,63,94,0.2)" : "0 1px 4px rgba(28,15,24,0.05)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: active ? "rgba(244,63,94,0.15)" : "rgba(28,15,24,0.05)" }}
                  >
                    <Icon size={22} style={{ color: active ? "#f43f5e" : "#6e4a60" }} />
                  </div>
                  <span className="text-foreground text-sm font-bold">{type === "audio" ? "Audio" : "Video"}</span>
                  <span className="text-[10px] font-semibold" style={{ color: active ? "#f43f5e" : "#6e4a60" }}>
                    {active ? "● Recording" : "Tap to start"}
                  </span>
                </button>
              );
            })}
          </div>

          {evidenceState !== "off" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1.5px solid rgba(244,63,94,0.3)", boxShadow: "0 2px 16px rgba(244,63,94,0.12)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-sm font-bold" style={{ color: "#f43f5e" }}>Recording Active</span>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: "#1c0f18" }}>00:00:47</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(28,15,24,0.08)" }}>
                <div className="h-full w-1/4 rounded-full bg-accent animate-pulse" />
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(28,15,24,0.06)", color: "#1c0f18" }}
                >
                  <Upload size={12} /> Backup Now
                </button>
                <button
                  onClick={() => setEvidenceState("off")}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(244,63,94,0.1)", border: "1.5px solid rgba(244,63,94,0.3)", color: "#dc2626" }}
                >
                  <Square size={12} /> Stop
                </button>
              </div>
            </motion.div>
          )}

          <div>
            <p className="text-foreground text-sm font-bold mb-2">Evidence Timeline</p>
            {[
              { time: "9:12 PM", type: "Audio", dur: "2m 34s", uploaded: true },
              { time: "Yesterday", type: "Photo", dur: "1 file", uploaded: true },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i === 0 ? "1px solid rgba(28,15,24,0.07)" : "none" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                  {e.type === "Audio" ? <Mic size={14} className="text-primary" /> : <Camera size={14} className="text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: "#1c0f18" }}>{e.type} · {e.dur}</p>
                  <p className="text-[11px]" style={{ color: "#6e4a60" }}>{e.time}</p>
                </div>
                {e.uploaded && <span className="text-[10px] font-bold text-emerald-600">Backed up ✓</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* CONTACTS */}
      {subView === "contacts" && (
        <>
          <p className="text-xs font-medium" style={{ color: "#6e4a60" }}>All contacts alerted in sequence during SOS.</p>
          <div className="space-y-2">
            {CONTACTS.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}
              >
                <div
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold"
                  style={{ background: "rgba(28,15,24,0.07)", color: "#6e4a60" }}
                >
                  {c.priority}
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ background: c.color, boxShadow: `0 2px 8px ${c.color}55` }}
                >
                  {c.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-bold">{c.name}</p>
                  <p className="text-xs" style={{ color: "#6e4a60" }}>{c.phone}</p>
                </div>
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
                >
                  <Phone size={14} className="text-emerald-600" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAddContact(true)}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: "rgba(201,64,118,0.07)",
              border: "1.5px dashed rgba(201,64,118,0.4)",
              color: "#c94076",
            }}
          >
            + Add Trusted Contact
          </button>

          {showAddContact && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 2px 12px rgba(28,15,24,0.08)" }}
            >
              <p className="text-foreground text-sm font-bold mb-3">Add Contact</p>
              <div className="space-y-2 mb-3">
                {["Name", "Phone Number", "Relationship"].map((f) => (
                  <div
                    key={f}
                    className="rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "rgba(28,15,24,0.05)", border: "1px solid rgba(28,15,24,0.08)", color: "#6e4a60" }}
                  >
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(28,15,24,0.06)", color: "#6e4a60" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #c94076, #a8305a)", boxShadow: "0 3px 12px rgba(201,64,118,0.3)" }}
                >
                  Add
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Escalation Modal */}
      <AnimatePresence>
        {showEscalation && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowEscalation(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-t-3xl p-6"
              style={{ background: "#faf4f7", borderTop: "1.5px solid rgba(28,15,24,0.1)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-foreground font-bold">Escalation Workflow</span>
                  <p className="text-xs mt-0.5" style={{ color: "#6e4a60" }}>5-level emergency response</p>
                </div>
                <button
                  onClick={() => setShowEscalation(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(28,15,24,0.07)" }}
                >
                  <X size={15} className="text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3 mb-5">
                {ESCALATION_LEVELS.map((lvl, i) => {
                  const Icon = lvl.icon;
                  const active = i < currentEscLevel;
                  return (
                    <div key={lvl.level} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: active ? `${lvl.color}20` : "rgba(28,15,24,0.05)",
                            border: `2px solid ${active ? lvl.color : "rgba(28,15,24,0.1)"}`,
                          }}
                        >
                          <Icon size={15} style={{ color: active ? lvl.color : "#6e4a60" }} />
                        </div>
                        {i < ESCALATION_LEVELS.length - 1 && (
                          <div className="w-0.5 h-4 mt-1" style={{ background: active ? lvl.color : "rgba(28,15,24,0.1)" }} />
                        )}
                      </div>
                      <div className="pb-2 pt-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: active ? lvl.color : "#1c0f18" }}>
                            Level {lvl.level}: {lvl.label}
                          </p>
                          {active && <CheckCircle2 size={13} style={{ color: lvl.color }} />}
                        </div>
                        <p className="text-xs" style={{ color: "#6e4a60" }}>{lvl.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {currentEscLevel < 5 && (
                  <button
                    onClick={() => setCurrentEscLevel((p) => Math.min(p + 1, 5))}
                    className="flex-1 py-3.5 rounded-2xl text-white text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${ESCALATION_LEVELS[currentEscLevel]?.color || "#c94076"}, ${ESCALATION_LEVELS[currentEscLevel]?.color || "#a8305a"}dd)`,
                      boxShadow: `0 4px 16px ${ESCALATION_LEVELS[currentEscLevel]?.color || "#c94076"}55`,
                    }}
                  >
                    Escalate to Level {currentEscLevel + 1}
                  </button>
                )}
                <button
                  onClick={() => { setShowEscalation(false); setCurrentEscLevel(0); }}
                  className="px-4 py-3.5 rounded-2xl text-sm font-semibold"
                  style={{ background: "rgba(28,15,24,0.07)", color: "#6e4a60" }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Route Deviation Modal */}
      <AnimatePresence>
        {showDeviation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl p-6"
              style={{
                background: "#faf4f7",
                border: "1.5px solid rgba(244,63,94,0.35)",
                boxShadow: "0 24px 64px rgba(244,63,94,0.25)",
              }}
            >
              <div className="flex flex-col items-center text-center mb-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(244,63,94,0.12)", border: "1.5px solid rgba(244,63,94,0.25)" }}
                >
                  <AlertTriangle size={30} style={{ color: "#f43f5e" }} />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-1">Unexpected Route Change</h3>
                <p className="text-sm" style={{ color: "#6e4a60" }}>You appear to have deviated from your planned route to 42 Oak Street.</p>
              </div>
              <p className="text-foreground text-sm font-bold text-center mb-4">Are you safe?</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowDeviation(false)}
                  className="py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 3px 12px rgba(16,185,129,0.35)" }}
                >
                  Yes, Safe
                </button>
                <button
                  onClick={() => { setShowDeviation(false); setShowEscalation(true); setCurrentEscLevel(2); }}
                  className="py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)", boxShadow: "0 3px 12px rgba(244,63,94,0.4)" }}
                >
                  No, Help
                </button>
                <button
                  onClick={() => setShowDeviation(false)}
                  className="py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: "rgba(28,15,24,0.07)", color: "#6e4a60" }}
                >
                  Need Help
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
