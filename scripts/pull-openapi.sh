#!/usr/bin/env bash
set -euo pipefail
mkdir -p openapi
BASE="${OPENAPI_URL:-http://localhost:3001}"
URL="${BASE%/}/api-json"
OUT="${OPENAPI_OUTPUT:-openapi/openapi.json}"

if [[ -n "${SWAGGER_USER:-}" && -n "${SWAGGER_PASSWORD:-}" ]]; then
  curl -sS -f -u "${SWAGGER_USER}:${SWAGGER_PASSWORD}" "$URL" -o "$OUT"
else
  curl -sS -f "$URL" -o "$OUT"
fi

echo "OpenAPI guardado em ${OUT}"
