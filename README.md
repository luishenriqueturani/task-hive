# Task Hive

API em [NestJS](https://nestjs.com/) para gestão de **projetos**, **tarefas** (kanban com colunas), **subtarefas**, **to-do** (pontuais/recorrentes), **empresas**, **autenticação JWT**, **timetrack** com WebSocket (Socket.IO) e **participantes de projeto**.

## Requisitos

- Node.js 20+ (recomendado 22)
- PostgreSQL 16+
- Docker e **Docker Compose v2** (`docker compose`, opcional para deploy em contentores)

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
docker compose -f docker-compose.e2e.yml up -d
cp .env.e2e.example .env.e2e
# Se a BD E2E já tinha schema antigo sem migrations, limpe o volume ou o schema (ver docs/database-migrations.md)
npm run test:e2e
```

## Docker em casa (API + Nginx + Postgres opcional)

Ficheiros: [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), [`docker/nginx.conf`](docker/nginx.conf).

Comandos com **`docker compose`** (espaço — plugin Compose v2). Se ainda só tiveres `docker-compose` (hífen) antigo, vê [`docs/docker-compose-legacy.md`](docs/docker-compose-legacy.md).

- **Postgres já corre no servidor** (BD no `.env`): API + Nginx apenas:

  ```bash
  docker compose up -d
  ```

  No `.env`, `DB_HOST` deve ser alcançável **a partir do contentor** (IP do host na LAN, `host.docker.internal` com `extra_hosts` no serviço `api`, etc.).

- **Postgres dentro do Docker** (perfil `bundled-db`): define `POSTGRES_*` no `.env` e **`DB_HOST=postgres`**, `DB_PORT=5432`, com `DB_USER` / `DB_PASSWORD` / `DB_NAME` alinhados.

  ```bash
  docker compose --profile bundled-db up -d
  ```

- **Porta HTTP** no host: `HTTP_PORT` no `.env` (default **8080**). O Nginx faz proxy para **`http://taskhive.orangepi.local:3001`** na rede Docker (alias do serviço `api`).

**Segredos:** não coloques passwords ou `JWT_SECRET` no `Dockerfile`; usa sempre `.env` (fora do Git) ou secrets do teu ambiente.

### Acesso por nome na LAN (`taskhive.orangepi.local`)

O mDNS resolve **`orangepi.local`** se o hostname do SBC for `orangepi` e o Avahi estiver activo; o subdomínio **`taskhive.orangepi.local`** em geral **não** aparece sozinho no mDNS.

1. **Recomendado:** em cada PC/telemóvel, no **`/etc/hosts`** (Linux/macOS) ou **`C:\Windows\System32\drivers\etc\hosts`** (Windows), uma linha com o **IP LAN do Orange Pi**:

   ```
   192.168.1.50   taskhive.orangepi.local
   ```

   (Substitui pelo IP real.)

2. No browser: **`http://taskhive.orangepi.local:8080`** (ou o valor de `HTTP_PORT`). A API Nest continua na **3001** só **dentro** da rede Docker; o Nginx é a entrada HTTP.

3. O Nginx aceita também **`http://orangepi.local:8080`** (`server_name` inclui `orangepi.local`) se o mDNS do host responder.

## Documentação extra

- Cobertura E2E: [`docs/e2e-coverage.md`](docs/e2e-coverage.md)
- Migrations e baseline: [`docs/database-migrations.md`](docs/database-migrations.md)
- Compose antigo / só `docker-compose` com hífen: [`docs/docker-compose-legacy.md`](docs/docker-compose-legacy.md)

## Licença

UNLICENSED (projeto privado).
