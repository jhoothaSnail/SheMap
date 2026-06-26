"""
Public live-tracking routes (no authentication).

When a user shares their journey, trusted contacts open a link that lands on a
lightweight HTML page (`GET /t/{journey_id}`). That page polls a public JSON
endpoint (`GET /api/v1/track/{journey_id}`) every few seconds to show the
traveller's latest position on a map.

The journey UUID doubles as an unguessable share token, so no schema change or
login is required. Viewer presence is tracked in-memory to power the
"N contacts watching" indicator (resets on server restart — acceptable for an
MVP without a cache/queue).
"""
import time
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.journey import Journey, JourneyEvent

router = APIRouter()

# journey_id -> { viewer_id: last_seen_epoch }
_viewers: dict[str, dict[str, float]] = {}
_VIEWER_TTL = 30  # seconds a viewer counts as "watching" after their last poll


def _count_watchers(journey_id: str) -> int:
    now = time.time()
    seen = _viewers.get(journey_id, {})
    # Drop stale viewers and count the rest.
    fresh = {vid: ts for vid, ts in seen.items() if now - ts < _VIEWER_TTL}
    _viewers[journey_id] = fresh
    return len(fresh)


@router.get("/track/{journey_id}")
def track_status(
    journey_id: str,
    viewer: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Public JSON snapshot of a journey's latest location + watcher count."""
    journey = db.query(Journey).filter(Journey.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")

    # A `viewer` id means this poll came from a contact's tracking page.
    if viewer:
        _viewers.setdefault(journey_id, {})[viewer] = time.time()

    latest = (
        db.query(JourneyEvent)
        .filter(
            JourneyEvent.journey_id == journey_id,
            JourneyEvent.latitude.isnot(None),
            JourneyEvent.longitude.isnot(None),
        )
        .order_by(JourneyEvent.created_at.desc())
        .first()
    )
    if latest:
        lat, lng, at = latest.latitude, latest.longitude, latest.created_at
    else:
        lat, lng, at = journey.origin_lat, journey.origin_lng, journey.started_at

    return {
        "journey_id": journey.id,
        "status": journey.status.value if hasattr(journey.status, "value") else journey.status,
        "origin": [journey.origin_lat, journey.origin_lng],
        "origin_label": journey.origin_label,
        "destination": [journey.dest_lat, journey.dest_lng],
        "dest_label": journey.dest_label,
        "latest": {"lat": lat, "lng": lng, "at": at.isoformat() if at else None},
        "eta_minutes": journey.eta_minutes,
        "expected_arrival": journey.expected_arrival.isoformat() if journey.expected_arrival else None,
        "deviation_detected": journey.deviation_detected,
        "safe_arrival_confirmed": journey.safe_arrival_confirmed,
        "watchers": _count_watchers(journey_id),
    }


_TRACK_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SheMaps — Live Location</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html,body{margin:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#1c0f18}
  #map{position:absolute;inset:0;bottom:96px}
  #bar{position:absolute;left:0;right:0;bottom:0;height:96px;background:#1c0f18;color:#fff;padding:12px 16px;box-sizing:border-box}
  .title{font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px}
  .dot{width:9px;height:9px;border-radius:50%;background:#10b981;box-shadow:0 0 0 4px rgba(16,185,129,0.25)}
  .meta{font-size:12px;color:rgba(255,255,255,0.6);margin-top:6px}
  .pill{display:inline-block;background:rgba(201,64,118,0.25);color:#f5a8c7;border-radius:999px;padding:2px 8px;font-size:11px;margin-left:6px}
</style>
</head>
<body>
<div id="map"></div>
<div id="bar">
  <div class="title"><span class="dot"></span> Live location <span id="status" class="pill">connecting…</span></div>
  <div class="meta" id="meta">Loading the latest position…</div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const JID = "__JID__";
  let viewer = localStorage.getItem("shemap_viewer");
  if(!viewer){ viewer = Math.random().toString(36).slice(2); localStorage.setItem("shemap_viewer", viewer); }

  const map = L.map("map").setView([20.59,78.96], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(map);
  let me=null, dest=null, centered=false;

  function fmtAgo(iso){
    if(!iso) return "unknown";
    const s = Math.max(0, (Date.now()-new Date(iso).getTime())/1000);
    if(s<60) return Math.round(s)+"s ago";
    if(s<3600) return Math.round(s/60)+" min ago";
    return Math.round(s/3600)+" hr ago";
  }

  async function poll(){
    try{
      const r = await fetch("/api/v1/track/"+JID+"?viewer="+viewer);
      if(!r.ok){ document.getElementById("status").textContent = "not found"; return; }
      const d = await r.json();
      const [lat,lng] = [d.latest.lat, d.latest.lng];
      if(!me){ me = L.marker([lat,lng]).addTo(map); } else { me.setLatLng([lat,lng]); }
      if(d.destination && d.destination[0] && !dest){
        dest = L.circleMarker(d.destination,{radius:8,color:"#c94076",fillColor:"#c94076",fillOpacity:0.9}).addTo(map).bindPopup("Destination");
      }
      if(!centered){ map.setView([lat,lng], 16); centered = true; }
      const arrived = d.safe_arrival_confirmed;
      const st = arrived ? "arrived safely" : (d.status === "delayed" ? "running late" : "on the way");
      document.getElementById("status").textContent = st;
      document.getElementById("meta").innerHTML =
        "Updated " + fmtAgo(d.latest.at) + " · " + (d.dest_label ? ("to " + d.dest_label) : "")
        + (d.deviation_detected ? " · <span style='color:#f59e0b'>route deviation</span>" : "");
    }catch(e){ document.getElementById("status").textContent = "offline"; }
  }
  poll();
  setInterval(poll, 5000);
</script>
</body>
</html>"""


@router.get("/t/{journey_id}", response_class=HTMLResponse)
def tracking_page(journey_id: str, request: Request):
    """Self-contained HTML tracking page for contacts (no login needed)."""
    return HTMLResponse(_TRACK_PAGE.replace("__JID__", journey_id))
