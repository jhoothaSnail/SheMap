#!/usr/bin/env bash
#
# export_db.sh — Export the SheMap PostgreSQL database to a single .sql file.
#
# Produces a full schema + data dump (with --clean --if-exists) that can be
# copied to another laptop and restored with import_db.sh. Run it from anywhere;
# it locates the project and reads DATABASE_URL from backend/.env.
#
set -euo pipefail

# Avoid GSSAPI/Kerberos negotiation, which can fail on machines without a krb5
# realm configured ("Configuration file does not specify default realm").
export PGGSSENCMODE=disable

# --- Resolve paths -----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
BACKUP_DIR="$BACKEND_DIR/backups"

# --- Make sure pg_dump is reachable (Homebrew installs aren't always on PATH) -
if ! command -v pg_dump >/dev/null 2>&1; then
  for d in \
    /opt/homebrew/opt/postgresql@16/bin \
    /opt/homebrew/opt/postgresql@15/bin \
    /opt/homebrew/opt/postgresql@14/bin \
    /opt/homebrew/bin \
    /usr/local/opt/postgresql@15/bin \
    /usr/local/bin; do
    if [ -x "$d/pg_dump" ]; then PATH="$d:$PATH"; fi
  done
fi
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump not found. Install PostgreSQL (e.g. 'brew install postgresql@15')." >&2
  exit 1
fi

# --- Read DATABASE_URL from .env --------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found." >&2
  exit 1
fi
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' )"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is empty in $ENV_FILE." >&2
  exit 1
fi
# Force IPv4: 'localhost' can resolve to ::1, which may point at a different
# Postgres cluster on this machine. 127.0.0.1 reliably hits the app's DB.
DATABASE_URL="${DATABASE_URL/@localhost:/@127.0.0.1:}"
DATABASE_URL="${DATABASE_URL/@localhost\//@127.0.0.1/}"

# --- Dump --------------------------------------------------------------------
mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/shemap_${TIMESTAMP}.sql"

echo "Exporting database to: $OUT"
pg_dump "$DATABASE_URL" --clean --if-exists --no-owner --no-privileges -f "$OUT"

# --- Summary -----------------------------------------------------------------
SIZE="$(du -h "$OUT" | cut -f1)"
echo "Done. Wrote $SIZE."
echo "Row counts captured:"
for t in users trusted_contacts reports report_votes journeys journey_events; do
  COUNT="$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM $t;" 2>/dev/null || echo "n/a")"
  printf "  %-18s %s\n" "$t" "$COUNT"
done

echo
echo "Next: copy this file to your other laptop, then run:"
echo "  bash scripts/import_db.sh \"$OUT\""
