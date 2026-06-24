"""
Gemini AI Service
Uses google-generativeai to generate:
- Route safety explanations
- Area safety summaries
- Forecast narratives
- Report summaries
"""
import google.generativeai as genai
from app.core.config import settings

_model = None


def _get_model():
    global _model
    if _model is None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-1.5-flash")
    return _model


def _safe_generate(prompt: str, fallback: str = "Safety analysis unavailable.") -> str:
    if not settings.GEMINI_API_KEY:
        return fallback
    try:
        resp = _get_model().generate_content(prompt)
        return resp.text.strip()
    except Exception:
        return fallback


# ---------------------------------------------------------------------------
def explain_area_safety(
    overall_score: float,
    dimensions: dict,
    report_count: int,
    location_label: str = "this area",
    hour: int = 18,
) -> str:
    top_concern = min(dimensions, key=dimensions.get)
    top_strength = max(dimensions, key=dimensions.get)
    time_str = f"{hour % 12 or 12} {'AM' if hour < 12 else 'PM'}"

    prompt = f"""
You are SheMaps AI, a women's safety assistant. Explain the safety situation in 2 concise sentences.
Be direct, empowering, and factual. Never be alarmist. Never use bullet points.

Location: {location_label}
Current time: {time_str}
Overall safety score: {overall_score}/100
Based on {report_count} community reports.
Strongest dimension: {top_strength.replace('_',' ')} ({dimensions[top_strength]:.0f}/100)
Biggest concern: {top_concern.replace('_',' ')} ({dimensions[top_concern]:.0f}/100)
"""
    return _safe_generate(prompt, fallback=f"Area scores {overall_score}/100. Community data shows {report_count} reports nearby.")


def explain_route_safety(
    route_type: str,
    safety_score: float,
    eta_minutes: float,
    highlights: list[str],
    warnings: list[str],
) -> str:
    prompt = f"""
You are SheMaps AI. Explain why the {route_type} route is recommended or not in 2 sentences.
Be concise and empowering. Focus on what matters to a woman walking alone.

Safety score: {safety_score}/100
ETA: {eta_minutes:.0f} minutes
Positives: {', '.join(highlights) if highlights else 'None noted'}
Concerns: {', '.join(warnings) if warnings else 'None'}
"""
    return _safe_generate(
        prompt,
        fallback=f"This {route_type} route scores {safety_score}/100 and takes approximately {eta_minutes:.0f} minutes.",
    )


def generate_forecast_summary(
    current_score: float,
    forecast: list[dict],
    risk_factors: list[dict],
) -> str:
    dropping = any(f["predicted_score"] < current_score - 15 for f in forecast)
    prompt = f"""
You are SheMaps AI. Summarise the safety forecast for the next 8 hours in 2 sentences.
{"Safety is declining later tonight — be direct about timing." if dropping else ""}
Current score: {current_score}/100
Forecast: {forecast}
Key risk factors: {[r['label'] for r in risk_factors]}
"""
    return _safe_generate(
        prompt,
        fallback=f"Current safety score is {current_score}/100. {'Safety decreases later tonight.' if dropping else 'Safety remains stable over the next few hours.'}",
    )


def summarise_reports(reports: list[dict]) -> str:
    if not reports:
        return "No recent reports in this area."
    categories = [r.get("category", "incident") for r in reports[:5]]
    prompt = f"""
You are SheMaps AI. Summarise recent community safety reports in 1–2 sentences.
Be factual and helpful. Do not be alarmist.
Recent report categories: {categories}
Total reports: {len(reports)}
"""
    return _safe_generate(
        prompt,
        fallback=f"There are {len(reports)} recent community reports in this area including {', '.join(set(categories))}.",
    )
