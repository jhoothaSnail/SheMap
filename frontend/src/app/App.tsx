import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import {
  Map, Navigation, Users, Siren, Shield,
  Bell, Search, Mic, ChevronUp, ChevronDown,
  MapPin, GitCompare, Layers, X, User,
  Settings, AlertTriangle, Eye,
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
import {
  authApi, mapsApi, safetyApi, reportsApi, journeysApi, trackApi, trackingPageUrl,
  type PlaceResult, type ScoredRoute, type SafeSpot, type Journey,
} from "./api/api";
import type { ReportPin } from "./components/MapCanvas";
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

/** Great-circle distance in metres between two [lat,lng] points. */
function metersBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

const ARRIVAL_RADIUS_M = 70;        // auto safe-arrival trigger distance
const JOURNEY_TICK_MS = 12_000;     // live-location post + watcher poll interval

const RECENT_KEY = "shemap_recent_searches";

interface RecentSearch {
  label: string;
  lat: number;
  lng: number;
  ts: number;
}

/** Compact relative time, e.g. "just now", "3h ago", "2d ago". */
function relativeTime(ts: number): string {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 604800)}w ago`;
}

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

  // Live map / routing state
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [areaScore, setAreaScore] = useState<number>(AREA_SCORE);
  const [routes, setRoutes] = useState<ScoredRoute[]>([]);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [safeSpots, setSafeSpots] = useState<SafeSpot[]>([]);
  const [reportPins, setReportPins] = useState<ReportPin[]>([]);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const areaLoadedRef = useRef(false);

  // Real recent searches, persisted in localStorage (Google-Maps style).
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? (JSON.parse(raw) as RecentSearch[]) : [];
    } catch {
      return [];
    }
  });

  const saveRecent = useCallback((place: PlaceResult) => {
    setRecentSearches((prev) => {
      const entry: RecentSearch = {
        label: place.label,
        lat: place.latitude,
        lng: place.longitude,
        ts: Date.now(),
      };
      const deduped = prev.filter((r) => r.label !== entry.label);
      const next = [entry, ...deduped].slice(0, 8);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore quota */ }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  }, []);

  // Report location-picking flow (Reports tab <-> Map tab)
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [pickingReport, setPickingReport] = useState(false);
  const [pickedReportLocation, setPickedReportLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handlePickOnMap = useCallback(() => {
    setReportFormOpen(false);
    setPickingReport(true);
    setTab("map");
  }, []);

  const handleMapPick = useCallback((lat: number, lng: number) => {
    setPickedReportLocation({ lat, lng });
    setPickingReport(false);
    setTab("community");
    setReportFormOpen(true);
  }, []);

  // ── Journey monitoring (Phase 3) ──────────────────────────────────────
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [watchers, setWatchers] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [overduePrompt, setOverduePrompt] = useState(false);
  const [arrivePrompt, setArrivePrompt] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const userPosRef = useRef<{ lat: number; lng: number } | null>(null);
  userPosRef.current = userPos;

  // The recommended (or currently active) planned route, used to start a journey.
  const plannedRoute = routes.length ? (routes.find((r) => r.recommended) ?? routes[activeRoute] ?? routes[0]) : null;
  const canStartJourney = !!(userPos && destination && plannedRoute && !activeJourney);

  // Restore an in-progress journey after login / refresh.
  useEffect(() => {
    if (!authUser) return;
    journeysApi.active().then((j) => setActiveJourney(j)).catch(() => setActiveJourney(null));
  }, [authUser]);

  const handleStartJourney = useCallback(async () => {
    setStartError(null);
    if (!userPos || !destination || !plannedRoute) {
      setStartError("Plan a route on the Map tab first (search a destination).");
      return;
    }
    try {
      const j = await journeysApi.start({
        origin_lat: userPos.lat,
        origin_lng: userPos.lng,
        origin_label: "Current location",
        dest_lat: destination[0],
        dest_lng: destination[1],
        dest_label: searchText || "Destination",
        route_type: "safest",
        eta_minutes: plannedRoute.eta_minutes,
      });
      setActiveJourney(j);
      setOverduePrompt(false);
      setArrivePrompt(false);
    } catch (e: any) {
      setStartError(e?.message ?? "Couldn't start the journey.");
    }
  }, [userPos, destination, plannedRoute, searchText]);

  const handleConfirmArrival = useCallback(async () => {
    if (!activeJourney) return;
    try {
      await journeysApi.confirmArrival(activeJourney.id);
    } catch { /* best effort */ }
    setActiveJourney(null);
    setArrivePrompt(false);
    setOverduePrompt(false);
    setWatchers(0);
  }, [activeJourney]);

  const handleShareJourney = useCallback(async () => {
    if (!activeJourney) return;
    const url = trackingPageUrl(activeJourney.id);
    const text = `I'm sharing my live location with you on SheMap. Follow my journey: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "SheMap live location", text, url }); return; } catch { /* fall through */ }
    }
    setShareOpen(true);
  }, [activeJourney]);

  // Live loop: post location, poll watchers, detect arrival/overdue.
  useEffect(() => {
    if (!activeJourney) return;
    let cancelled = false;

    const tick = async () => {
      const pos = userPosRef.current;
      if (pos) {
        journeysApi.updateLocation(activeJourney.id, pos.lat, pos.lng).catch(() => undefined);
        if (metersBetween(pos.lat, pos.lng, activeJourney.dest_lat, activeJourney.dest_lng) < ARRIVAL_RADIUS_M) {
          if (!cancelled) setArrivePrompt(true);
        }
      }
      try {
        const s = await trackApi.status(activeJourney.id);
        if (!cancelled) setWatchers(s.watchers);
      } catch { /* ignore */ }

      if (activeJourney.expected_arrival) {
        const overdue = Date.now() > new Date(activeJourney.expected_arrival).getTime();
        if (overdue && !cancelled) {
          setOverduePrompt(true);
          if (activeJourney.status === "active") {
            journeysApi.flagDelay(activeJourney.id)
              .then((j) => { if (!cancelled) setActiveJourney(j); })
              .catch(() => undefined);
          }
        }
      }
    };

    tick();
    const id = setInterval(tick, JOURNEY_TICK_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [activeJourney]);

  const isMapTab = tab === "map";

  const handleUserLocation = useCallback((lat: number, lng: number) => {
    setUserPos((prev) => (prev ? prev : { lat, lng }));
  }, []);

  // Load area safety score + nearby report pins once we have a location.
  useEffect(() => {
    if (!userPos || areaLoadedRef.current) return;
    areaLoadedRef.current = true;
    safetyApi
      .areaScore(userPos.lat, userPos.lng)
      .then((res: any) => {
        if (typeof res?.overall_score === "number") setAreaScore(Math.round(res.overall_score));
      })
      .catch(() => undefined);
    reportsApi
      .list({ lat: userPos.lat, lng: userPos.lng, radius_m: 3000 })
      .then((res: any) => {
        const items = res?.reports ?? [];
        setReportPins(
          items.map((r: any) => ({
            latitude: r.latitude,
            longitude: r.longitude,
            category: r.category,
            severity: r.severity,
          })),
        );
      })
      .catch(() => undefined);
  }, [userPos]);

  // Debounced destination search via Nominatim (backend proxy).
  useEffect(() => {
    if (!showSearchPanel || searchText.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      mapsApi
        .search(searchText.trim(), userPos)
        .then((res) => setSearchResults(res))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [searchText, showSearchPanel, userPos]);

  // Fetch nearby safe spots when the Safe Spots map mode is active.
  useEffect(() => {
    if (mapMode !== "safespot" || !userPos) return;
    mapsApi
      .safeSpots(userPos.lat, userPos.lng, 1500)
      .then((res) => setSafeSpots(res))
      .catch(() => setSafeSpots([]));
  }, [mapMode, userPos]);

  const handleSelectDestination = async (place: PlaceResult) => {
    setSearchText(place.label.split(",")[0]);
    setShowSearchPanel(false);
    setSearchResults([]);
    saveRecent(place);
    const dest: [number, number] = [place.latitude, place.longitude];
    setDestination(dest);
    if (!userPos) return;
    setRoutesLoading(true);
    setMapMode("normal");
    try {
      const res = await mapsApi.safeRoutes(userPos, { lat: dest[0], lng: dest[1] });
      setRoutes(res.routes);
      const rec = res.routes.findIndex((r) => r.recommended);
      setActiveRoute(rec >= 0 ? rec : 0);
      setSheetOpen(true);
    } catch {
      setRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Geocode a saved/recent label, then route to the best match.
  const handleQuickDestination = async (label: string) => {
    setSearchText(label);
    try {
      const res = await mapsApi.search(label, userPos);
      if (res[0]) {
        await handleSelectDestination(res[0]);
      } else {
        setShowSearchPanel(false);
      }
    } catch {
      setShowSearchPanel(false);
    }
  };

  const SAVED_PLACES = [
    { icon: "🏠", label: "Home", addr: "1420 S Hyde Park Blvd" },
    { icon: "🏫", label: "College", addr: "University of Chicago" },
    { icon: "💼", label: "Workplace", addr: "123 N Michigan Ave" },
    { icon: "🏨", label: "Hostel", addr: "Oak Park Residences" },
  ];
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);

      // Sync the Firebase user into our PostgreSQL backend. This is idempotent
      // server-side, so it's safe to call on every auth state change. Failures
      // (e.g. backend offline) are non-blocking so the frontend still works.
      if (user) {
        authApi
          .register({
            email: user.email ?? undefined,
            display_name: user.displayName ?? undefined,
            photo_url: user.photoURL ?? undefined,
          })
          .catch((err) => {
            console.warn("Backend user sync failed:", err);
          });
      }
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

        {/* Persistent active-journey banner (visible on every tab) */}
        <AnimatePresence>
          {activeJourney && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="shrink-0 overflow-hidden"
            >
              <div
                className="mx-3 mt-2 mb-1 rounded-2xl px-3.5 py-2.5"
                style={{
                  background: overduePrompt
                    ? "linear-gradient(135deg, #b45309, #92400e)"
                    : "linear-gradient(135deg, #0f766e, #047857)",
                  boxShadow: "0 4px 16px rgba(4,120,87,0.3)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <Navigation size={16} className="text-white" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">
                      {overduePrompt ? "Running late · check in" : "Journey active · contacts can see you"}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {activeJourney.dest_label ? `To ${activeJourney.dest_label}` : "On the way"}
                      {" · "}
                      <Eye size={9} className="inline -mt-0.5" /> {watchers} watching
                    </p>
                  </div>
                  <button
                    onClick={handleShareJourney}
                    className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
                  >
                    Share
                  </button>
                  <button
                    onClick={() => setArrivePrompt(true)}
                    className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background: "#ffffff", color: "#047857" }}
                  >
                    Arrived
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAP VIEW */}
        {isMapTab && (
          <div className="flex-1 relative overflow-hidden mx-4 mt-3 rounded-3xl" style={{ minHeight: 0 }}>
            <MapCanvas
              activeRoute={activeRoute}
              routes={routes}
              destination={destination}
              safeSpots={mapMode === "safespot" ? safeSpots : []}
              reportPins={mapMode === "normal" ? reportPins : []}
              onUserLocation={handleUserLocation}
              pickMode={pickingReport}
              onPick={handleMapPick}
              showDangerZones={mapMode !== "safespot"}
              showIncidents={mapMode === "normal"}
            />

            {mapMode === "heatmap" && <HeatmapCanvas mode={mapMode} />}

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(250,244,247,0.95), transparent)" }} />

            {/* Safety score — top right */}
            <div className="absolute top-3 right-3">
              <SafetyRing score={areaScore} />
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

            {/* Route legend (normal mode) — driven by real scored routes */}
            {mapMode === "normal" && routes.length > 0 && (
              <>
                <div className="absolute top-14 left-3 flex flex-col gap-1.5">
                  {routes.map((r, i) => {
                    const color = r.level === "safe" ? "#10b981" : r.level === "moderate" ? "#f59e0b" : "#f43f5e";
                    return (
                      <button
                        key={r.index}
                        onClick={() => setActiveRoute(i)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-[10px] font-semibold"
                        style={{
                          background: activeRoute === i ? `rgba(28,15,24,0.85)` : "rgba(28,15,24,0.6)",
                          backdropFilter: "blur(8px)",
                          border: activeRoute === i ? `1.5px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                          color: activeRoute === i ? color : "rgba(255,255,255,0.65)",
                          boxShadow: activeRoute === i ? `0 2px 10px ${color}40` : "none",
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        {r.recommended ? "Safest" : `Route ${i + 1}`} · {Math.round(r.safety_score)}
                      </button>
                    );
                  })}
                </div>

                {/* Compare button */}
                {routes.length > 1 && (
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
                )}
              </>
            )}

            {/* Routing in progress */}
            {routesLoading && (
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl text-[11px] font-semibold"
                style={{ background: "rgba(28,15,24,0.8)", color: "#fff", backdropFilter: "blur(4px)" }}
              >
                Finding safest routes…
              </div>
            )}
          </div>
        )}

        {/* Non-map scrollable content */}
        {!isMapTab && (
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {tab === "safety" && <SafetyIntelligence userPos={userPos} />}
            {tab === "community" && (
              <CommunityPanel
                userPos={userPos}
                pickedLocation={pickedReportLocation}
                onPickOnMap={handlePickOnMap}
                reportFormOpen={reportFormOpen}
                onReportFormOpenChange={setReportFormOpen}
              />
            )}
            {tab === "emergency" && (
              <EmergencyHub
                onSOS={() => setShowSOS(true)}
                activeJourney={activeJourney}
                watchers={watchers}
                canStartJourney={canStartJourney}
                destinationLabel={searchText}
                startError={startError}
                onStartJourney={handleStartJourney}
                onConfirmArrival={handleConfirmArrival}
                onShareJourney={handleShareJourney}
                onPlanRoute={() => setTab("map")}
              />
            )}
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
                  {searchText.trim().length >= 2 ? (
                    <>
                      <p className="text-[10px] font-bold mb-2 px-1" style={{ color: "#1c0f18", letterSpacing: "0.07em" }}>
                        {searching ? "SEARCHING…" : "RESULTS"}
                      </p>
                      {!searching && searchResults.length === 0 && (
                        <p className="text-muted-foreground text-xs px-2 py-3">No places found. Try a different search.</p>
                      )}
                      {searchResults.map((p, i) => (
                        <button key={`${p.label}-${i}`} onClick={() => handleSelectDestination(p)}
                          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors hover:bg-muted/40"
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,64,118,0.08)" }}>
                            <MapPin size={14} className="text-primary" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-foreground text-sm font-semibold truncate">{p.label.split(",")[0]}</p>
                            <p className="text-muted-foreground text-xs truncate">{p.label}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold mb-2 px-1" style={{ color: "#1c0f18", letterSpacing: "0.07em" }}>SAVED PLACES</p>
                      {SAVED_PLACES.map((p) => (
                        <button key={p.label} onClick={() => handleQuickDestination(p.addr)}
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
                      {recentSearches.length > 0 && (
                        <div className="flex items-center justify-between mt-3 mb-2 px-1">
                          <p className="text-[10px] font-bold" style={{ color: "#1c0f18", letterSpacing: "0.07em" }}>RECENT</p>
                          <button onClick={clearRecent} className="text-[10px] font-semibold" style={{ color: "#c94076" }}>
                            Clear
                          </button>
                        </div>
                      )}
                      {recentSearches.map((r) => (
                        <button
                          key={`${r.label}-${r.ts}`}
                          onClick={() => handleSelectDestination({ label: r.label, latitude: r.lat, longitude: r.lng })}
                          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors hover:bg-muted/40"
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
                            <Clock size={14} className="text-muted-foreground" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-foreground text-sm font-medium truncate">{r.label.split(",")[0]}</p>
                            <p className="text-muted-foreground text-xs truncate">{relativeTime(r.ts)} · {r.label}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
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
                  {routes.length > 0 ? `${routes.length} safe route${routes.length > 1 ? "s" : ""}` : "Search a destination"}
                </span>
              </div>
              {sheetOpen
                ? <ChevronDown size={14} className="text-muted-foreground" />
                : <ChevronUp size={14} className="text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {sheetOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                  <RoutesPanel routes={routes} destinationLabel={searchText} activeRoute={activeRoute} onSelectRoute={(i) => { setActiveRoute(i); setSheetOpen(false); }} />
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
            routes={routes}
            onClose={() => setShowComparison(false)}
            onSelect={(i) => { setActiveRoute(i); setShowComparison(false); }}
            activeRoute={activeRoute}
          />
        )}
      </AnimatePresence>

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOS && (
          <SOSModal
            onClose={() => setShowSOS(false)}
            userPos={userPos}
            journeyId={activeJourney?.id ?? null}
          />
        )}

        {/* Share live-location sheet */}
        {shareOpen && activeJourney && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShareOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="relative w-full max-w-sm rounded-t-3xl p-5"
              style={{ background: "#faf4f7" }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-foreground font-bold">Share live location</p>
                <button onClick={() => setShareOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(28,15,24,0.07)" }}>
                  <X size={15} className="text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs mb-3" style={{ color: "#6e4a60" }}>
                Anyone with this link can watch your journey live until you arrive.
              </p>
              <div className="rounded-xl px-3 py-2.5 mb-3 text-xs break-all" style={{ background: "#fff", border: "1.5px solid rgba(28,15,24,0.09)", color: "#1c0f18" }}>
                {trackingPageUrl(activeJourney.id)}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Follow my live location on SheMap: ${trackingPageUrl(activeJourney.id)}`)}`}
                  target="_blank" rel="noreferrer"
                  className="py-3 rounded-xl text-xs font-bold text-center text-white"
                  style={{ background: "#1faa55" }}
                >
                  WhatsApp
                </a>
                <a
                  href={`sms:?&body=${encodeURIComponent(`Follow my live location on SheMap: ${trackingPageUrl(activeJourney.id)}`)}`}
                  className="py-3 rounded-xl text-xs font-bold text-center"
                  style={{ background: "rgba(28,15,24,0.06)", color: "#1c0f18" }}
                >
                  SMS
                </a>
                <button
                  onClick={() => { navigator.clipboard?.writeText(trackingPageUrl(activeJourney.id)); setShareOpen(false); }}
                  className="py-3 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(201,64,118,0.1)", color: "#c94076" }}
                >
                  Copy link
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Auto safe-arrival prompt */}
        {arrivePrompt && activeJourney && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setArrivePrompt(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-xs rounded-3xl p-6 text-center"
              style={{ background: "#faf4f7" }}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(16,185,129,0.12)" }}>
                <Navigation size={26} className="text-emerald-600" />
              </div>
              <p className="text-foreground font-bold mb-1">Have you arrived?</p>
              <p className="text-xs mb-4" style={{ color: "#6e4a60" }}>You're near your destination. Confirm safe arrival to notify your contacts.</p>
              <div className="flex gap-2">
                <button onClick={() => setArrivePrompt(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(28,15,24,0.06)", color: "#6e4a60" }}>
                  Not yet
                </button>
                <button onClick={handleConfirmArrival} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                  Yes, I'm safe
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Overdue check-in prompt */}
        {overduePrompt && activeJourney && !arrivePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-xs rounded-3xl p-6 text-center"
              style={{ background: "#faf4f7", border: "1.5px solid rgba(180,83,9,0.35)" }}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(245,158,11,0.14)" }}>
                <AlertTriangle size={26} style={{ color: "#b45309" }} />
              </div>
              <p className="text-foreground font-bold mb-1">Are you safe?</p>
              <p className="text-xs mb-4" style={{ color: "#6e4a60" }}>You're past your expected arrival time. Let us know you're okay, or alert your contacts.</p>
              <div className="flex flex-col gap-2">
                <button onClick={handleConfirmArrival} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                  I'm safe — end journey
                </button>
                <button onClick={() => { setOverduePrompt(false); setShowSOS(true); }} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)" }}>
                  Alert contacts (SOS)
                </button>
                <button onClick={() => setOverduePrompt(false)} className="w-full py-2 text-xs font-semibold" style={{ color: "#6e4a60" }}>
                  Dismiss for now
                </button>
              </div>
            </motion.div>
          </div>
        )}
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
