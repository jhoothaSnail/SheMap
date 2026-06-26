import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Siren, Mic, CheckCircle2, Navigation, Users, Plus,
  Square, Lock, ChevronRight, X, Zap, Eye, Share2, Play, Download, Phone,
} from "lucide-react";
import { ContactsPanel } from "./ContactsPanel";
import type { Journey } from "../api/api";

const SAFE_SPOTS = [
  { name: "Central Police Station", type: "police", dist: "450m", open: true, time: "24/7", icon: "🚔" },
  { name: "City Hospital", type: "hospital", dist: "680m", open: true, time: "24/7", icon: "🏥" },
  { name: "Local Pharmacy", type: "pharmacy", dist: "320m", open: false, time: "Closed", icon: "💊" },
  { name: "Petrol Station", type: "petrol", dist: "210m", open: true, time: "24/7", icon: "⛽" },
  { name: "Convenience Store", type: "store", dist: "190m", open: true, time: "24/7", icon: "🏪" },
];

const ESCALATION_LEVELS = [
  { level: 1, label: "SOS Activated", desc: "App records location & time", color: "#f59e0b", icon: Siren },
  { level: 2, label: "Contacts Alerted", desc: "Trusted contacts notified", color: "#f97316", icon: Users },
  { level: 3, label: "Live Tracking", desc: "Location shared continuously", color: "#ef4444", icon: Navigation },
  { level: 4, label: "Evidence Recording", desc: "Audio capture begins", color: "#dc2626", icon: Mic },
  { level: 5, label: "Emergency Services", desc: "Call 112. Evidence ready.", color: "#991b1b", icon: Phone },
];

interface EmergencyHubProps {
  onSOS: () => void;
  activeJourney: Journey | null;
  watchers: number;
  canStartJourney: boolean;
  destinationLabel?: string;
  startError?: string | null;
  onStartJourney: () => void;
  onConfirmArrival: () => void;
  onShareJourney: () => void;
  onPlanRoute: () => void;
}

function minutesLeft(expected: string | null): number | null {
  if (!expected) return null;
  return Math.round((new Date(expected).getTime() - Date.now()) / 60000);
}

export function EmergencyHub({
  onSOS, activeJourney, watchers, canStartJourney, destinationLabel,
  startError, onStartJourney, onConfirmArrival, onShareJourney, onPlanRoute,
}: EmergencyHubProps) {
  const [currentEscLevel, setCurrentEscLevel] = useState(0);
  const [showEscalation, setShowEscalation] = useState(false);
  const [subView, setSubView] = useState<"main" | "spots" | "evidence" | "contacts">("main");

  // ── Real audio evidence recording (MediaRecorder) ───────────────────
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recError, setRecError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const startRecording = async () => {
    setRecError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setRecError("Microphone access denied. Enable it in your browser settings to record evidence.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const mins = minutesLeft(activeJourney?.expected_arrival ?? null);
  const overdue = mins !== null && mins < 0;

  const subNavOptions = [
    { id: "main", label: "Main" },
    { id: "spots", label: "Safe Spots" },
    { id: "evidence", label: "Evidence" },
    { id: "contacts", label: "Contacts" },
  ];

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="rounded-2xl px-4 py-3.5 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #1c0f18 0%, #2e1424 100%)", boxShadow: "0 4px 24px rgba(28,15,24,0.2)" }}>
        <div>
          <p className="font-bold text-white">Emergency Hub</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Your safety command center</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full font-bold" style={{ background: "rgba(16,185,129,0.2)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Protected
        </div>
      </div>

      {/* Sub nav */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl" style={{ background: "rgba(28,15,24,0.06)", border: "1px solid rgba(28,15,24,0.07)" }}>
        {subNavOptions.map((opt) => (
          <button key={opt.id} onClick={() => setSubView(opt.id as typeof subView)}
            className="py-2 rounded-xl text-[10px] font-bold capitalize transition-all"
            style={{ background: subView === opt.id ? "#ffffff" : "transparent", color: subView === opt.id ? "#c94076" : "#6e4a60", boxShadow: subView === opt.id ? "0 1px 6px rgba(28,15,24,0.1)" : "none" }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* MAIN */}
      {subView === "main" && (
        <>
          {/* Big SOS */}
          <button onClick={onSOS} className="relative w-full rounded-3xl flex flex-col items-center justify-center py-7 overflow-hidden" style={{ background: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)", boxShadow: "0 10px 40px rgba(244,63,94,0.5), 0 0 0 1px rgba(244,63,94,0.3)" }}>
            <div className="absolute inset-0 opacity-25">
              <div className="absolute inset-0 rounded-3xl animate-ping" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)", animationDuration: "2s" }} />
            </div>
            <Siren size={36} className="text-white mb-2" />
            <span className="text-white text-3xl font-bold tracking-widest">SOS</span>
            <span className="text-white/75 text-xs mt-1.5 font-medium">Tap · 5-second countdown · Contacts alerted</span>
          </button>

          {/* Journey Monitor — real */}
          <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: activeJourney ? "1.5px solid rgba(16,185,129,0.4)" : "1.5px solid rgba(28,15,24,0.09)", boxShadow: activeJourney ? "0 2px 16px rgba(16,185,129,0.12)" : "0 1px 4px rgba(28,15,24,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                  <Navigation size={13} className="text-primary" />
                </div>
                <span className="text-foreground text-sm font-bold">Journey Monitor</span>
              </div>
              <div className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{
                background: activeJourney ? (overdue ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)") : "rgba(28,15,24,0.06)",
                color: activeJourney ? (overdue ? "#b45309" : "#059669") : "#6e4a60",
              }}>
                {activeJourney ? (overdue ? "Running late" : "Active") : "No active journey"}
              </div>
            </div>

            {!activeJourney ? (
              <>
                <div className="rounded-xl px-3 py-2.5 mb-3 text-sm font-medium" style={{ background: "rgba(28,15,24,0.05)", border: "1px solid rgba(28,15,24,0.08)", color: canStartJourney ? "#1c0f18" : "#6e4a60" }}>
                  {canStartJourney ? `Destination: ${destinationLabel || "selected"}` : "No route planned yet"}
                </div>
                {canStartJourney ? (
                  <button onClick={onStartJourney} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #c94076, #a8305a)", boxShadow: "0 3px 12px rgba(201,64,118,0.35)" }}>
                    Start Monitored Journey
                  </button>
                ) : (
                  <button onClick={onPlanRoute} className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: "rgba(201,64,118,0.08)", border: "1.5px dashed rgba(201,64,118,0.4)", color: "#c94076" }}>
                    Plan a route on the Map first
                  </button>
                )}
                {startError && <p className="text-xs mt-2" style={{ color: "#dc2626" }}>{startError}</p>}
                <p className="text-xs mt-2" style={{ color: "#6e4a60" }}>Contacts are notified if you don't arrive on time.</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="w-0.5 h-8" style={{ background: "rgba(28,15,24,0.12)" }} />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-xs font-semibold truncate">{activeJourney.origin_label || "Start"}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#6e4a60" }}>→ {activeJourney.dest_label || "Destination"}</p>
                    <p className="text-[11px] mt-1 font-bold" style={{ color: overdue ? "#b45309" : "#059669" }}>
                      {mins === null ? "Tracking…" : overdue ? `${Math.abs(mins)} min overdue` : `~${mins} min remaining`}
                    </p>
                  </div>
                </div>

                {/* Watching indicator */}
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <Eye size={13} className="text-emerald-600" />
                  <span className="text-xs font-semibold" style={{ color: "#059669" }}>
                    {watchers > 0 ? `${watchers} ${watchers === 1 ? "contact is" : "contacts are"} watching your location` : "Share your live location with contacts"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={onShareJourney} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={{ background: "rgba(201,64,118,0.1)", border: "1.5px solid rgba(201,64,118,0.3)", color: "#c94076" }}>
                    <Share2 size={13} /> Share live location
                  </button>
                  <button onClick={onConfirmArrival} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={{ background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.3)", color: "#059669" }}>
                    <CheckCircle2 size={13} /> I've Arrived
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Trusted contacts entry */}
          <button onClick={() => setSubView("contacts")} className="w-full rounded-2xl p-4 flex items-center justify-between transition-all" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.05)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                <Users size={16} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-foreground text-sm font-bold">Trusted Contacts</p>
                <p className="text-xs" style={{ color: "#6e4a60" }}>Add or manage who gets alerted</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(201,64,118,0.1)", color: "#c94076" }}>
              <Plus size={12} /> Add
            </div>
          </button>

          {/* Escalation workflow CTA (informational) */}
          <button onClick={() => setShowEscalation(true)} className="w-full rounded-2xl p-4 flex items-center justify-between transition-all" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.05)" }}>
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
        </>
      )}

      {/* SAFE SPOTS */}
      {subView === "spots" && (
        <>
          <p className="text-xs font-medium" style={{ color: "#6e4a60" }}>Nearby safe places, sorted by distance.</p>
          <div className="space-y-2">
            {SAFE_SPOTS.map((spot) => (
              <div key={spot.name} className="w-full text-left rounded-2xl p-3.5 flex items-center gap-3" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 1px 4px rgba(28,15,24,0.04)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(201,64,118,0.08)" }}>{spot.icon}</div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-semibold">{spot.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "#6e4a60" }}>{spot.dist}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: spot.open ? "rgba(16,185,129,0.12)" : "rgba(28,15,24,0.06)", color: spot.open ? "#059669" : "#6e4a60" }}>{spot.time}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                  <Navigation size={14} className="text-primary" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px]" style={{ color: "#6e4a60" }}>Tip: live safe spots around you are shown on the Map tab's “Safe Spots” mode.</p>
        </>
      )}

      {/* EVIDENCE — real audio recording */}
      {subView === "evidence" && (
        <>
          <div className="rounded-2xl p-4" style={{ background: "rgba(244,63,94,0.07)", border: "1.5px solid rgba(244,63,94,0.22)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Lock size={13} style={{ color: "#f43f5e" }} />
              <span className="text-sm font-bold" style={{ color: "#dc2626" }}>Evidence Recording</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#6e4a60" }}>Record an audio clip on your device. It stays on your phone — play it back or download it as proof.</p>
          </div>

          <div className="rounded-2xl p-5 flex flex-col items-center gap-3" style={{ background: "#ffffff", border: `2px solid ${recording ? "#f43f5e" : "rgba(28,15,24,0.09)"}`, boxShadow: recording ? "0 4px 20px rgba(244,63,94,0.2)" : "0 1px 4px rgba(28,15,24,0.05)" }}>
            <button
              onClick={recording ? stopRecording : startRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
              style={{ background: recording ? "rgba(244,63,94,0.15)" : "rgba(28,15,24,0.05)", border: `2px solid ${recording ? "#f43f5e" : "rgba(28,15,24,0.12)"}` }}
            >
              {recording ? <Square size={28} style={{ color: "#f43f5e" }} /> : <Mic size={30} style={{ color: "#6e4a60" }} />}
            </button>
            <span className="text-sm font-bold" style={{ color: recording ? "#f43f5e" : "#1c0f18" }}>
              {recording ? `● Recording ${fmt(elapsed)}` : "Tap to record audio"}
            </span>
            {recError && <p className="text-xs text-center" style={{ color: "#dc2626" }}>{recError}</p>}
          </div>

          {audioUrl && !recording && (
            <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Play size={14} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Last recording</span>
              </div>
              <audio src={audioUrl} controls className="w-full mb-3" />
              <a href={audioUrl} download={`shemap-evidence-${Date.now()}.webm`} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold" style={{ background: "rgba(201,64,118,0.1)", color: "#c94076" }}>
                <Download size={13} /> Download clip
              </a>
            </div>
          )}
        </>
      )}

      {/* CONTACTS — fully wired to the backend */}
      {subView === "contacts" && (
        <div className="-mx-4 -mt-1">
          <ContactsPanel />
        </div>
      )}

      {/* Escalation Modal (informational) */}
      <AnimatePresence>
        {showEscalation && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowEscalation(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-sm rounded-t-3xl p-6" style={{ background: "#faf4f7", borderTop: "1.5px solid rgba(28,15,24,0.1)" }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-foreground font-bold">Escalation Workflow</span>
                  <p className="text-xs mt-0.5" style={{ color: "#6e4a60" }}>5-level emergency response</p>
                </div>
                <button onClick={() => setShowEscalation(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(28,15,24,0.07)" }}>
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
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: active ? `${lvl.color}20` : "rgba(28,15,24,0.05)", border: `2px solid ${active ? lvl.color : "rgba(28,15,24,0.1)"}` }}>
                          <Icon size={15} style={{ color: active ? lvl.color : "#6e4a60" }} />
                        </div>
                        {i < ESCALATION_LEVELS.length - 1 && <div className="w-0.5 h-4 mt-1" style={{ background: active ? lvl.color : "rgba(28,15,24,0.1)" }} />}
                      </div>
                      <div className="pb-2 pt-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: active ? lvl.color : "#1c0f18" }}>Level {lvl.level}: {lvl.label}</p>
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
                  <button onClick={() => setCurrentEscLevel((p) => Math.min(p + 1, 5))} className="flex-1 py-3.5 rounded-2xl text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${ESCALATION_LEVELS[currentEscLevel]?.color || "#c94076"}, ${ESCALATION_LEVELS[currentEscLevel]?.color || "#a8305a"}dd)`, boxShadow: `0 4px 16px ${ESCALATION_LEVELS[currentEscLevel]?.color || "#c94076"}55` }}>
                    Simulate Level {currentEscLevel + 1}
                  </button>
                )}
                <button onClick={() => { setShowEscalation(false); setCurrentEscLevel(0); }} className="px-4 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: "rgba(28,15,24,0.07)", color: "#6e4a60" }}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
