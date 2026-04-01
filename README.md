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

- **`npm run openapi:generate`** — arranca a app em memória e grava `openapi/openapi.json`. É preciso **PostgreSQL acessível** com o mesmo `.env` que a API.
- Se correres o comando **no host** e o `.env` tiver `DB_HOST=postgres` (nome do serviço no Docker), o host não resolve esse nome: define **`DB_HOST_OPENAPI=127.0.0.1`** (e a porta publicada do Postgres, ex. `5432`) no `.env`. O script define `OPENAPI_GENERATE=1` só durante a geração.
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

## Docker em casa (Postgres + API + Nginx)

Ficheiros: [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), [`docker/nginx.conf`](docker/nginx.conf), script de init em [`docker/postgres/init/`](docker/postgres/init/).

Comandos com **`docker compose`** (espaço — plugin Compose v2). Se ainda só tiveres `docker-compose` (hífen) antigo, vê [`docs/docker-compose-legacy.md`](docs/docker-compose-legacy.md).

1. Copia e edita o `.env` (mínimo: `POSTGRES_PASSWORD`, `DB_PASSWORD`, `DB_REMOTE_PASSWORD`, `JWT_SECRET`, `SWAGGER_PASSWORD`; alinha `DB_NAME` com `POSTGRES_DB`). O [``.env.example`](.env.example) lista todos os campos.

2. Sobe a stack:

   ```bash
   docker compose up -d --build
   ```

3. **Utilizadores na base de dados** (criados na **primeira** inicialização do volume; ver nota abaixo):

   | Variável | Papel |
   |----------|--------|
   | `POSTGRES_USER` / `POSTGRES_PASSWORD` | Superuser do contentor (ex. `postgres`) — administração total; **não** uses como `DB_USER`. |
   | `DB_USER` / `DB_PASSWORD` | Utilizador da API (migrations + TypeORM). |
   | `DB_REMOTE_USER` / `DB_REMOTE_PASSWORD` | Clientes remotos (pgAdmin, DBeaver, `psql`) na LAN: liga ao **IP do host** e à porta **`POSTGRES_PUBLISH_PORT`** (default **5432**). |

   `DB_USER` e `DB_REMOTE_USER` têm de ser **nomes diferentes** de `POSTGRES_USER` e entre si.

4. **Porta HTTP** no host: `HTTP_PORT` (default **8080**). O Nginx faz proxy para **`http://taskhive.orangepi.local:3001`** na rede Docker (alias do serviço `api`).

5. **Volume novo:** o script `docker/postgres/init/01-users.sh` corre só quando o volume de dados está vazio. Se já tinhas dados com outro esquema de utilizadores, ou `docker compose down -v`, trata como **nova** base ou aplica alterações manualmente em SQL.

### Migrations dentro do contentor `api`

A imagem de produção só tem **`dist/`** (sem `src/` nem `ts-node`). Usa os scripts que apontam para o DataSource compilado:

```bash
docker compose exec api npm run migration:run:dist
docker compose exec api npm run migration:revert:dist
```

O Compose já define **`DB_HOST=postgres`** e **`DB_PORT=5432`** para o serviço `api`; **`DB_USER`**, **`DB_PASSWORD`** e **`DB_NAME`** vêm do teu `.env` (via `env_file`). Não precisas de hostname `postgres` no host — só dentro da rede Docker.

Se o contentor `api` ainda não estiver a correr:

```bash
docker compose run --rm api npm run migration:run:dist
```

**Rebuild** (`docker compose up -d --build`) sempre que adicionares ou alterares ficheiros em `src/migrations/`, para o `dist` da imagem incluir as novas migrations.

No **host** (código-fonte + Postgres na porta publicada), continua a usar `npm run typeorm -- migration:run` com `DB_HOST=127.0.0.1` e `DB_PORT` = `POSTGRES_PUBLISH_PORT`.

### Recriar o Postgres (sem dados / password errada no init)

Se criaste o volume com `DB_PASSWORD` vazio ou queres alinhar utilizadores ao `.env` sem dados a preservar:

```bash
docker compose down -v
# Preenche no .env: POSTGRES_PASSWORD, DB_PASSWORD, DB_REMOTE_PASSWORD (todos não vazios)
docker compose up -d
```

O `-v` remove o volume nomeado (`task_hive_pg`); na próxima subida o init volta a criar roles e extensões.

**Só alterar a password de um role** (Postgres já a correr, superuser `postgres`):

```bash
docker compose exec postgres psql -U postgres -d task_hive -c "ALTER ROLE taskhive_app PASSWORD 'a_tua_nova_password';"
```

Depois iguala `DB_PASSWORD` no `.env` à mesma string. Para migrations a correr **no host** (fora do Docker), usa `DB_HOST=127.0.0.1` (ou IP da máquina) e `DB_PORT` igual a `POSTGRES_PUBLISH_PORT` — o hostname `postgres` só existe dentro da rede do Compose.

Se no **host** já existir um serviço na porta **5432** (Postgres instalado no sistema, outro contentor com `-p 5432`, etc.), define **`POSTGRES_PUBLISH_PORT`** para uma porta livre (ex. **5433**); a API dentro do Docker não precisa de alteração.

**`.env`:** não repitas `DB_USER` / `DB_PASSWORD` / `DB_NAME` no mesmo ficheiro. Passwords com **`#`** têm de ir entre aspas no `.env`. No `docker-compose.yml`, **Postgres e API** carregam credenciais **só via `env_file`** (não usamos `${DB_PASSWORD}` no bloco `environment`), para o Compose no host nunca sobrescrever com variável vazia. Só `DB_HOST`/`DB_PORT` da API vêm fixos no YAML (`postgres` / `5432`).

Para confirmar no servidor: `docker compose exec api sh -c 'echo DB_HOST=$DB_HOST; test -n "$DB_PASSWORD" && echo DB_PASSWORD=definida || echo DB_PASSWORD=AUSENTE'`.

**Segurança:** expor `POSTGRES_PUBLISH_PORT` na LAN é prático; na Internet usa firewall/VPN e passwords fortes. Não coloques secrets no `Dockerfile`; usa `.env` (fora do Git) ou secrets do ambiente.

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
