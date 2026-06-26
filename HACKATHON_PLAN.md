# SheMap — Hackathon Plan of Action

A plan designed so **two people can work at the same time without ever touching the
same files** (no merge conflicts), plus an expanded menu of USP / improvement ideas.

> Status note: the **Safety tab is already wired to real data** (`SafetyIntelligence.tsx`
> consumes `safetyApi.areaScore` + `safetyApi.forecast`, and `App.tsx` passes `userPos`).
> Treat that first task as a completed head start.

---

## 1. The core idea: split by language, not by feature

The cleanest seam in this project is **Backend (Python) vs Frontend (TypeScript)**.
Those two sets of files never overlap, so two people can work in parallel with zero
conflicts. The only thing they share is the **API contract** (URLs + JSON field names),
which you agree on once, up front.

```
Person 1 (Backend only)            Person 2 (Frontend only)
Shemap v1/backend/**     <--API-->  Shemap v1/frontend/**
```

**Hard rule that prevents collisions:**
- Person 1 edits **only** files under `Shemap v1/backend/`.
- Person 2 edits **only** files under `Shemap v1/frontend/`.
- The shared "contract" lives in `frontend/src/app/api/api.ts` (Person 2's file). When
  Person 1 changes an endpoint, they tell Person 2 the new field names; Person 2 updates
  `api.ts`.

---

## 2. File ownership (no overlap)

| Person 1 — Backend (Python)                         | Person 2 — Frontend (TypeScript)                       |
|-----------------------------------------------------|--------------------------------------------------------|
| `backend/app/routes/safety.py`                      | `frontend/src/app/App.tsx`                             |
| `backend/app/routes/maps.py`                        | `frontend/src/app/components/MapCanvas.tsx`            |
| `backend/app/routes/reports.py`                     | `frontend/src/app/components/RoutesPanel.tsx`          |
| `backend/app/services/safety_engine.py`             | `frontend/src/app/components/SafetyIntelligence.tsx`   |
| `backend/app/services/report_scorer.py`             | `frontend/src/app/components/ProfileHub.tsx`           |
| `backend/app/services/gemini_service.py`            | `frontend/src/app/components/EmergencyHub.tsx`         |
| `backend/seed_demo_reports.py` (or seeding script)  | `frontend/src/app/api/api.ts` (the contract file)      |

---

## 3. How they avoid blocking each other

1. **Agree the contract first (10 min).** Write the endpoint shapes into `api.ts`, e.g.
   `GET /safety/score?lat&lng&hour` returns `overall_score`, `dimensions`, `recommendations`.
2. **Frontend never waits for backend.** Person 2 can add `?hour=` to API calls
   immediately. FastAPI ignores unknown query params, so it won't error before Person 1
   implements it — the slider just won't change results yet. When Person 1 ships the
   param, it "comes alive" with no frontend change needed.
3. **Test in isolation.**
   - Person 1 tests via Swagger UI at `http://127.0.0.1:8000/docs` — no frontend needed.
   - Person 2 tests in the running app against whatever the backend returns today.

---

## 4. Track B — Person 1 (Backend) checklist

- [ ] **Hour-aware safety.** Add optional `hour` param to `/safety/score`,
      `/safety/forecast`, and `/safety/route-score`; thread it into `safety_engine`.
- [ ] **Hour-aware routes.** Add `hour` param to `/maps/safe-routes` for time-aware
      route scoring.
- [ ] **Real community trust.** Update `User.trust_score` when reports get votes, so the
      community-credibility weighting becomes real (not static).
- [ ] **(Stretch) AI endpoint.** `POST /safety/ask` — Gemini answers using the real
      computed scores as grounding.
- [ ] **Re-seed demo data.** 10–15 believable reports near the demo location so routes
      actually differ in safety.

Acceptance: each endpoint returns sensible JSON in `/docs`. No frontend edits.

---

## 5. Track A — Person 2 (Frontend) checklist

- [ ] **Safety Time Machine (USP).** A time-of-day slider on the map that re-queries
      routes / score / heatmap with `?hour=` and recolors live.
- [ ] **Real heatmap layer.** Replace the fake `HeatmapCanvas` SVG with real
      `safetyApi.heatmap` circles in `MapCanvas`.
- [ ] **Kill the fakes.** Remove the fake clock / location / alert banner; reverse-geocode
      the real area name.
- [ ] **Dead buttons.** Hide or wire non-functional buttons (Bell, Settings, Comment,
      Forgot password, Mic, safe-spot navigate).
- [ ] **Route "why".** Show highlights / warnings on each route card for explainability.
- [ ] **(Stretch) AI ask box.** A question box in the Safety tab that calls `/safety/ask`.

Acceptance: no hardcoded/mock data visible; UI reacts to the slider once backend lands.

---

## 6. Expanded USP & improvement scope

Differentiation is strongest in **routing + time + proactivity** — the combination
competitors (Safecity, Safetipin, Life360) don't offer.

### Tier 1 — high impact, demoable this week
- **Safety Time Machine** — slider showing how a route/area's safety changes by hour.
- **Safe-haven-aware routing** — bias/annotate routes that pass police stations,
  hospitals, 24/7 shops (Overpass `find_safe_spots` already fetches these).
  Tagline: *"routes that keep you near help."*
- **Proactive route watch** — save a commute; if a new incident lowers its safety, alert:
  *"Your 8 PM route just got riskier."* Reactive → predictive.
- **AI Safety Companion** — Gemini grounded in real scores answers
  *"Is it safe to go to X now?"* Makes the "AI" claim real.

### Tier 2 — strong, a bit more effort
- **Safety in numbers** — anonymous count of SheMap users near your route now.
- **Geofenced auto check-in** — if you stop moving in a low-score area at night, app asks
  "Are you safe?" and escalates if no reply.
- **Heatmap time-lapse** — rewind 24h / 7d to reveal patterns.
- **Area reputation trend** — "improving / declining" from report velocity (real from DB).

### Tier 3 — positioning & polish (cheap, mostly messaging)
- **Privacy-first stance** — location shared only with chosen contacts via ephemeral
  links; deliberate anti-surveillance contrast to crime apps. Pure framing, zero code.
- **Voice-first / multilingual** (India context) — accessibility angle.
- **Real gamification** — safe-arrival streaks, verified-report reputation tied to real
  actions instead of fake stats.

### Recommended headline for the week
Time Machine + Safe-haven-aware routing as the USP pair, AI Companion as the "wow,"
privacy-first as positioning:

> *"SheMap routes you the safest way, keeps you near help, predicts the risk at your
> travel time, and never sells your location."*

---

## 7. The 90-second demo flow (rehearse this)

1. Open map, search a destination → multiple routes appear with different safety scores.
2. Drag the **Time Machine** slider from noon → 10 PM; routes recolor, the safe one changes.
3. Tap a route → "why" panel shows it passes 2 police stations + a 24/7 pharmacy.
4. Start journey → share live link → "2 contacts watching."
5. Ask the **AI Companion**: "Is it safe now?" → grounded answer.
6. Close with the privacy-first one-liner.
