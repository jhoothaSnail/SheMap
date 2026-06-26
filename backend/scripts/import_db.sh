#!/usr/bin/env bash
#
# import_db.sh — Restore a SheMap database dump produced by export_db.sh.
#
# Usage:
#   bash scripts/import_db.sh path/to/shemap_YYYYMMDD_HHMMSS.sql
#
# Creates the target database if it doesn't exist, then loads the dump.
# Reads connection details (incl. target DB name) from backend/.env.
#
set -euo pipefail

# Avoid GSSAPI/Kerberos negotiation, which can fail on machines without a krb5
# realm configured ("Configuration file does not specify default realm").
export PGGSSENCMODE=disable

# --- Args --------------------------------------------------------------------
DUMP="${1:-}"
if [ -z "$DUMP" ]; then
  echo "Usage: bash scripts/import_db.sh <dump-file.sql>" >&2
  exit 1
fi
if [ ! -f "$DUMP" ]; then
  echo "ERROR: dump file not found: $DUMP" >&2
  exit 1
fi

# --- Resolve paths -----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"

# --- Make sure psql is reachable --------------------------------------------
if ! command -v psql >/dev/null 2>&1; then
  for d in \
    /opt/homebrew/opt/postgresql@16/bin \
    /opt/homebrew/opt/postgresql@15/bin \
    /opt/homebrew/opt/postgresql@14/bin \
    /opt/homebrew/bin \
    /usr/local/opt/postgresql@15/bin \
    /usr/local/bin; do
    if [ -x "$d/psql" ]; then PATH="$d:$PATH"; fi
  done
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found. Install PostgreSQL (e.g. 'brew install postgresql@15')." >&2
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

# --- Derive DB name + an admin URL (pointing at the 'postgres' database) -----
# Strip any ?query params, then take the path component after the last '/'.
NO_PARAMS="${DATABASE_URL%%\?*}"
DB_NAME="${NO_PARAMS##*/}"
PARAMS=""
if [ "$DATABASE_URL" != "$NO_PARAMS" ]; then PARAMS="?${DATABASE_URL#*\?}"; fi
ADMIN_URL="${NO_PARAMS%/*}/postgres${PARAMS}"

# --- Create the database if it doesn't already exist -------------------------
EXISTS="$(psql "$ADMIN_URL" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" 2>/dev/null || true)"
if [ "$EXISTS" != "1" ]; then
  echo "Database '${DB_NAME}' not found — creating it..."
  psql "$ADMIN_URL" -c "CREATE DATABASE \"${DB_NAME}\";"
else
  echo "Database '${DB_NAME}' already exists — restoring into it (existing objects are dropped via --clean)."
fi

# --- Restore -----------------------------------------------------------------
echo "Restoring from: $DUMP"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$DUMP"

# --- Summary -----------------------------------------------------------------
echo "Done. Row counts now:"
for t in users trusted_contacts reports report_votes journeys journey_events; do
  COUNT="$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM $t;" 2>/dev/null || echo "n/a")"
  printf "  %-18s %s\n" "$t" "$COUNT"
done
