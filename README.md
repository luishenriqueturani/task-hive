# Task Hive

API em [NestJS](https://nestjs.com/) para gestão de **projetos**, **tarefas** (kanban com colunas), **subtarefas**, **to-do** (pontuais/recorrentes), **empresas**, **autenticação JWT**, **timetrack** com WebSocket (Socket.IO) e **participantes de projeto**.

## Requisitos

- Node.js 20+ (recomendado 22)
- PostgreSQL 16+
- Docker e Docker Compose (opcional, para subir stack completa)

## Configuração rápida (local, sem Docker)

1. Copie o exemplo de variáveis:

   ```bash
   cp .env.example .env
   ```

2. Edite `.env`: `DB_*`, `JWT_SECRET`, `CRYPT_SALT`, e para o Swagger **`SWAGGER_USER`** + **`SWAGGER_PASSWORD`** (HTTP Basic em `/api` e `/api-json`).

3. Instale dependências e aplique o schema (migrations):

   ```bash
   npm install
   npm run typeorm -- migration:run
   ```

4. Inicie a API:

   ```bash
   npm run start:dev
   ```

A API escuta em **`APP_PORT`** (default **3001**). Documentação interativa: `http://localhost:3001/api` (com utilizador/palavra-passe definidos no `.env`).

## Schema da base de dados (migrations)

- **`synchronize` do TypeORM está desligado** e não deve voltar a ser usado. Qualquer alteração ao modelo faz-se com **migrations** em `src/migrations/`.
- Ao arrancar, a aplicação executa migrations pendentes (`migrationsRun: true` em `src/repository/database.providers.ts`).
- Comandos úteis (carregam `.env`):

  ```bash
  npm run typeorm -- migration:run
  npm run typeorm -- migration:revert
  npm run typeorm -- migration:generate src/migrations/NomeDescritivo
  ```

- **Base já existente** (criada antes com `synchronize`): a migration inicial é **idempotente**; `migration:run` pode correr sem apagar dados. Detalhes e *baseline* manual opcional em [`docs/database-migrations.md`](docs/database-migrations.md).

## Testes

```bash
# Unitários
npm test

# E2E (Postgres na porta 5433 — ver docker-compose.e2e.yml)
docker-compose -f docker-compose.e2e.yml up -d
cp .env.e2e.example .env.e2e
# Se a BD E2E já tinha schema antigo sem migrations, limpe o volume ou o schema (ver docs/database-migrations.md)
npm run test:e2e
```

## Docker em casa (API + Nginx + Postgres opcional)

Ficheiros: [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), [`docker-compose.postgres.yml`](docker-compose.postgres.yml) (Postgres opcional), [`docker/nginx.conf`](docker/nginx.conf).

**Comando Compose:** em muitos servidores Linux / **CasaOS** / pacote `apt`, o binário é **`docker-compose`** (hífen). O **`docker compose`** (espaço) é o plugin v2. Se `docker compose up -d` falhar com `unknown shorthand flag: 'd'`, usa `docker-compose up -d`. Mais detalhes: [`docs/docker-compose-legacy.md`](docs/docker-compose-legacy.md).

- **Postgres já corre no servidor** (como no teu `.env`): sobe só API e proxy:

  ```bash
  docker-compose up -d
  ```

  No `.env`, `DB_HOST` deve ser alcançável **a partir do contentor** (ex.: IP da máquina anfitriã na LAN, ou `host.docker.internal` no Docker Desktop; em Linux podes acrescentar ao serviço `api` em `docker-compose.yml`: `extra_hosts: ["host.docker.internal:host-gateway"]` e usar `DB_HOST=host.docker.internal` se o Postgres estiver no host).

- **Postgres dentro do Docker** (segundo ficheiro, sem `profiles` nem opções só do Compose v2):

  ```bash
  docker-compose -f docker-compose.yml -f docker-compose.postgres.yml up -d
  ```

  No `.env`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` e **`DB_HOST=postgres`**, `DB_PORT=5432`, com `DB_USER` / `DB_PASSWORD` / `DB_NAME` alinhados.

- **Porta HTTP** no host: `HTTP_PORT` no `.env` (default **8080**). O Nginx na porta 80 do contentor faz proxy para **`http://api.taskhive.com:3001`** dentro da rede Docker (o nome `api.taskhive.com` é um **alias** do serviço `api`, não precisa de DNS na Internet).

**Segredos:** não coloques passwords ou `JWT_SECRET` no `Dockerfile`; usa sempre `.env` (fora do Git) ou secrets do teu ambiente.

### Acesso por nome noutro PC na mesma rede (sem DNS público)

O hostname **`api.taskhive.com`** só existe **entre contentores** (alias no Compose). Para o browser noutro PC usar um nome em vez do IP:

1. **Ficheiro hosts** — no PC cliente, uma linha com o **IP LAN do servidor** (a máquina onde corre o Docker), por exemplo:  
   `192.168.1.50 api.taskhive.com`  
   Depois abre **`http://api.taskhive.com:8080`** (ou o valor de `HTTP_PORT`). A porta **3001** é só interna à stack Docker; quem está fora usa normalmente a porta publicada pelo Nginx.
2. **mDNS (`.local`)** — alternativa: hostname do servidor tipo `taskhive.local` e `http://taskhive.local:8080`.

## Documentação extra

- Cobertura E2E: [`docs/e2e-coverage.md`](docs/e2e-coverage.md)
- Migrations e baseline: [`docs/database-migrations.md`](docs/database-migrations.md)
- `docker-compose` antigo / CasaOS: [`docs/docker-compose-legacy.md`](docs/docker-compose-legacy.md)

## Licença

UNLICENSED (projeto privado).
