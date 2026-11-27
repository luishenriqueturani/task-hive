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

### OpenAPI (`openapi/openapi.json`, Orval, etc.)

- **`npm run openapi:generate`** — arranca a app em memória e grava `openapi/openapi.json`. Com `OPENAPI_GENERATE=1` o DataSource é um stub (não precisa de PostgreSQL).
- Com a API **já em execução** (versão que queres documentar): **`npm run openapi:pull`** — opcional `OPENAPI_URL` e, se o Swagger tiver Basic Auth, `SWAGGER_USER` / `SWAGGER_PASSWORD`.
- Com a API **já em execução** (versão que queres documentar): **`npm run openapi:pull`** — opcional `OPENAPI_URL` e, se o Swagger tiver Basic Auth, `SWAGGER_USER` / `SWAGGER_PASSWORD`.
- O JSON corresponde ao **código que está deployado / compilado**: após alterações no backend, regera o ficheiro (ou faz pull contra a instância já atualizada) antes de correr o gerador no front.

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

## Primeiro utilizador admin (seeder)

Não há dados iniciais na migration. Para criar um **ADMIN_GOD** (idempotente por email):

```bash
# Na raiz do repositório no host (com `npm install` e ficheiro `.env` com DB_* — usa `git config user.name` / `user.email`)
SEED_ADMIN_PASSWORD='palavra-passe-forte' npm run seed:admin
```

Opcional no `.env` ou no comando: `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`. Se não houver email no Git, gera-se algo como `nome.sobrenome@task-hive.local`.

**Não corras `npm run seed:admin` dentro do contentor `api`:** a imagem de produção não tem `src/`, `ts-node` nem `dotenv-cli`; o script correcto aí é o de baixo (`seed:admin:dist` ou `node dist/...`). As variáveis `DB_*` vêm do ambiente injectado pelo Compose, não de um `.env` no disco do contentor.

**Docker:** o contentor leva o `package.json` e o `dist/` **da última vez que construíste a imagem**. Depois de `git pull` com o seeder novo, **reconstrói** antes de correr o seed:

```bash
docker compose build api && docker compose up -d api
docker compose exec -e SEED_ADMIN_PASSWORD='palavra-passe-forte' api npm run seed:admin:dist
```

Equivalente sem depender do script npm (útil se o `package.json` dentro da imagem ainda for antigo mas o `dist/` já tiver o ficheiro):

```bash
docker compose exec -e SEED_ADMIN_PASSWORD='palavra-passe-forte' api node dist/seed/seed-admin.js
```

Se `dist/seed/seed-admin.js` não existir, o `build` da API ainda não incluiu o seed — volta a fazer **`docker compose build --no-cache api`** a partir do código actualizado.

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

## Docker em casa

**App no Orange Pi (API + UI):** compose na **raiz do monorepo** — ver [`../README.md`](../README.md#docker-em-casa-orange-pi). Acesso por IP (`http://IP:8080`), sem DNS. Postgres, Nginx e Grafana estão em `/root/infra`, não neste compose.

O volume `task_hive_pg` é do Postgres partilhado. Não corras `docker compose down -v` em `/root/infra/postgres`.

Comandos com **`docker compose`** (espaço — plugin Compose v2). Se ainda só tiveres `docker-compose` (hífen) antigo, vê [`docs/docker-compose-legacy.md`](docs/docker-compose-legacy.md).

1. Copia e edita o `.env` (mínimo: `POSTGRES_PASSWORD`, `DB_PASSWORD`, `DB_REMOTE_PASSWORD`, `JWT_SECRET`, `SWAGGER_PASSWORD`, `GRAFANA_ADMIN_PASSWORD`; alinha `DB_NAME` com `POSTGRES_DB`). O [``.env.example`](.env.example) lista todos os campos.

2. Sobe a app a partir da **raiz** do monorepo (`docker compose up -d --build`), com o Postgres partilhado já a correr. Não há compose só-API neste diretório.

3. **Utilizadores na base de dados** (criados na **primeira** inicialização do volume; ver nota abaixo):

   | Variável | Papel |
   |----------|--------|
   | `POSTGRES_USER` / `POSTGRES_PASSWORD` | Superuser do contentor (ex. `postgres`) — administração total; **não** uses como `DB_USER`. |
   | `DB_USER` / `DB_PASSWORD` | Utilizador da API (migrations + TypeORM). |
   | `DB_REMOTE_USER` / `DB_REMOTE_PASSWORD` | Clientes remotos (pgAdmin, DBeaver, `psql`) na LAN: IP do Pi, porta **5433**. |

   `DB_USER` e `DB_REMOTE_USER` têm de ser **nomes diferentes** de `POSTGRES_USER` e entre si.

4. **Porta HTTP** no host: `HTTP_PORT` (default **8080**). O Nginx faz proxy para **`http://api:3001`** na rede Docker. Aceita qualquer `Host` (incluindo IP da LAN).

5. **Grafana** na porta `GRAFANA_PORT` (default **3002**), com `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`. O Prometheus scrapa `http://api:3001/metrics` só na rede Docker (sem porta no host). `/metrics` **não** é exposto pelo Nginx.

6. **Volume novo:** o script `docker/postgres/init/01-users.sh` corre só quando o volume de dados está vazio. Se já tinhas dados com outro esquema de utilizadores, ou `docker compose down -v`, trata como **nova** base ou aplica alterações manualmente em SQL.

### Migrations dentro do contentor `api`

A imagem de produção só tem **`dist/`** (sem `src/` nem `ts-node`). Usa os scripts que apontam para o DataSource compilado:

```bash
docker compose exec api npm run migration:run:dist
docker compose exec api npm run migration:revert:dist
```

O Compose da raiz define **`DB_HOST=shared-postgres`** e **`DB_PORT=5432`** para o serviço `api`; **`DB_USER`**, **`DB_PASSWORD`** e **`DB_NAME`** vêm do teu `.env` (via `env_file`). Na LAN, o Postgres partilhado está na porta **5433** do Pi.

Se o contentor `api` ainda não estiver a correr:

```bash
docker compose run --rm api npm run migration:run:dist
```

**Rebuild** (`docker compose up -d --build`) sempre que adicionares ou alterares ficheiros em `src/migrations/`, para o `dist` da imagem incluir as novas migrations.

No **host** (código-fonte + Postgres na porta publicada), continua a usar `npm run typeorm -- migration:run` com `DB_HOST=127.0.0.1` e `DB_PORT` = `POSTGRES_PUBLISH_PORT`.

### Volume do Postgres

Os dados estão no volume `task_hive_pg`, montado pelo contentor `shared-postgres`. `docker compose down -v` nessa stack apaga a base. Para mudar a password de um role, usa o `ALTER ROLE` abaixo. O script `docker/postgres/init/01-users.sh` só corre num volume vazio.

**Só alterar a password de um role** (Postgres já a correr, superuser `postgres`):

```bash
docker exec shared-postgres psql -U postgres -d task_hive -c "ALTER ROLE taskhive_app PASSWORD 'a_tua_nova_password';"
```

Depois iguala `DB_PASSWORD` no `.env` à mesma string. Para migrations a correr **no host** (fora do Docker), usa o IP do Pi e `DB_PORT=5433`. Dentro da rede Docker o host é `shared-postgres` e a porta é `5432`.

**`.env`:** não repitas `DB_USER` / `DB_PASSWORD` / `DB_NAME` no mesmo ficheiro. Passwords com **`#`** têm de ir entre aspas no `.env`. A API carrega credenciais via `env_file`. `DB_HOST` e `DB_PORT` do contentor vêm fixos no YAML (`shared-postgres` / `5432`).

Para confirmar no servidor: `docker compose exec api sh -c 'echo DB_HOST=$DB_HOST; test -n "$DB_PASSWORD" && echo DB_PASSWORD=definida || echo DB_PASSWORD=AUSENTE'`.

**Segurança:** expor `POSTGRES_PUBLISH_PORT` na LAN é prático; na Internet usa firewall/VPN e passwords fortes. Não coloques secrets no `Dockerfile`; usa `.env` (fora do Git) ou secrets do ambiente.

### Acesso na LAN (sem DNS)

Abre **`http://IP_DO_SERVIDOR:8080`** (ou o valor de `HTTP_PORT`). A API Nest continua na **3001** só **dentro** da rede Docker; o Nginx é a entrada HTTP.

Grafana: **`http://IP_DO_SERVIDOR:3002`** (ou `GRAFANA_PORT`) com as credenciais `GRAFANA_*`. Dashboard provisionado: **TaskHive API**.

Nomes locais (`/etc/hosts`, mDNS `orangepi.local`, etc.) são **opcionais** — úteis quando tiveres DNS; não são necessários para o proxy actual (`server_name _`).

## Documentação extra

- Cobertura E2E: [`docs/e2e-coverage.md`](docs/e2e-coverage.md)
- Migrations e baseline: [`docs/database-migrations.md`](docs/database-migrations.md)
- Compose antigo / só `docker-compose` com hífen: [`docs/docker-compose-legacy.md`](docs/docker-compose-legacy.md)

## Licença

UNLICENSED (projeto privado).
