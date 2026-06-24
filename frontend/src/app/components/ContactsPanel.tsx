import { useState } from "react";
import { Phone, MapPin, MessageCircle, Plus, Clock, Shield, UserCheck, Bell } from "lucide-react";
import { motion } from "motion/react";

const CONTACTS = [
  {
    id: 1,
    name: "Mom",
    phone: "+1 (555) 234-5678",
    avatar: "M",
    color: "#f43f5e",
    status: "active",
    lastCheck: "2 min ago",
    shareLocation: true,
  },
  {
    id: 2,
    name: "Sarah K.",
    phone: "+1 (555) 876-5432",
    avatar: "S",
    color: "#a855f7",
    status: "active",
    lastCheck: "15 min ago",
    shareLocation: true,
  },
  {
    id: 3,
    name: "Jamie L.",
    phone: "+1 (555) 345-6789",
    avatar: "J",
    color: "#6366f1",
    status: "offline",
    lastCheck: "3 hrs ago",
    shareLocation: false,
  },
  {
    id: 4,
    name: "Dr. Patel",
    phone: "+1 (555) 901-2345",
    avatar: "P",
    color: "#10b981",
    status: "active",
    lastCheck: "Just now",
    shareLocation: false,
  },
];

const ACTIVITY = [
  { icon: "🔔", text: "Mom received your check-in", time: "2 min ago" },
  { icon: "📍", text: "Sarah K. viewed your location", time: "18 min ago" },
  { icon: "✅", text: "Automatic check-in sent", time: "1 hr ago" },
  { icon: "⚠️", text: "SOS drill completed", time: "Yesterday" },
];

export function ContactsPanel() {
  const [checkInTimer, setCheckInTimer] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  const startCheckIn = (mins: number) => {
    setCheckInTimer(mins);
    setTimerActive(true);
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-col gap-4 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-semibold">Trusted Circle</h2>
          <p className="text-muted-foreground text-xs mt-0.5">People who watch over you</p>
        </div>
        <button className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs px-3 py-2 rounded-full transition-colors">
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Check-in timer */}
      <div
        className="rounded-2xl p-4"
        style={{ background: timerActive ? "rgba(16,185,129,0.08)" : "rgba(124,58,237,0.06)", border: `1px solid ${timerActive ? "rgba(16,185,129,0.25)" : "rgba(124,58,237,0.18)"}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className={timerActive ? "text-emerald-400" : "text-primary"} />
          <span className="text-sm font-medium" style={{ color: timerActive ? "#10b981" : "#d8b4fe" }}>
            {timerActive ? `Check-in in ${checkInTimer} min — contacts notified` : "Set a Check-in Timer"}
          </span>
          {timerActive && (
            <button
              onClick={() => setTimerActive(false)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        {!timerActive && (
          <div className="flex gap-2">
            {[15, 30, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => startCheckIn(mins)}
                className="flex-1 py-2 rounded-xl bg-black/4 hover:bg-primary/15 hover:text-primary text-muted-foreground text-xs transition-all"
              >
                {mins}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contacts list */}
      <div className="space-y-2">
        {CONTACTS.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl p-3.5"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${c.color}88, ${c.color}44)`, border: `2px solid ${c.color}55` }}
                >
                  {c.avatar}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                  style={{ background: c.status === "active" ? "#10b981" : "#6b7280" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm font-medium">{c.name}</span>
                  {c.shareLocation && (
                    <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      <MapPin size={9} />
                      Live
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">{c.phone}</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  {c.status === "active" ? `Active · ${c.lastCheck}` : `Offline · ${c.lastCheck}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="w-8 h-8 rounded-full bg-black/4 hover:bg-emerald-500/15 flex items-center justify-center transition-colors group">
                  <Phone size={14} className="text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                </button>
                <button className="w-8 h-8 rounded-full bg-black/4 hover:bg-primary/15 flex items-center justify-center transition-colors group">
                  <MessageCircle size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div>
        <p className="text-muted-foreground text-xs font-medium mb-2 px-0.5">Recent Activity</p>
        <div className="space-y-2">
          {ACTIVITY.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <span className="text-base shrink-0">{item.icon}</span>
              <div className="flex-1">
                <p className="text-foreground/80 text-xs">{item.text}</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
