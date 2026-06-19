import { useState, useEffect, useCallback } from "react";
import { X, Phone, MapPin, Users, Siren } from "lucide-react";
import { motion } from "motion/react";

interface SOSModalProps {
  onClose: () => void;
}

const CONTACTS = [
  { name: "Mom", phone: "+1 (555) 234-5678", avatar: "M" },
  { name: "Sarah K.", phone: "+1 (555) 876-5432", avatar: "S" },
  { name: "Emergency", phone: "911", avatar: "E" },
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

  const cancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={cancel} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm rounded-t-3xl overflow-hidden"
        style={{ background: triggered ? "linear-gradient(135deg, #fff0f2, #ffe4e8)" : "linear-gradient(135deg, #f5f0ff, #ede4ff)" }}
      >
        {/* Pulsing ring */}
        {!triggered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-64 h-64 rounded-full border-2 border-accent/30 animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
          </div>
        )}

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Siren size={20} className="text-accent" />
              <span className="text-accent font-semibold tracking-wide">SOS ALERT</span>
            </div>
            <button
              onClick={cancel}
              className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center hover:bg-black/12 transition-colors"
            >
              <X size={16} className="text-foreground" />
            </button>
          </div>

          {!triggered ? (
            <>
              {/* Countdown circle */}
              <div className="flex flex-col items-center py-6">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(244,63,94,0.2)" strokeWidth="8" />
                    <circle
                      cx="72" cy="72" r="60"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - (5 - countdown) / 5)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-accent text-5xl font-bold">{countdown}</span>
                    <span className="text-muted-foreground text-xs mt-1">seconds</span>
                  </div>
                </div>
                <p className="text-foreground/80 text-sm text-center mt-4">
                  Alerting your emergency contacts and sharing your live location
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {CONTACTS.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 bg-black/5 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
                      {c.avatar}
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">{c.name}</p>
                      <p className="text-muted-foreground text-xs">{c.phone}</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-accent animate-pulse" />
                  </div>
                ))}
              </div>

              <button
                onClick={cancel}
                className="w-full py-4 rounded-2xl bg-black/5 hover:bg-black/8 transition-colors text-foreground font-semibold"
              >
                Cancel — I'm Safe
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center py-6">
                <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <Siren size={40} className="text-accent" />
                </div>
                <h2 className="text-foreground text-xl font-bold mb-1">SOS Activated</h2>
                <p className="text-muted-foreground text-sm text-center">Your location is being shared live</p>
              </div>

              <div className="space-y-2 mb-6">
                {alertsSent.map((name) => (
                  <div key={name} className="flex items-center gap-3 bg-accent/10 rounded-xl p-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-foreground text-sm">{name}</span>
                    <span className="ml-auto text-emerald-400 text-xs font-medium">Notified ✓</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-black/5 hover:bg-black/8 transition-colors">
                  <Phone size={18} className="text-emerald-400" />
                  <span className="text-foreground text-sm font-medium">Call 911</span>
                </button>
                <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-black/5 hover:bg-black/8 transition-colors">
                  <MapPin size={18} className="text-primary" />
                  <span className="text-foreground text-sm font-medium">Share Map</span>
                </button>
              </div>

              <button
                onClick={cancel}
                className="w-full py-4 rounded-2xl bg-black/5 hover:bg-black/8 transition-colors text-foreground font-semibold"
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
