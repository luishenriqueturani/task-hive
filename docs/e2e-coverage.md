# Testes E2E — Task Hive API

## Como executar

1. Subir o Postgres de testes (porta host **5433**, não conflita com 5432):

   ```bash
   docker compose -f docker-compose.e2e.yml up -d
   ```

2. Variáveis: copie [`.env.e2e.example`](../.env.e2e.example) para `.env.e2e` na raiz do repositório.

3. Rodar a suíte:

   ```bash
   npm run test:e2e
   ```

O Jest usa [`test/jest-e2e.json`](../test/jest-e2e.json): um worker (`maxWorkers: 1`) para evitar `synchronize` concorrente no mesmo banco; relatório JUnit em `test-results/e2e-junit.xml`.

## Comportamento da API relevante para os testes

- **`ValidationPipe`**: erros de DTO retornam **422** (ver [`src/main.ts`](../src/main.ts)).
- **Auth**: `AuthGuard` com token ausente/inválido → **403** (não 401).
- **POST** que criam recurso: Nest 11 costuma responder **201 Created** em vários endpoints (login, registro, projetos, tarefas, etc.); os testes assertam o status real.

## Matriz de cobertura (sintética)

| Área | Ficheiro | Cenários cobertos (resumo) |
|------|----------|----------------------------|
| App | `test/app.e2e-spec.ts` | GET `/` 200 |
| Auth | `test/auth.e2e-spec.ts` | login 422/400; login 201; logout 403/201 + sessão invalidada; forget-password 422; check-token 422 |
| Users | `test/users.e2e-spec.ts` | POST 422; criação 201; email duplicado 422; GET lista/auth; GET por id; inexistente corpo vazio; DELETE própria conta 403 |
| Companies | `test/companies.e2e-spec.ts` | GET 403; POST 422; CRUD 200/201; PATCH 404 |
| Projects | `test/projects.e2e-spec.ts` | GET 403; POST 422; CRUD + participantes + PATCH 403 participante; participants 404 |
| Project stages | `test/project-stages.e2e-spec.ts` | POST 422; CRUD coluna; POST coluna 403 participante |
| Tasks | `test/tasks.e2e-spec.ts` | POST 422; CRUD + timetrack start/stop/list; GET timetrack 404 |
| Subtasks | `test/subtasks.e2e-spec.ts` | POST 422; CRUD + listagem por tarefa |
| To-do | `test/to-do.e2e-spec.ts` | GET 403; POST 422; CRUD + status + end; PATCH status 422 enum |
| WebSocket timetrack | `test/timetrack.gateway.e2e-spec.ts` | evento `timetrack:started` após POST start (Socket.IO + HTTP) |

## Correção aplicada durante os E2E

Em [`project-stages.service.ts`](../src/project-stages/project-stages.service.ts), `ForbiddenException` passou a ser re-lançada nos `catch` de `create` e `update` (antes virava 500).

## Export do `AuthModule`

[`auth.module.ts`](../src/auth/auth.module.ts) re-exporta `UsersModule` para o `AuthGuard` resolver `UsersService` em módulos que só importam `AuthModule`.
