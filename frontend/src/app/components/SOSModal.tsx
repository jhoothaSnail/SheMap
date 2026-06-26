import { useState, useEffect, useCallback, useRef } from "react";
import { X, Phone, MapPin, Siren, MessageCircle, Mail, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { sosApi, type SOSResult } from "../api/api";

interface SOSModalProps {
  onClose: () => void;
  userPos?: { lat: number; lng: number } | null;
  journeyId?: string | null;
}

function waLink(phone: string | null, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function SOSModal({ onClose, userPos, journeyId }: SOSModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [phase, setPhase] = useState<"countdown" | "sending" | "sent" | "error">("countdown");
  const [result, setResult] = useState<SOSResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firedRef = useRef(false);

  const fire = useCallback(async () => {
    if (firedRef.current) return;
    firedRef.current = true;
    setPhase("sending");

    // Use the live position if we have it, otherwise try a one-shot read.
    let pos = userPos;
    if (!pos && "geolocation" in navigator) {
      pos = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000 },
        );
      });
    }
    try {
      const res = await sosApi.trigger({
        latitude: pos?.lat ?? 0,
        longitude: pos?.lng ?? 0,
        escalation_level: 2,
        journey_id: journeyId ?? undefined,
      });
      setResult(res);
      setPhase("sent");
    } catch (e: any) {
      setError(e?.message ?? "Couldn't send the SOS. Try calling emergency services directly.");
      setPhase("error");
    }
  }, [userPos, journeyId]);

  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          fire();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, fire]);

  const shareMessage = result?.share_message ?? "SheMap SOS: I need help.";
  const liveUrl = result?.live_location_url ?? "";

  const shareLocation = async () => {
    const text = `${shareMessage}`;
    if (navigator.share) {
      try { await navigator.share({ title: "SheMap SOS", text, url: liveUrl }); return; } catch { /* fall through */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm rounded-t-3xl overflow-hidden"
        style={{ background: "#faf4f7", maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div
          className="px-5 pt-6 pb-4"
          style={{ background: phase === "sent" ? "linear-gradient(135deg, #7f1d1d, #be123c)" : "linear-gradient(135deg, #1c0f18, #2e1424)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,63,94,0.25)", border: "1px solid rgba(244,63,94,0.4)" }}>
                <Siren size={18} style={{ color: "#f43f5e" }} />
              </div>
              <div>
                <span className="text-white font-bold tracking-wider text-base">SOS ALERT</span>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {phase === "sent" ? "Contacts notified · Live location ready" : phase === "sending" ? "Sending alert…" : "Preparing emergency response"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <X size={15} style={{ color: "rgba(255,255,255,0.7)" }} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {phase === "countdown" && (
            <>
              <div className="flex flex-col items-center py-5">
                <div className="relative w-36 h-36">
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(244,63,94,0.12)", animationDuration: "1.5s" }} />
                  <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 144 144">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(244,63,94,0.15)" strokeWidth="8" />
                    <circle cx="72" cy="72" r="60" fill="none" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - (5 - countdown) / 5)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold" style={{ color: "#f43f5e" }}>{countdown}</span>
                    <span className="text-xs mt-1" style={{ color: "#6e4a60" }}>seconds</span>
                  </div>
                </div>
                <p className="text-center text-sm mt-4 leading-relaxed" style={{ color: "#6e4a60" }}>
                  Alerting your trusted contacts and preparing your live location
                </p>
              </div>
              <button onClick={onClose} className="w-full py-4 rounded-2xl text-sm font-bold" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.12)", color: "#1c0f18", boxShadow: "0 1px 4px rgba(28,15,24,0.05)" }}>
                Cancel — I'm Safe
              </button>
            </>
          )}

          {phase === "sending" && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: "#f43f5e" }} />
              <p className="text-sm font-semibold" style={{ color: "#1c0f18" }}>Sending your SOS…</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Siren size={30} style={{ color: "#f43f5e" }} />
              <p className="text-foreground font-bold">SOS couldn't be sent</p>
              <p className="text-xs text-center" style={{ color: "#6e4a60" }}>{error}</p>
              <a href="tel:112" className="w-full mt-1 py-3.5 rounded-2xl text-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)" }}>
                Call Emergency (112)
              </a>
              <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-semibold" style={{ background: "#fff", border: "1.5px solid rgba(28,15,24,0.12)", color: "#1c0f18" }}>
                Close
              </button>
            </div>
          )}

          {phase === "sent" && result && (
            <>
              <div className="flex flex-col items-center py-3 mb-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: "rgba(244,63,94,0.12)", border: "2px solid rgba(244,63,94,0.3)" }}>
                  <Siren size={30} style={{ color: "#f43f5e" }} />
                </div>
                <h2 className="text-foreground text-lg font-bold">SOS Activated</h2>
                <p className="text-xs" style={{ color: "#6e4a60" }}>Tap a contact to send your live location now</p>
              </div>

              {/* Share live location (broadcast) */}
              <button onClick={shareLocation} className="w-full mb-3 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #c94076, #a8305a)", boxShadow: "0 4px 16px rgba(201,64,118,0.35)" }}>
                <MapPin size={16} /> Share live location
              </button>

              {/* Per-contact dispatch */}
              <div className="space-y-2 mb-4">
                {result.alert_contacts.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: "#6e4a60" }}>
                    No trusted contacts yet. Add some in the Emergency → Contacts tab.
                  </p>
                )}
                {result.alert_contacts.map((c) => {
                  const wa = waLink(c.phone, shareMessage);
                  return (
                    <div key={c.name + (c.phone ?? "")} className="flex items-center gap-2 rounded-xl p-2.5" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ background: "#c94076" }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-semibold truncate">{c.name}</p>
                        <p className="text-xs truncate" style={{ color: "#6e4a60" }}>{c.phone ?? c.email ?? ""}</p>
                      </div>
                      {c.phone && <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}><Phone size={14} className="text-emerald-600" /></a>}
                      {wa && <a href={wa} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(37,211,102,0.14)" }}><MessageCircle size={14} style={{ color: "#1faa55" }} /></a>}
                      {c.email && <a href={`mailto:${c.email}?subject=${encodeURIComponent("SheMap SOS")}&body=${encodeURIComponent(shareMessage)}`} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(28,15,24,0.06)" }}><Mail size={14} className="text-muted-foreground" /></a>}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <a href="tel:112" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white" style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)", boxShadow: "0 4px 16px rgba(244,63,94,0.3)" }}>
                  <Phone size={16} /> Call 112
                </a>
                <a href={liveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm" style={{ background: "rgba(201,64,118,0.1)", color: "#c94076", border: "1.5px solid rgba(201,64,118,0.25)" }}>
                  <MapPin size={16} /> Open Map
                </a>
              </div>

              <button onClick={onClose} className="w-full py-4 rounded-2xl font-bold text-sm" style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.12)", color: "#1c0f18" }}>
                End Alert — I'm Safe
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
