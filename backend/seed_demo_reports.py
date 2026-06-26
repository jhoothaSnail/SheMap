"""
Seed demo community reports around a location so route safety-scoring and the
community feed have real data to work with.

Usage:
    ./.venv/bin/python seed_demo_reports.py [lat] [lng]

Defaults to Patna (25.6206, 85.1265) — the location of the existing demo user.
Re-running is safe: previously seeded rows (location_label == "seed") are
removed first, so you never accumulate duplicates.

The reports are arranged as a deliberate "danger corridor" on one side and a
calmer zone on the other, so different OSRM route alternatives pass through
different risk levels and the safest-route ranking becomes visible.
"""
import sys
from datetime import datetime, timezone, timedelta

from app.database import SessionLocal
from app.models.user import User
from app.models.report import Report, ReportCategory, ReportLifecycle
from app.services.report_scorer import update_report_score

SEED_LABEL = "seed"


def main() -> None:
    lat = float(sys.argv[1]) if len(sys.argv) > 1 else 25.6206
    lng = float(sys.argv[2]) if len(sys.argv) > 2 else 85.1265

    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No user found. Log in to the app once so a user exists, then re-run.")
            return

        removed = db.query(Report).filter(Report.location_label == SEED_LABEL).delete()
        db.commit()
        if removed:
            print(f"Removed {removed} previously seeded reports.")

        now = datetime.now(timezone.utc)

        # (d_lat, d_lng) offsets in degrees (~111 m per 0.001), category, title,
        # description, severity, minutes_ago, upvotes, lifecycle, verified
        specs = [
            # --- Danger corridor: WEST of origin (negative lng offset) ---
            (0.001, -0.014, ReportCategory.harassment, "Street harassment near market",
             "Group of men harassing women walking alone after dusk. Avoid if possible.", 3, 35, 14, ReportLifecycle.trending, True),
            (-0.002, -0.016, ReportCategory.stalking, "Reported stalking",
             "Someone followed a commuter for two blocks before she reached a shop.", 3, 90, 11, ReportLifecycle.trending, True),
            (0.003, -0.012, ReportCategory.dark_area, "Long unlit stretch",
             "No working street lights for ~300m. Very dark and isolated at night.", 3, 150, 8, ReportLifecycle.verified, True),
            (-0.004, -0.018, ReportCategory.broken_streetlight, "Broken streetlights",
             "Several streetlights out near the underpass.", 2, 220, 5, ReportLifecycle.verified, True),
            (0.005, -0.013, ReportCategory.following, "Man following women",
             "Repeated reports of a man following women near the bus stop.", 3, 60, 9, ReportLifecycle.new, False),
            (-0.001, -0.020, ReportCategory.drunk_individuals, "Drunk group loitering",
             "Group drinking and loitering near the corner late at night.", 2, 300, 4, ReportLifecycle.new, False),

            # --- Moderate zone: NORTH of origin ---
            (0.012, 0.001, ReportCategory.suspicious_person, "Suspicious person",
             "A person watching passers-by near the ATM. Felt unsafe.", 2, 45, 3, ReportLifecycle.new, False),
            (0.015, -0.002, ReportCategory.unsafe_crowd, "Rowdy crowd",
             "Large unmanaged crowd blocking the footpath in the evening.", 2, 130, 6, ReportLifecycle.verified, True),
            (0.010, 0.004, ReportCategory.catcalling, "Catcalling reported",
             "Catcalling from a parked vehicle reported by two users.", 2, 200, 7, ReportLifecycle.new, False),

            # --- Calmer zone: EAST of origin (positive lng offset) ---
            (0.001, 0.014, ReportCategory.suspicious_person, "Minor concern",
             "One report of someone loitering, otherwise area seems active.", 1, 240, 2, ReportLifecycle.new, False),
            (-0.002, 0.016, ReportCategory.broken_streetlight, "One light out",
             "A single streetlight is flickering near the park gate.", 1, 280, 1, ReportLifecycle.new, False),

            # --- Spread for district/state-level feed (further out) ---
            (0.05, 0.04, ReportCategory.harassment, "Harassment downtown",
             "Harassment reported in the central market district.", 3, 400, 18, ReportLifecycle.trending, True),
            (-0.06, 0.05, ReportCategory.stalking, "Stalking near station",
             "Stalking incident reported close to the railway station.", 3, 500, 12, ReportLifecycle.trending, True),
            (0.08, -0.07, ReportCategory.dark_area, "Unlit highway stretch",
             "Long dark stretch on the outer road, very few people around.", 2, 600, 6, ReportLifecycle.verified, True),
        ]

        created = 0
        for d_lat, d_lng, cat, title, desc, sev, mins_ago, ups, lifecycle, verified in specs:
            report = Report(
                user_id=user.id,
                category=cat,
                title=title,
                description=desc,
                latitude=round(lat + d_lat, 6),
                longitude=round(lng + d_lng, 6),
                location_label=SEED_LABEL,
                severity=sev,
                upvote_count=ups,
                downvote_count=max(0, ups // 9),
                lifecycle=lifecycle,
                is_verified=verified,
                created_at=now - timedelta(minutes=mins_ago),
            )
            db.add(report)
            db.flush()
            update_report_score(report, user, db)
            created += 1

        db.commit()
        print(f"Seeded {created} reports around ({lat}, {lng}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
