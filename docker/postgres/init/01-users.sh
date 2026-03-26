#!/usr/bin/env bash
# Executado só na primeira inicialização do volume (docker-entrypoint-initdb.d).
# Cria: utilizador da API (DB_*) e utilizador para clientes remotos (DB_REMOTE_*).

set -euo pipefail

if [ "${DB_USER}" = "${POSTGRES_USER}" ] || [ "${DB_REMOTE_USER}" = "${POSTGRES_USER}" ]; then
  echo "01-users.sh: DB_USER e DB_REMOTE_USER têm de ser diferentes de POSTGRES_USER (superuser do contentor)." >&2
  exit 1
fi
if [ "${DB_USER}" = "${DB_REMOTE_USER}" ]; then
  echo "01-users.sh: DB_USER e DB_REMOTE_USER têm de ser nomes distintos." >&2
  exit 1
fi

_escape_sql() {
  printf '%s' "$1" | sed "s/'/''/g"
}

APP_PASS=$(_escape_sql "${DB_PASSWORD}")
REMOTE_PASS=$(_escape_sql "${DB_REMOTE_PASSWORD}")

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
CREATE ROLE "${DB_USER}" WITH LOGIN PASSWORD '${APP_PASS}';
CREATE ROLE "${DB_REMOTE_USER}" WITH LOGIN PASSWORD '${REMOTE_PASS}';
GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO "${DB_USER}", "${DB_REMOTE_USER}";
GRANT TEMPORARY ON DATABASE "${POSTGRES_DB}" TO "${DB_USER}";
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
GRANT USAGE, CREATE ON SCHEMA public TO "${DB_USER}", "${DB_REMOTE_USER}";
GRANT ALL PRIVILEGES ON SCHEMA public TO "${DB_REMOTE_USER}";
ALTER DEFAULT PRIVILEGES FOR ROLE "${DB_USER}" IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES FOR ROLE "${DB_USER}" IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO "${DB_REMOTE_USER}";
ALTER DEFAULT PRIVILEGES FOR ROLE "${DB_USER}" IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES FOR ROLE "${DB_USER}" IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO "${DB_REMOTE_USER}";
EOSQL
