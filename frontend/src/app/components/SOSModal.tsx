import { useState, useEffect, useCallback } from "react";
import { X, Phone, MapPin, Siren, Shield } from "lucide-react";
import { motion } from "motion/react";

interface SOSModalProps {
  onClose: () => void;
}

const CONTACTS = [
  { name: "Mom", phone: "+1 (555) 234-5678", avatar: "M", color: "#c94076" },
  { name: "Sarah K.", phone: "+1 (555) 876-5432", avatar: "S", color: "#f07c4a" },
  { name: "Emergency", phone: "911", avatar: "E", color: "#f43f5e" },
];

export function SOSModal({ onClose }: SOSModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [triggered, setTriggered] = useState(false);
  const [alertsSent, setAlertsSent] = useState<string[]>([]);

  useEffect(() => {
    if (triggered) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          setTriggered(true);
          setAlertsSent(["Mom", "Sarah K.", "Emergency Services"]);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [triggered]);

  const cancel = useCallback(() => onClose(), [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={cancel} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm rounded-t-3xl overflow-hidden"
        style={{ background: "#faf4f7" }}
      >
        {/* Header — deep brand surface */}
        <div
          className="px-5 pt-6 pb-4"
          style={{
            background: triggered
              ? "linear-gradient(135deg, #7f1d1d, #be123c)"
              : "linear-gradient(135deg, #1c0f18, #2e1424)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(244,63,94,0.25)", border: "1px solid rgba(244,63,94,0.4)" }}
              >
                <Siren size={18} style={{ color: "#f43f5e" }} />
              </div>
              <div>
                <span className="text-white font-bold tracking-wider text-base">SOS ALERT</span>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {triggered ? "Contacts notified · Live tracking active" : "Preparing emergency response"}
                </p>
              </div>
            </div>
            <button
              onClick={cancel}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <X size={15} style={{ color: "rgba(255,255,255,0.7)" }} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {!triggered ? (
            <>
              {/* Countdown */}
              <div className="flex flex-col items-center py-5">
                <div className="relative w-36 h-36">
                  {/* Pulsing ring */}
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: "rgba(244,63,94,0.12)", animationDuration: "1.5s" }}
                  />
                  <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 144 144">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(244,63,94,0.15)" strokeWidth="8" />
                    <circle
                      cx="72" cy="72" r="60"
                      fill="none" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - (5 - countdown) / 5)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold" style={{ color: "#f43f5e" }}>{countdown}</span>
                    <span className="text-xs mt-1" style={{ color: "#6e4a60" }}>seconds</span>
                  </div>
                </div>
                <p className="text-center text-sm mt-4 leading-relaxed" style={{ color: "#6e4a60" }}>
                  Alerting your emergency contacts and sharing your live location
                </p>
              </div>

              {/* Contact list */}
              <div className="space-y-2 mb-5">
                {CONTACTS.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ background: c.color, boxShadow: `0 2px 8px ${c.color}55` }}
                    >
                      {c.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-semibold">{c.name}</p>
                      <p className="text-xs" style={{ color: "#6e4a60" }}>{c.phone}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f43f5e" }} />
                  </div>
                ))}
              </div>

              <button
                onClick={cancel}
                className="w-full py-4 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(28,15,24,0.12)",
                  color: "#1c0f18",
                  boxShadow: "0 1px 4px rgba(28,15,24,0.05)",
                }}
              >
                Cancel — I'm Safe
              </button>
            </>
          ) : (
            <>
              {/* Triggered state */}
              <div className="flex flex-col items-center py-4 mb-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: "rgba(244,63,94,0.12)",
                    border: "2px solid rgba(244,63,94,0.3)",
                    boxShadow: "0 0 0 6px rgba(244,63,94,0.08)",
                  }}
                >
                  <Siren size={38} style={{ color: "#f43f5e" }} />
                </div>
                <h2 className="text-foreground text-xl font-bold mb-1">SOS Activated</h2>
                <p className="text-sm" style={{ color: "#6e4a60" }}>Your location is being shared live</p>
              </div>

              <div className="space-y-2 mb-5">
                {alertsSent.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{
                      background: "rgba(16,185,129,0.07)",
                      border: "1.5px solid rgba(16,185,129,0.25)",
                    }}
                  >
                    <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-400" />
                    <span className="text-foreground text-sm font-medium flex-1">{name}</span>
                    <span className="text-emerald-600 text-xs font-bold">Notified ✓</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <button
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                  }}
                >
                  <Phone size={16} /> Call 911
                </button>
                <button
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm"
                  style={{
                    background: "rgba(201,64,118,0.1)",
                    color: "#c94076",
                    border: "1.5px solid rgba(201,64,118,0.25)",
                  }}
                >
                  <MapPin size={16} /> Share Map
                </button>
              </div>

              <button
                onClick={cancel}
                className="w-full py-4 rounded-2xl font-bold text-sm"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(28,15,24,0.12)",
                  color: "#1c0f18",
                  boxShadow: "0 1px 4px rgba(28,15,24,0.05)",
                }}
              >
                End Alert — I'm Safe
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
