import { useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import {
  Map, Navigation, Users, Siren, Shield,
  Bell, Search, Mic, ChevronUp, ChevronDown,
  MapPin, GitCompare, Layers, X, User,
  Settings, AlertTriangle,
} from "lucide-react";
import { MapCanvas } from "./components/MapCanvas";
import { RoutesPanel } from "./components/RoutesPanel";
import { CommunityPanel } from "./components/CommunityPanel";
import { SOSModal } from "./components/SOSModal";
import { SafetyIntelligence } from "./components/SafetyIntelligence";
import { EmergencyHub } from "./components/EmergencyHub";
import { ProfileHub } from "./components/ProfileHub";
import { RouteComparison } from "./components/RouteComparison";
import LoginSignUpPage from "./components/auth/LoginSignUpPage";
import { signOutUser } from "./auth/authService";
import { auth } from "../firebase";

type Tab = "map" | "safety" | "community" | "emergency" | "profile";

const TABS = [
  { id: "map" as Tab, label: "Map", icon: Map },
  { id: "safety" as Tab, label: "Safety", icon: Shield },
  { id: "community" as Tab, label: "Reports", icon: Users },
  { id: "emergency" as Tab, label: "Emergency", icon: Siren },
  { id: "profile" as Tab, label: "Profile", icon: User },
];

const AREA_SCORE = 82;

function SafetyRing({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";
  return (
    <div
      className="relative w-14 h-14 flex items-center justify-center rounded-2xl"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-white">{score}</span>
        <Shield size={9} style={{ color }} />
      </div>
    </div>
  );
}

function AlertBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="mx-4 mt-2 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.06))",
        border: "1.5px solid rgba(244,63,94,0.3)",
        boxShadow: "0 2px 12px rgba(244,63,94,0.12)"
      }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(244,63,94,0.18)" }}>
        <AlertTriangle size={13} style={{ color: "#f43f5e" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-xs font-semibold">Harassment reported nearby</p>
        <p className="text-muted-foreground text-[11px]">Oak St & 5th Ave · 32 min ago</p>
      </div>
      <button onClick={onDismiss} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}>
        <X size={12} className="text-muted-foreground" />
      </button>
    </motion.div>
  );
}

type MapMode = "normal" | "heatmap" | "safespot";

function HeatmapCanvas({ mode }: { mode: MapMode }) {
  const colors = mode === "heatmap"
    ? [
        { cx: "62%", cy: "30%", r: "12%", from: "rgba(244,63,94,0.5)", to: "rgba(244,63,94,0)" },
        { cx: "18%", cy: "70%", r: "9%", from: "rgba(244,63,94,0.4)", to: "rgba(244,63,94,0)" },
        { cx: "50%", cy: "55%", r: "7%", from: "rgba(245,158,11,0.4)", to: "rgba(245,158,11,0)" },
        { cx: "35%", cy: "20%", r: "14%", from: "rgba(16,185,129,0.35)", to: "rgba(16,185,129,0)" },
        { cx: "75%", cy: "65%", r: "10%", from: "rgba(245,158,11,0.35)", to: "rgba(245,158,11,0)" },
      ]
    : [
        { cx: "38%", cy: "55%", r: "8%", from: "rgba(16,185,129,0.5)", to: "rgba(16,185,129,0)" },
        { cx: "52%", cy: "92%", r: "6%", from: "rgba(16,185,129,0.4)", to: "rgba(16,185,129,0)" },
        { cx: "20%", cy: "35%", r: "7%", from: "rgba(201,64,118,0.36)", to: "rgba(201,64,118,0)" },
      ];

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        {colors.map((c, i) => (
          <radialGradient key={i} id={`hg${i}`} cx={c.cx} cy={c.cy} r={c.r} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={c.from} />
            <stop offset="100%" stopColor={c.to} />
          </radialGradient>
        ))}
      </defs>
      {colors.map((_, i) => (
        <ellipse key={i} cx={colors[i].cx} cy={colors[i].cy} rx={colors[i].r} ry={colors[i].r} fill={`url(#hg${i})`} />
      ))}
    </svg>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<Tab>("map");
  const [activeRoute, setActiveRoute] = useState(0);
  const [showSOS, setShowSOS] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alertVisible, setAlertVisible] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [mapMode, setMapMode] = useState<MapMode>("normal");
  const [showComparison, setShowComparison] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  const isMapTab = tab === "map";

  const SAVED_PLACES = [
    { icon: "🏠", label: "Home", addr: "1420 S Hyde Park Blvd" },
    { icon: "🏫", label: "College", addr: "University of Chicago" },
    { icon: "💼", label: "Workplace", addr: "123 N Michigan Ave" },
    { icon: "🏨", label: "Hostel", addr: "Oak Park Residences" },
  ];
  const RECENT = [
    { label: "42 Oak Street", time: "Yesterday" },
    { label: "Lincoln Park", time: "2 days ago" },
    { label: "River North", time: "Last week" },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setTab("map");
    setSheetOpen(false);
    setShowComparison(false);
    setShowSOS(false);
  };

  if (!authReady) {
    return (
      <div className="size-full flex items-center justify-center" style={{ background: "#faf4f7" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #c94076, #a8305a)", boxShadow: "0 8px 24px rgba(201,64,118,0.35)" }}>
            <Shield size={22} className="text-white" />
          </div>
          <p className="text-sm font-semibold" style={{ color: "#1c0f18" }}>Opening SheMaps</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginSignUpPage onLoginSuccess={() => setAuthUser(auth.currentUser)} />;
  }

  return (
    <div className="size-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2a0b1c 0%, #c94076 52%, #f07c4a 100%)" }}>
      {/* Phone shell */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: "min(390px, 100vw)",
          height: "min(844px, 100vh)",
          background: "#faf4f7",
          borderRadius: "min(44px, 4vw)",
          boxShadow: "0 40px 120px rgba(42,11,28,0.40), 0 0 0 1px rgba(201,64,118,0.22)",
        }}
      >
        {/* ═══ HEADER — deep brand surface ═══ */}
        <div
          className="shrink-0 px-4 pt-4 pb-3"
          style={{
            background: "linear-gradient(160deg, #1c0f18 0%, #2e1424 100%)",
            boxShadow: "0 4px 20px rgba(28,15,24,0.3)",
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>9:41</span>
            <div className="w-28 h-5 rounded-full bg-black absolute left-1/2 -translate-x-1/2 top-4" />
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5 items-end">
                {[3, 5, 7, 9].map((h, i) => (
                  <div key={i} className="w-1 rounded-sm" style={{ height: h, background: "rgba(255,255,255,0.45)" }} />
                ))}
              </div>
              <div className="w-6 h-3 rounded-sm flex items-center px-0.5" style={{ border: "1px solid rgba(255,255,255,0.3)" }}>
                <div className="w-4 h-1.5 rounded-sm bg-emerald-400" />
              </div>
            </div>
          </div>

          {/* Brand + location row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #c94076 0%, #f07c4a 100%)", boxShadow: "0 4px 12px rgba(201,64,118,0.4)" }}
              >
                <Shield size={17} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.05rem", fontWeight: 500 }}>SheMaps</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={9} style={{ color: "rgba(240,124,74,0.9)" }} />
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Hyde Park, Chicago</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Bell size={15} style={{ color: "rgba(255,255,255,0.75)" }} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
              </button>
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Settings size={15} style={{ color: "rgba(255,255,255,0.75)" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Alert banner */}
        <AnimatePresence>
          {alertVisible && isMapTab && (
            <AlertBanner onDismiss={() => setAlertVisible(false)} />
          )}
        </AnimatePresence>

        {/* MAP VIEW */}
        {isMapTab && (
          <div className="flex-1 relative overflow-hidden mx-4 mt-3 rounded-3xl" style={{ minHeight: 0 }}>
            <MapCanvas activeRoute={activeRoute} showDangerZones={mapMode !== "safespot"} showIncidents={mapMode === "normal"} />

            {mapMode !== "normal" && <HeatmapCanvas mode={mapMode} />}

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(250,244,247,0.95), transparent)" }} />

            {/* Safety score — top right */}
            <div className="absolute top-3 right-3">
              <SafetyRing score={AREA_SCORE} />
            </div>

            {/* Map mode switcher — top left */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {([
                { mode: "normal" as MapMode, label: "Routes" },
                { mode: "heatmap" as MapMode, label: "Heatmap" },
                { mode: "safespot" as MapMode, label: "Safe Spots" },
              ]).map((m) => (
                <button
                  key={m.mode}
                  onClick={() => setMapMode(m.mode)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-[10px] font-semibold"
                  style={{
                    background: mapMode === m.mode
                      ? "rgba(201,64,118,0.92)"
                      : "rgba(28,15,24,0.72)",
                    backdropFilter: "blur(8px)",
                    border: mapMode === m.mode
                      ? "1px solid rgba(255,255,255,0.25)"
                      : "1px solid rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    boxShadow: mapMode === m.mode ? "0 2px 12px rgba(201,64,118,0.4)" : "none",
                  }}
                >
                  <Layers size={10} />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Heatmap legend */}
            {mapMode === "heatmap" && (
              <div className="absolute bottom-6 left-3 right-3 flex items-center justify-center gap-2">
                {[{ color: "#10b981", label: "Safe" }, { color: "#f59e0b", label: "Moderate" }, { color: "#f43f5e", label: "Risky" }].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{ background: "rgba(28,15,24,0.75)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="text-[10px] font-medium text-white">{l.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Route legend (normal mode) */}
            {mapMode === "normal" && (
              <>
                <div className="absolute top-14 left-3 flex flex-col gap-1.5">
                  {[
                    { color: "#10b981", label: "Safest" },
                    { color: "#f59e0b", label: "Faster" },
                    { color: "#c94076", label: "Busy" },
                  ].map((r, i) => (
                    <button
                      key={r.label}
                      onClick={() => setActiveRoute(i)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-[10px] font-semibold"
                      style={{
                        background: activeRoute === i
                          ? `rgba(28,15,24,0.85)`
                          : "rgba(28,15,24,0.6)",
                        backdropFilter: "blur(8px)",
                        border: activeRoute === i
                          ? `1.5px solid ${r.color}`
                          : "1px solid rgba(255,255,255,0.1)",
                        color: activeRoute === i ? r.color : "rgba(255,255,255,0.65)",
                        boxShadow: activeRoute === i ? `0 2px 10px ${r.color}40` : "none",
                      }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Danger zone label */}
                <div
                  className="absolute text-[9px] px-2 py-1 rounded-lg font-bold"
                  style={{ bottom: "42%", right: "18%", background: "rgba(244,63,94,0.85)", color: "#fff", backdropFilter: "blur(4px)", boxShadow: "0 2px 8px rgba(244,63,94,0.4)" }}
                >
                  ⚠ Avoid
                </div>

                {/* Compare button */}
                <button
                  onClick={() => setShowComparison(true)}
                  className="absolute bottom-6 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold"
                  style={{
                    background: "rgba(201,64,118,0.92)",
                    color: "#fff",
                    backdropFilter: "blur(4px)",
                    boxShadow: "0 4px 16px rgba(201,64,118,0.45)",
                  }}
                >
                  <GitCompare size={11} /> Compare Routes
                </button>
              </>
            )}
          </div>
        )}

        {/* Non-map scrollable content */}
        {!isMapTab && (
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {tab === "safety" && <SafetyIntelligence />}
            {tab === "community" && <CommunityPanel />}
            {tab === "emergency" && <EmergencyHub onSOS={() => setShowSOS(true)} />}
            {tab === "profile" && <ProfileHub user={authUser} onSignOut={handleSignOut} />}
          </div>
        )}

        {/* Search bar (map mode) */}
        {isMapTab && (
          <div className="px-4 py-3 shrink-0">
            {showSearchPanel ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(201,64,118,0.22)",
                  boxShadow: "0 12px 40px rgba(28,15,24,0.15)"
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(28,15,24,0.08)" }}>
                  <Search size={15} className="text-primary shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Where are you going?"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
                  />
                  <button onClick={() => setShowSearchPanel(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(28,15,24,0.07)" }}
                  >
                    <X size={12} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-bold mb-2 px-1" style={{ color: "#1c0f18", letterSpacing: "0.07em" }}>SAVED PLACES</p>
                  {SAVED_PLACES.map((p) => (
                    <button key={p.label} onClick={() => { setSearchText(p.addr); setShowSearchPanel(false); }}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors hover:bg-muted/40"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "rgba(201,64,118,0.08)" }}>
                        {p.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-foreground text-sm font-semibold">{p.label}</p>
                        <p className="text-muted-foreground text-xs">{p.addr}</p>
                      </div>
                    </button>
                  ))}
                  <p className="text-[10px] font-bold mb-2 px-1 mt-3" style={{ color: "#1c0f18", letterSpacing: "0.07em" }}>RECENT</p>
                  {RECENT.map((r) => (
                    <button key={r.label} onClick={() => { setSearchText(r.label); setShowSearchPanel(false); }}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors hover:bg-muted/40"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
                        <Clock size={14} className="text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="text-foreground text-sm font-medium">{r.label}</p>
                        <p className="text-muted-foreground text-xs">{r.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowSearchPanel(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(201,64,118,0.2)",
                  boxShadow: "0 2px 12px rgba(28,15,24,0.08)",
                }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                  <Search size={13} className="text-primary" />
                </div>
                <span className="flex-1 text-left text-sm font-medium" style={{ color: searchText ? "#1c0f18" : "#6e4a60" }}>
                  {searchText || "Where are you going?"}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #c94076, #a8305a)", boxShadow: "0 2px 8px rgba(201,64,118,0.3)" }}
                >
                  <Mic size={13} className="text-white" />
                </div>
              </button>
            )}
          </div>
        )}

        {/* Bottom sheet for routes (map) */}
        {isMapTab && mapMode === "normal" && (
          <div
            className="shrink-0 mx-4 rounded-t-2xl overflow-hidden transition-all"
            style={{
              background: "#ffffff",
              border: "1.5px solid rgba(201,64,118,0.18)",
              borderBottom: "none",
              boxShadow: "0 -4px 20px rgba(28,15,24,0.08)",
            }}
          >
            <button onClick={() => setSheetOpen((p) => !p)} className="w-full flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,64,118,0.1)" }}>
                  <Navigation size={12} className="text-primary" />
                </div>
                <span className="text-foreground text-sm font-semibold">Route Options</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#0f8f63" }}
                >
                  3 safe routes
                </span>
              </div>
              {sheetOpen
                ? <ChevronDown size={14} className="text-muted-foreground" />
                : <ChevronUp size={14} className="text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {sheetOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                  <RoutesPanel activeRoute={activeRoute} onSelectRoute={(i) => { setActiveRoute(i); setSheetOpen(false); }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ═══ BOTTOM NAV — dark surface, strong active states ═══ */}
        <div
          className="shrink-0 px-2 pb-6 pt-2 flex items-center justify-around"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #faf4f7 100%)",
            borderTop: "1px solid rgba(28,15,24,0.09)",
            boxShadow: "0 -2px 16px rgba(28,15,24,0.06)",
          }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const isEmergency = t.id === "emergency";

            if (isEmergency) {
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="relative flex flex-col items-center justify-center -mt-5"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: "linear-gradient(135deg, #f43f5e, #be123c)",
                      boxShadow: active
                        ? "0 6px 24px rgba(244,63,94,0.6), 0 0 0 3px rgba(244,63,94,0.2)"
                        : "0 4px 20px rgba(244,63,94,0.45)",
                      transform: active ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    <Siren size={22} className="text-white" />
                  </div>
                  <span className="text-[10px] font-semibold mt-1" style={{ color: active ? "#f43f5e" : "#6e4a60" }}>
                    Emergency
                  </span>
                </button>
              );
            }

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all"
                style={{
                  background: active ? "rgba(201,64,118,0.1)" : "transparent",
                  color: active ? "#c94076" : "#6e4a60",
                }}
              >
                <div
                  className="flex items-center justify-center w-6 h-6"
                  style={{ color: active ? "#c94076" : "#6e4a60" }}
                >
                  <Icon size={20} fill={active ? "currentColor" : "none"} strokeWidth={active ? 2 : 1.5} />
                </div>
                <span className="text-[10px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Route Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
          <RouteComparison
            onClose={() => setShowComparison(false)}
            onSelect={(i) => { setActiveRoute(i); setShowComparison(false); }}
            activeRoute={activeRoute}
          />
        )}
      </AnimatePresence>

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Clock({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
