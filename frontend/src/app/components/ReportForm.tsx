import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, MapPin, Crosshair, CheckCircle2, Loader2 } from "lucide-react";
import { reportsApi } from "../api/api";

// Values must match the backend ReportCategory enum.
const REPORT_TYPES = [
  { id: "catcalling", label: "Catcalling", icon: "📢" },
  { id: "harassment", label: "Harassment", icon: "⚠️" },
  { id: "following", label: "Following", icon: "👤" },
  { id: "stalking", label: "Stalking", icon: "🚨" },
  { id: "unsafe_crowd", label: "Unsafe Crowd", icon: "👥" },
  { id: "dark_area", label: "Dark Area", icon: "🌑" },
  { id: "broken_streetlight", label: "Broken Streetlight", icon: "🔦" },
  { id: "suspicious_person", label: "Suspicious Person", icon: "👁️" },
  { id: "unsafe_shortcut", label: "Unsafe Shortcut", icon: "⛔" },
  { id: "drunk_individuals", label: "Drunk Individuals", icon: "🍺" },
];

interface ReportFormProps {
  defaultLocation?: { lat: number; lng: number } | null;
  pickedLocation?: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmitted?: () => void;
  onPickOnMap?: () => void;
}

export function ReportForm({ defaultLocation, pickedLocation, onClose, onSubmitted, onPickOnMap }: ReportFormProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [severity, setSeverity] = useState<1 | 2 | 3>(2);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(defaultLocation ?? null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // A location picked on the map takes precedence when provided.
  useEffect(() => {
    if (pickedLocation) setLocation(pickedLocation);
  }, [pickedLocation]);

  const locateMe = () => {
    if (!("geolocation" in navigator)) {
      setError("Location is not supported on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Try picking it on the map.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  };

  const toggleType = (id: string) => {
    setSelectedTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  // Tags are optional now — only a description and a location are required.
  const canSubmit = desc.trim().length >= 10 && location && !submitting;

  const handleSubmit = async () => {
    if (!location) {
      setError("Please set a location (use current location or pick on the map).");
      return;
    }
    if (desc.trim().length < 10) {
      setError("Please describe what happened (at least 10 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    const labels = selectedTypes.map((id) => REPORT_TYPES.find((t) => t.id === id)?.label ?? id);
    // Backend stores one primary category; default to a generic one when no tag
    // is chosen, and keep any extra tags visible in the description.
    const primaryCategory = selectedTypes[0] ?? "suspicious_person";
    const computedTitle = title.trim() || (labels.length ? labels.join(", ") : "Safety report");
    const extraTags = labels.length > 1 ? `[Tags: ${labels.join(", ")}] ` : "";
    try {
      await reportsApi.create({
        category: primaryCategory,
        title: computedTitle,
        description: extraTags + desc.trim(),
        latitude: location.lat,
        longitude: location.lng,
        severity,
      });
      setSubmitted(true);
      onSubmitted?.();
      setTimeout(onClose, 1400);
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit report. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="relative w-full max-w-sm rounded-t-3xl"
        style={{ background: "#faf4f7", maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        {submitted ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <p className="text-foreground font-bold text-lg">Report Submitted!</p>
            <p className="text-sm" style={{ color: "#6e4a60" }}>Thank you for keeping the community safe.</p>
          </div>
        ) : (
          <div className="p-5">
            {/* Header */}
            <div
              className="flex items-center justify-between mb-5 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-3xl"
              style={{ background: "linear-gradient(135deg, #1c0f18, #2e1424)" }}
            >
              <div>
                <h3 className="font-bold text-white">New Safety Report</h3>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Help keep your community informed</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <X size={15} style={{ color: "rgba(255,255,255,0.7)" }} />
              </button>
            </div>

            {/* Type grid — optional, multi-select */}
            <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>
              WHAT HAPPENED? <span className="font-medium" style={{ color: "#6e4a60" }}>(optional · pick any)</span>
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {REPORT_TYPES.map((t) => {
                const active = selectedTypes.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleType(t.id)}
                    className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: active ? "rgba(201,64,118,0.1)" : "#ffffff",
                      border: `1.5px solid ${active ? "#c94076" : "rgba(28,15,24,0.09)"}`,
                      boxShadow: active ? "0 2px 10px rgba(201,64,118,0.2)" : "0 1px 3px rgba(28,15,24,0.05)",
                    }}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-xs font-semibold flex-1" style={{ color: active ? "#c94076" : "#1c0f18" }}>{t.label}</span>
                    {active && <span className="text-[10px] font-bold" style={{ color: "#c94076" }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Location */}
            <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>LOCATION</p>
            <div
              className="rounded-xl p-3 mb-2 flex items-center gap-2"
              style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)" }}
            >
              <MapPin size={14} style={{ color: location ? "#059669" : "#6e4a60" }} />
              <span className="text-xs flex-1" style={{ color: location ? "#1c0f18" : "#6e4a60" }}>
                {location
                  ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : "No location set"}
              </span>
            </div>
            <div className="flex gap-2 mb-5">
              <button
                onClick={locateMe}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1.5px solid rgba(16,185,129,0.3)" }}
              >
                {locating ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />}
                Use current location
              </button>
              {onPickOnMap && (
                <button
                  onClick={onPickOnMap}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "#ffffff", color: "#6e4a60", border: "1.5px solid rgba(28,15,24,0.09)" }}
                >
                  <MapPin size={13} /> Pick on map
                </button>
              )}
            </div>

            {/* Severity */}
            <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>SEVERITY</p>
            <div className="flex gap-2 mb-5">
              {([1, 2, 3] as const).map((s) => {
                const colors = s === 1 ? { c: "#059669", bg: "rgba(16,185,129,0.12)", brd: "rgba(16,185,129,0.4)" }
                  : s === 2 ? { c: "#b45309", bg: "rgba(245,158,11,0.12)", brd: "rgba(245,158,11,0.4)" }
                  : { c: "#dc2626", bg: "rgba(244,63,94,0.12)", brd: "rgba(244,63,94,0.4)" };
                return (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: severity === s ? colors.bg : "#ffffff",
                      color: severity === s ? colors.c : "#6e4a60",
                      border: `1.5px solid ${severity === s ? colors.brd : "rgba(28,15,24,0.09)"}`,
                      boxShadow: severity === s ? `0 2px 8px ${colors.brd}` : "none",
                    }}
                  >
                    {s === 1 ? "Low" : s === 2 ? "Moderate" : "High"}
                  </button>
                );
              })}
            </div>

            {/* Title (optional) */}
            <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>TITLE (OPTIONAL)</p>
            <input
              className="w-full rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none mb-4"
              style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)" }}
              placeholder="Short summary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />

            {/* Description */}
            <p className="text-foreground text-xs font-bold mb-2" style={{ letterSpacing: "0.05em" }}>DESCRIPTION</p>
            <textarea
              className="w-full rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-2"
              style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", minHeight: 80 }}
              placeholder="Describe what happened and where exactly (min 10 characters)..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />

            {error && <p className="text-xs mb-3" style={{ color: "#dc2626" }}>{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: canSubmit ? "linear-gradient(135deg, #c94076, #a8305a)" : "rgba(28,15,24,0.08)",
                color: canSubmit ? "#fff" : "#6e4a60",
                boxShadow: canSubmit ? "0 6px 20px rgba(201,64,118,0.35)" : "none",
              }}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
