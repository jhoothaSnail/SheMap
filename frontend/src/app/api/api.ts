/**
 * SheMaps Frontend API Client
 * Drop this into src/app/api/api.ts in the frontend project.
 * All calls attach the Firebase ID token automatically.
 */
import { getAuth } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

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
export const journeysApi = {
  start: (data: {
    origin_lat: number; origin_lng: number; origin_label?: string;
    dest_lat: number; dest_lng: number; dest_label?: string;
    route_type?: string; eta_minutes?: number;
  }) => request("POST", "/journeys/start", data),

  updateLocation: (journeyId: string, latitude: number, longitude: number) =>
    request("POST", `/journeys/${journeyId}/location`, { latitude, longitude }),

  confirmArrival: (journeyId: string) =>
    request("POST", `/journeys/${journeyId}/arrive`),

  active: () => request("GET", "/journeys/active"),
  history: () => request("GET", "/journeys/history"),
  events: (journeyId: string) => request("GET", `/journeys/${journeyId}/events`),
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
export const safetyApi = {
  areaScore: (lat: number, lng: number, radius_m = 500) =>
    request("GET", "/safety/score", undefined, { lat, lng, radius_m }),

  forecast: (lat: number, lng: number) =>
    request("GET", "/safety/forecast", undefined, { lat, lng }),

  routeScore: (data: {
    origin_lat: number; origin_lng: number;
    dest_lat: number; dest_lng: number; route_type?: string;
  }) => request("POST", "/safety/route-score", data),

  heatmap: (lat: number, lng: number, heatmap_type = "harassment", radius_m = 2000) =>
    request("GET", "/safety/heatmap", undefined, { lat, lng, heatmap_type, radius_m }),
};

// ── SOS ───────────────────────────────────────────────────────────────
export const sosApi = {
  trigger: (data: {
    latitude: number; longitude: number;
    escalation_level?: number; journey_id?: string;
  }) => request("POST", "/sos/trigger", data),

  cancel: (journey_id?: string) =>
    request("POST", "/sos/cancel", undefined, journey_id ? { journey_id } : undefined),

  safeSpots: (lat: number, lng: number, radius_m = 1000) =>
    request("GET", "/sos/safe-spots", undefined, { lat, lng, radius_m }),
};
