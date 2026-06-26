/**
 * SheMaps Frontend API Client
 * Drop this into src/app/api/api.ts in the frontend project.
 * All calls attach the Firebase ID token automatically.
 */
import { getAuth } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

/** Backend origin without the /api/v1 suffix (for building share links). */
export const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");

/**
 * Public URL contacts open to watch a shared journey live.
 *
 * The configured BASE_URL points at 127.0.0.1 for local dev, which is useless
 * to a contact on another device. So we rebuild the link using the host the
 * user is *actually* viewing the app from (e.g. a LAN IP like 192.168.x.x),
 * keeping the backend's port + path. On the same Wi-Fi the link then works for
 * contacts. For remote viewers, run the backend behind a public tunnel and set
 * VITE_API_BASE_URL accordingly.
 */
export const trackingPageUrl = (journeyId: string): string => {
  try {
    const api = new URL(BASE_URL, window.location.origin);
    const host = window.location.hostname || api.hostname;
    const port = api.port ? `:${api.port}` : "";
    const path = api.pathname.replace(/\/$/, "");
    return `${api.protocol}//${host}${port}${path}/t/${journeyId}`;
  } catch {
    return `${BASE_URL}/t/${journeyId}`;
  }
};

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const token = await getToken();
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API error");
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email?: string; display_name?: string; photo_url?: string }) =>
    request("POST", "/auth/register", data),
  me: () => request("GET", "/auth/me"),
  updateProfile: (data: object) => request("PATCH", "/auth/me", data),
};

// ── Reports ───────────────────────────────────────────────────────────
export const reportsApi = {
  list: (params?: {
    lat?: number; lng?: number; radius_m?: number;
    category?: string; lifecycle?: string; page?: number;
  }) => request("GET", "/reports", undefined, params as any),

  trending: (limit = 10) =>
    request("GET", "/reports/trending", undefined, { limit }),

  create: (data: {
    category: string; title: string; description: string;
    latitude: number; longitude: number; location_label?: string;
    severity?: number; media_urls?: string[];
  }) => request("POST", "/reports", data),

  vote: (reportId: string, vote_type: "up" | "down") =>
    request("POST", `/reports/${reportId}/vote`, { vote_type }),

  delete: (reportId: string) =>
    request("DELETE", `/reports/${reportId}`),
};

// ── Journeys ──────────────────────────────────────────────────────────
export interface Journey {
  id: string;
  user_id: string;
  origin_lat: number;
  origin_lng: number;
  origin_label: string | null;
  dest_lat: number;
  dest_lng: number;
  dest_label: string | null;
  route_type: string;
  eta_minutes: number | null;
  status: "active" | "delayed" | "interrupted" | "completed" | "sos_active";
  deviation_detected: boolean;
  sos_triggered: boolean;
  safe_arrival_confirmed: boolean;
  started_at: string;
  expected_arrival: string | null;
  arrived_at: string | null;
}

export const journeysApi = {
  start: (data: {
    origin_lat: number; origin_lng: number; origin_label?: string;
    dest_lat: number; dest_lng: number; dest_label?: string;
    route_type?: string; eta_minutes?: number;
  }) => request<Journey>("POST", "/journeys/start", data),

  updateLocation: (journeyId: string, latitude: number, longitude: number) =>
    request("POST", `/journeys/${journeyId}/location`, { latitude, longitude }),

  confirmArrival: (journeyId: string) =>
    request<Journey>("POST", `/journeys/${journeyId}/arrive`),

  flagDelay: (journeyId: string) =>
    request<Journey>("POST", `/journeys/${journeyId}/flag-delay`),

  active: () => request<Journey>("GET", "/journeys/active"),
  history: () => request<Journey[]>("GET", "/journeys/history"),
  events: (journeyId: string) => request("GET", `/journeys/${journeyId}/events`),
};

// ── Live tracking (public; no auth needed) ────────────────────────────
export interface TrackStatus {
  journey_id: string;
  status: string;
  destination: [number, number];
  dest_label: string | null;
  latest: { lat: number; lng: number; at: string | null };
  eta_minutes: number | null;
  expected_arrival: string | null;
  deviation_detected: boolean;
  safe_arrival_confirmed: boolean;
  watchers: number;
}

export const trackApi = {
  // Public endpoint — call without a viewer id so the owner isn't counted.
  status: async (journeyId: string): Promise<TrackStatus> => {
    const res = await fetch(`${BASE_URL}/track/${journeyId}`);
    if (!res.ok) throw new Error("Tracking unavailable");
    return res.json() as Promise<TrackStatus>;
  },
};

// ── Trusted Contacts ──────────────────────────────────────────────────
export const contactsApi = {
  list: () => request("GET", "/contacts"),
  add: (data: {
    name: string; phone: string; email?: string;
    relationship_type?: string; priority?: number;
  }) => request("POST", "/contacts", data),
  update: (id: string, data: object) => request("PATCH", `/contacts/${id}`, data),
  delete: (id: string) => request("DELETE", `/contacts/${id}`),
};

// ── Safety ────────────────────────────────────────────────────────────
export interface DimensionScores {
  lighting_score: number;
  human_presence: number;
  isolation_score: number;
  crowd_quality: number;
  harassment_risk: number;
  safe_haven_score: number;
  community_trust: number;
  weather_risk: number;
  night_risk: number;
}

export interface SafetyScore {
  latitude: number;
  longitude: number;
  overall_score: number;
  confidence_pct: number;
  data_points_used: number;
  dimensions: DimensionScores;
  ai_summary: string | null;
  computed_at: string;
}

export interface ForecastPoint {
  time_label: string;
  hour: number;
  predicted_score: number;
  level: "safe" | "moderate" | "risky" | "unsafe";
}

export interface RiskFactor {
  icon?: string;
  label: string;
  impact: number;
  time?: string;
}

export interface SafetyForecast {
  latitude: number;
  longitude: number;
  current_score: number;
  forecast: ForecastPoint[];
  risk_factors: RiskFactor[];
  ai_summary: string;
}

export interface HeatmapResult {
  heatmap_type: string;
  points: { latitude: number; longitude: number; weight: number }[];
  generated_at: string;
}

export const safetyApi = {
  // `hour` (0-23) lets the "Safety Time Machine" ask how safe an area is at a
  // chosen time of day; omitted = now. Unknown query params are ignored by the
  // backend until it supports them.
  areaScore: (lat: number, lng: number, radius_m = 500, hour?: number) =>
    request<SafetyScore>("GET", "/safety/score", undefined, {
      lat, lng, radius_m, ...(hour != null ? { hour } : {}),
    }),

  forecast: (lat: number, lng: number, hour?: number) =>
    request<SafetyForecast>("GET", "/safety/forecast", undefined, {
      lat, lng, ...(hour != null ? { hour } : {}),
    }),

  routeScore: (data: {
    origin_lat: number; origin_lng: number;
    dest_lat: number; dest_lng: number; route_type?: string;
  }) => request("POST", "/safety/route-score", data),

  heatmap: (lat: number, lng: number, heatmap_type = "harassment", radius_m = 2000) =>
    request<HeatmapResult>("GET", "/safety/heatmap", undefined, { lat, lng, heatmap_type, radius_m }),
};

// ── Maps (OpenStreetMap proxy) ────────────────────────────────────────
export interface PlaceResult {
  label: string;
  latitude: number;
  longitude: number;
}

export interface ScoredRoute {
  index: number;
  geometry: [number, number][];   // [lat, lng] pairs
  distance_km: number;
  eta_minutes: number;
  safety_score: number;
  level: "safe" | "moderate" | "risky" | "unsafe";
  recommended: boolean;
  ai_explanation: string | null;
}

export interface SafeRoutesResult {
  origin: [number, number];
  destination: [number, number];
  routes: ScoredRoute[];
}

export interface SafeSpot {
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  distance_m: number;
  open_now: boolean;
}

export const mapsApi = {
  search: (q: string, near?: { lat: number; lng: number } | null, limit = 6) =>
    request<PlaceResult[]>("GET", "/maps/search", undefined, {
      q,
      limit,
      ...(near ? { lat: near.lat, lng: near.lng } : {}),
    }),

  safeRoutes: (
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number },
  ) =>
    request<SafeRoutesResult>("GET", "/maps/safe-routes", undefined, {
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      dest_lat: dest.lat,
      dest_lng: dest.lng,
    }),

  safeSpots: (lat: number, lng: number, radius_m = 1000) =>
    request<SafeSpot[]>("GET", "/maps/safe-spots", undefined, { lat, lng, radius_m }),
};

// ── SOS ───────────────────────────────────────────────────────────────
export interface SOSAlertContact {
  name: string;
  phone: string | null;
  email: string | null;
}

export interface SOSResult {
  sos_id: string;
  escalation_level: number;
  contacts_alerted: string[];
  message: string;
  timestamp: string;
  live_location_url: string;
  share_message: string;
  alert_contacts: SOSAlertContact[];
}

export const sosApi = {
  trigger: (data: {
    latitude: number; longitude: number;
    escalation_level?: number; journey_id?: string;
  }) => request<SOSResult>("POST", "/sos/trigger", data),

  cancel: (journey_id?: string) =>
    request("POST", "/sos/cancel", undefined, journey_id ? { journey_id } : undefined),

  safeSpots: (lat: number, lng: number, radius_m = 1000) =>
    request("GET", "/sos/safe-spots", undefined, { lat, lng, radius_m }),
};
