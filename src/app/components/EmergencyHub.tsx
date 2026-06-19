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
  { name: "Sarah K.", phone: "+1 (555) 876-5432", avatar: "S", color: "#a855f7", priority: 2 },
  { name: "Jamie L.", phone: "+1 (555) 345-6789", avatar: "J", color: "#6366f1", priority: 3 },
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
    // Simulate a deviation alert after 3 seconds
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
    idle: "#7c3aed",
    active: "#10b981",
    delayed: "#f59e0b",
    interrupted: "#f43f5e",
    complete: "#10b981",
  };
  const journeyLabels: Record<JourneyState, string> = {
    idle: "No active journey",
    active: "Journey Active",
    delayed: "Journey Delayed",
    interrupted: "Journey Interrupted",
    complete: "Arrived Safely ✓",
  };

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-semibold">Emergency Hub</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Your safety command center</p>
        </div>
        <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Protected
        </div>
      </div>

      {/* Sub nav */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl" style={{ background: "rgba(0,0,0,0.04)" }}>
        {(["main", "spots", "evidence", "contacts"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setSubView(v)}
            className="py-2 rounded-xl text-[10px] font-medium capitalize transition-all"
            style={{
              background: subView === v ? "#ffffff" : "transparent",
              color: subView === v ? "#7c3aed" : "#7c6a9e",
              boxShadow: subView === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {v === "spots" ? "Safe Spots" : v === "evidence" ? "Evidence" : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* MAIN */}
      {subView === "main" && (
        <>
          {/* Big SOS */}
          <button
            onClick={onSOS}
            className="relative w-full rounded-3xl flex flex-col items-center justify-center py-6 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)", boxShadow: "0 8px 32px rgba(244,63,94,0.4)" }}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 rounded-3xl animate-ping" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)", animationDuration: "2s" }} />
            </div>
            <Siren size={32} className="text-white mb-2" />
            <span className="text-white text-2xl font-bold tracking-widest">SOS</span>
            <span className="text-white/80 text-xs mt-1">Hold or tap · Contacts alerted in 5s</span>
          </button>

          {/* Journey Monitor */}
          <div className="rounded-2xl p-4 bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation size={14} className="text-primary" />
                <span className="text-foreground text-sm font-semibold">Journey Monitor</span>
              </div>
              <div
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${journeyColors[journeyState]}15`, color: journeyColors[journeyState] }}
              >
                {journeyLabels[journeyState]}
              </div>
            </div>

            {journeyState === "idle" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 rounded-xl px-3 py-2 text-sm text-muted-foreground" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    {journeyDest}
                  </div>
                  <button onClick={startJourney} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "#7c3aed" }}>
                    Start
                  </button>
                </div>
                <p className="text-muted-foreground text-xs">Contacts will be notified if you don't arrive on time.</p>
              </>
            )}

            {journeyState === "active" && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="w-0.5 h-8 bg-muted" />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground text-xs font-medium">Hyde Park (Current)</p>
                    <p className="text-muted-foreground text-[11px]">→ {journeyDest}</p>
                    <p className="text-emerald-500 text-[11px] mt-1 font-medium">ETA: 18 min · Safest Route</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowEscalation(true)} className="flex-1 py-2 rounded-xl text-xs text-accent font-medium" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                    🚨 Alert Contacts
                  </button>
                  <button onClick={completeJourney} className="flex-1 py-2 rounded-xl text-xs text-emerald-600 font-medium" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    ✓ I've Arrived
                  </button>
                </div>
              </>
            )}

            {journeyState === "complete" && (
              <div className="flex flex-col items-center py-2 gap-2">
                <CheckCircle2 size={28} className="text-emerald-500" />
                <p className="text-foreground text-sm font-semibold">Safe Arrival Confirmed</p>
                <p className="text-muted-foreground text-xs text-center">Mom, Sarah K. and Jamie L. have been notified.</p>
                <button onClick={() => setJourneyState("idle")} className="text-primary text-xs font-medium mt-1">
                  Start New Journey
                </button>
              </div>
            )}
          </div>

          {/* Escalation Workflow */}
          <button
            onClick={() => setShowEscalation(true)}
            className="w-full rounded-2xl p-4 bg-card border border-border flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-accent" />
              <div className="text-left">
                <p className="text-foreground text-sm font-medium">Escalation Workflow</p>
                <p className="text-muted-foreground text-xs">5-level emergency response system</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>

          {/* Quick safety stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Safe Trips", value: "47", icon: "🛡️" },
              { label: "Contacts", value: "3", icon: "👥" },
              { label: "Reports", value: "12", icon: "📍" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-3 bg-card border border-border flex flex-col items-center gap-1">
                <span className="text-xl">{s.icon}</span>
                <span className="text-foreground font-bold">{s.value}</span>
                <span className="text-muted-foreground text-[10px]">{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SAFE SPOTS */}
      {subView === "spots" && (
        <>
          <p className="text-xs text-muted-foreground">Tap to get directions. Sorted by distance.</p>
          <div className="space-y-2">
            {SAFE_SPOTS.map((spot) => (
              <button key={spot.name} className="w-full text-left rounded-2xl p-3.5 bg-card border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(124,58,237,0.08)" }}>
                  {spot.icon}
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{spot.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-muted-foreground text-xs">{spot.dist}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: spot.open ? "rgba(16,185,129,0.1)" : "rgba(0,0,0,0.05)", color: spot.open ? "#10b981" : "#7c6a9e" }}>
                      {spot.time}
                    </span>
                  </div>
                </div>
                <Navigation size={14} className="text-primary" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* EVIDENCE */}
      {subView === "evidence" && (
        <>
          <div className="rounded-2xl p-4" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Lock size={13} className="text-accent" />
              <span className="text-accent text-xs font-semibold">Evidence Protection Mode</span>
            </div>
            <p className="text-muted-foreground text-xs">All recordings are encrypted and automatically backed up to secure cloud. Only you control access.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleEvidence("audio")}
              className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
              style={{
                background: evidenceState === "audio" ? "rgba(244,63,94,0.1)" : "#ffffff",
                border: `2px solid ${evidenceState === "audio" ? "#f43f5e" : "rgba(0,0,0,0.07)"}`,
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: evidenceState === "audio" ? "rgba(244,63,94,0.15)" : "rgba(0,0,0,0.04)" }}>
                <Mic size={22} style={{ color: evidenceState === "audio" ? "#f43f5e" : "#7c6a9e" }} />
              </div>
              <span className="text-foreground text-sm font-medium">Audio</span>
              <span className="text-[10px]" style={{ color: evidenceState === "audio" ? "#f43f5e" : "#7c6a9e" }}>
                {evidenceState === "audio" ? "● Recording" : "Tap to start"}
              </span>
            </button>
            <button
              onClick={() => toggleEvidence("video")}
              className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
              style={{
                background: evidenceState === "video" ? "rgba(244,63,94,0.1)" : "#ffffff",
                border: `2px solid ${evidenceState === "video" ? "#f43f5e" : "rgba(0,0,0,0.07)"}`,
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: evidenceState === "video" ? "rgba(244,63,94,0.15)" : "rgba(0,0,0,0.04)" }}>
                <Camera size={22} style={{ color: evidenceState === "video" ? "#f43f5e" : "#7c6a9e" }} />
              </div>
              <span className="text-foreground text-sm font-medium">Video</span>
              <span className="text-[10px]" style={{ color: evidenceState === "video" ? "#f43f5e" : "#7c6a9e" }}>
                {evidenceState === "video" ? "● Recording" : "Tap to start"}
              </span>
            </button>
          </div>

          {evidenceState !== "off" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-4 bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-accent text-xs font-semibold">Recording Active</span>
                </div>
                <span className="text-muted-foreground text-xs font-mono">00:00:47</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-1/4 rounded-full bg-accent animate-pulse" />
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 rounded-xl text-xs text-foreground font-medium flex items-center justify-center gap-1.5" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <Upload size={12} /> Backup Now
                </button>
                <button onClick={() => setEvidenceState("off")} className="flex-1 py-2 rounded-xl text-xs text-accent font-medium flex items-center justify-center gap-1.5" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <Square size={12} /> Stop
                </button>
              </div>
            </motion.div>
          )}

          {/* Evidence timeline */}
          <div>
            <p className="text-foreground text-sm font-semibold mb-2">Evidence Timeline</p>
            {[
              { time: "9:12 PM", type: "Audio", dur: "2m 34s", uploaded: true },
              { time: "Yesterday", type: "Photo", dur: "1 file", uploaded: true },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>
                  {e.type === "Audio" ? <Mic size={14} className="text-primary" /> : <Camera size={14} className="text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-xs font-medium">{e.type} · {e.dur}</p>
                  <p className="text-muted-foreground text-[11px]">{e.time}</p>
                </div>
                {e.uploaded && <span className="text-[10px] text-emerald-500 font-medium">Backed up ✓</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* CONTACTS */}
      {subView === "contacts" && (
        <>
          <p className="text-xs text-muted-foreground">Drag to reorder priority. All contacts alerted in sequence during SOS.</p>
          <div className="space-y-2">
            {CONTACTS.map((c) => (
              <div key={c.name} className="rounded-2xl p-3.5 bg-card border border-border flex items-center gap-3">
                <div className="text-muted-foreground text-xs font-bold w-4">{c.priority}</div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: c.color }}>
                  {c.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{c.name}</p>
                  <p className="text-muted-foreground text-xs">{c.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)" }}>
                    <Phone size={13} className="text-emerald-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAddContact(true)}
            className="w-full py-3 rounded-2xl text-sm font-medium text-primary border-2 border-dashed border-primary/30 flex items-center justify-center gap-2"
          >
            + Add Trusted Contact
          </button>

          {showAddContact && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-4 bg-card border border-border">
              <p className="text-foreground text-sm font-semibold mb-3">Add Contact</p>
              <div className="space-y-2 mb-3">
                {["Name", "Phone Number", "Relationship"].map((f) => (
                  <div key={f} className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}>
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddContact(false)} className="flex-1 py-2.5 rounded-xl text-sm text-muted-foreground" style={{ background: "rgba(0,0,0,0.04)" }}>Cancel</button>
                <button onClick={() => setShowAddContact(false)} className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium" style={{ background: "#7c3aed" }}>Add</button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Escalation Modal */}
      <AnimatePresence>
        {showEscalation && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEscalation(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-t-3xl bg-card p-6"
              style={{ border: "1px solid rgba(0,0,0,0.08)", borderBottom: "none" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-foreground font-semibold">Escalation Workflow</span>
                <button onClick={() => setShowEscalation(false)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3 mb-5">
                {ESCALATION_LEVELS.map((lvl, i) => {
                  const Icon = lvl.icon;
                  const active = i < currentEscLevel;
                  return (
                    <div key={lvl.level} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: active ? `${lvl.color}20` : "rgba(0,0,0,0.05)", border: `2px solid ${active ? lvl.color : "rgba(0,0,0,0.1)"}` }}>
                          <Icon size={14} style={{ color: active ? lvl.color : "#7c6a9e" }} />
                        </div>
                        {i < ESCALATION_LEVELS.length - 1 && (
                          <div className="w-0.5 h-4 mt-1" style={{ background: active ? lvl.color : "rgba(0,0,0,0.1)" }} />
                        )}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium" style={{ color: active ? lvl.color : "#1e0a3c" }}>
                            Level {lvl.level}: {lvl.label}
                          </p>
                          {active && <CheckCircle2 size={13} style={{ color: lvl.color }} />}
                        </div>
                        <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {currentEscLevel < 5 && (
                  <button
                    onClick={() => setCurrentEscLevel((p) => Math.min(p + 1, 5))}
                    className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold"
                    style={{ background: ESCALATION_LEVELS[currentEscLevel]?.color || "#7c3aed" }}
                  >
                    Escalate to Level {currentEscLevel + 1}
                  </button>
                )}
                <button onClick={() => { setShowEscalation(false); setCurrentEscLevel(0); }} className="px-4 py-3 rounded-2xl text-sm text-muted-foreground" style={{ background: "rgba(0,0,0,0.05)" }}>
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
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl p-6 bg-card"
              style={{ border: "1px solid rgba(244,63,94,0.3)", boxShadow: "0 20px 60px rgba(244,63,94,0.2)" }}
            >
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(244,63,94,0.12)" }}>
                  <AlertTriangle size={28} className="text-accent" />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-1">Unexpected Route Change</h3>
                <p className="text-muted-foreground text-sm">You appear to have deviated from your planned route to 42 Oak Street.</p>
              </div>
              <p className="text-foreground text-sm font-semibold text-center mb-4">Are you safe?</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setShowDeviation(false)} className="py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: "#10b981" }}>
                  Yes, Safe
                </button>
                <button onClick={() => { setShowDeviation(false); setShowEscalation(true); setCurrentEscLevel(2); }} className="py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: "#f43f5e" }}>
                  No, Help
                </button>
                <button onClick={() => setShowDeviation(false)} className="py-3 rounded-2xl text-sm font-medium text-muted-foreground" style={{ background: "rgba(0,0,0,0.05)" }}>
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
