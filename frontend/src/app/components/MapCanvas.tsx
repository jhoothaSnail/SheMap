import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { ScoredRoute, SafeSpot } from "../api/api";

// Fix the well-known react-leaflet issue where bundlers drop the default
// marker images, leaving markers invisible. Point Leaflet at the bundled assets.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Used until the device reports a real position (or if permission is denied).
const FALLBACK_CENTER: [number, number] = [13.0827, 80.2707]; // Chennai
const LIVE_ZOOM = 16;

export interface ReportPin {
  latitude: number;
  longitude: number;
  category: string;
  severity?: number;
}

interface MapCanvasProps {
  activeRoute?: number;
  showDangerZones?: boolean;
  showIncidents?: boolean;
  routes?: ScoredRoute[];
  destination?: [number, number] | null;
  safeSpots?: SafeSpot[];
  reportPins?: ReportPin[];
  pickMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
  onUserLocation?: (lat: number, lng: number) => void;
}

type GeoStatus = "locating" | "tracking" | "denied" | "unsupported" | "error";

const STATUS_MESSAGE: Record<GeoStatus, string | null> = {
  locating: "Finding your location…",
  tracking: null,
  denied: "Location access denied — showing default area",
  unsupported: "Location not supported — showing default area",
  error: "Couldn't get location — showing default area",
};

function routeColor(level: ScoredRoute["level"]): string {
  if (level === "safe") return "#10b981";
  if (level === "moderate") return "#f59e0b";
  return "#f43f5e";
}

const SAFE_SPOT_EMOJI: Record<string, string> = {
  police: "🚓",
  hospital: "🏥",
  pharmacy: "💊",
  petrol: "⛽",
  store: "🏪",
  safe_spot: "🛡️",
};

const REPORT_EMOJI: Record<string, string> = {
  harassment: "⚠️",
  catcalling: "📢",
  following: "👤",
  stalking: "🚨",
  unsafe_crowd: "👥",
  dark_area: "🌑",
  broken_streetlight: "🔦",
  suspicious_person: "👁️",
  unsafe_shortcut: "⛔",
  drunk_individuals: "🍺",
};

function emojiIcon(emoji: string, ring: string): L.DivIcon {
  return L.divIcon({
    className: "shemap-emoji-marker",
    html: `<div style="font-size:16px;line-height:28px;width:28px;height:28px;text-align:center;background:#fff;border:2px solid ${ring};border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.3)">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Custom pin/dot icons drawn as HTML so they never depend on bundled image
// assets (the usual cause of "missing markers" in webviews/production builds).
function pinIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: "shemap-pin-marker",
    html: `<div style="position:relative;width:30px;height:42px">
      <div style="position:absolute;left:3px;top:0;width:24px;height:24px;background:${color};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>
      <div style="position:absolute;left:0;top:4px;width:30px;text-align:center;color:#fff;font-size:11px;font-weight:700">${label}</div>
    </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40],
  });
}

function userDotIcon(): L.DivIcon {
  return L.divIcon({
    className: "shemap-user-marker",
    html: `<div style="position:relative;width:22px;height:22px">
      <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(37,99,235,0.25);animation:shemapPulse 1.8s ease-out infinite"></div>
      <div style="position:absolute;left:5px;top:5px;width:12px;height:12px;border-radius:9999px;background:#2563eb;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>
    </div>
    <style>@keyframes shemapPulse{0%{transform:scale(0.6);opacity:0.9}100%{transform:scale(1.8);opacity:0}}</style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

const START_ICON = pinIcon("#10b981", "A");
const DEST_ICON = pinIcon("#c94076", "B");

/**
 * Forces Leaflet to recompute its size. In flex/webview containers the map is
 * frequently initialised before its container has a measured height, which
 * leaves grey tiles; invalidating on mount, after a tick, and on resize fixes it.
 */
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    fix();
    const t1 = setTimeout(fix, 150);
    const t2 = setTimeout(fix, 600);
    window.addEventListener("resize", fix);
    const container = map.getContainer();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fix) : null;
    ro?.observe(container);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", fix);
      ro?.disconnect();
    };
  }, [map]);
  return null;
}

/** Keeps the Leaflet view centred on the user as their position updates. */
function RecenterOnPosition({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, LIVE_ZOOM, { animate: true });
    }
  }, [position, map]);
  return null;
}

/** Fits the map to the active route (or destination) whenever it changes. */
function FitToRoute({
  routes,
  activeRoute,
  destination,
  userPos,
}: {
  routes?: ScoredRoute[];
  activeRoute?: number;
  destination?: [number, number] | null;
  userPos: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    const active = routes && routes.length ? routes[activeRoute ?? 0] : undefined;
    if (active && active.geometry.length) {
      map.fitBounds(active.geometry as L.LatLngBoundsExpression, { padding: [40, 40] });
    } else if (destination && userPos) {
      map.fitBounds([userPos, destination], { padding: [50, 50] });
    }
  }, [routes, activeRoute, destination, userPos, map]);
  return null;
}

/** Reports map clicks while pick mode is active (for choosing a report location). */
function ClickToPick({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapCanvas({
  activeRoute = 0,
  routes,
  destination,
  safeSpots,
  reportPins,
  pickMode,
  onPick,
  onUserLocation,
}: MapCanvasProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<GeoStatus>("locating");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(next);
        setStatus("tracking");
        onUserLocation?.(next[0], next[1]);
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onUserLocation]);

  const center = position ?? FALLBACK_CENTER;
  const message = STATUS_MESSAGE[status];
  const hasRoutes = !!routes && routes.length > 0;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%", cursor: pickMode ? "crosshair" : "" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <InvalidateSize />
        {!hasRoutes && <RecenterOnPosition position={position} />}
        <FitToRoute routes={routes} activeRoute={activeRoute} destination={destination} userPos={position} />
        {pickMode && <ClickToPick onPick={onPick} />}

        {/* Route start point (origin "A") — shown when a route is drawn */}
        {hasRoutes && routes![activeRoute]?.geometry?.length > 0 && (
          <Marker position={routes![activeRoute].geometry[0] as L.LatLngExpression} icon={START_ICON}>
            <Popup>Start</Popup>
          </Marker>
        )}

        {/* User location (live GPS) */}
        {position && (
          <Marker position={position} icon={userDotIcon()}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Destination "B" */}
        {destination && (
          <Marker position={destination} icon={DEST_ICON}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {/* Route alternatives — colored by safety, active one emphasized */}
        {routes?.map((r) => {
          const isActive = r.index === activeRoute;
          return (
            <Polyline
              key={r.index}
              positions={r.geometry as L.LatLngExpression[]}
              pathOptions={{
                color: routeColor(r.level),
                weight: isActive ? 6 : 4,
                opacity: isActive ? 0.95 : 0.45,
                dashArray: r.recommended ? undefined : isActive ? undefined : "6 8",
              }}
            />
          );
        })}

        {/* Safe spots */}
        {safeSpots?.map((s, i) => (
          <Marker
            key={`spot-${i}`}
            position={[s.latitude, s.longitude]}
            icon={emojiIcon(SAFE_SPOT_EMOJI[s.type] ?? "🛡️", "#059669")}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {s.type} · {Math.round(s.distance_m)}m
            </Popup>
          </Marker>
        ))}

        {/* Recent community reports */}
        {reportPins?.map((p, i) => (
          <Marker
            key={`report-${i}`}
            position={[p.latitude, p.longitude]}
            icon={emojiIcon(REPORT_EMOJI[p.category] ?? "⚠️", "#f43f5e")}
          >
            <Popup>{p.category.replace(/_/g, " ")}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {(message || pickMode) && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "6px 12px",
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 600,
            color: "#fff",
            background: pickMode ? "rgba(201,64,118,0.92)" : "rgba(28,15,24,0.78)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.12)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {pickMode ? "Tap the map to set the report location" : message}
        </div>
      )}
    </div>
  );
}
