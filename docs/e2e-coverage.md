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

## Rotas HTTP vs cobertura E2E

Legenda: **Sim** = há pelo menos um `it` que chama a rota (feliz ou erro). **Parcial** = só validação/erro ou fluxo limitado. **Não** = sem teste direto.

### App

| Método | Rota | Coberto |
|--------|------|---------|
| GET | `/` | Sim |

### Auth (`/auth`)

| Método | Rota | Coberto |
|--------|------|---------|
| POST | `/auth/login` | Sim (422, 400, 201) |
| POST | `/auth/logout` | Sim (403, 201 + sessão invalidada) |
| POST | `/auth/forget-password` | Sim (422, **400** usuário inexistente) |
| POST | `/auth/check-token` | Parcial (só **422** token inválido; **200** com JWT de reset real não coberto — exigiria ler token da BD) |
| POST | `/auth/reset-password` | Parcial (**422** confirmPassword; fluxo **200** completo não coberto — mesmo motivo) |

### Users (`/users`)

| Método | Rota | Coberto |
|--------|------|---------|
| POST | `/users` | Sim |
| GET | `/users` | Sim |
| GET | `/users/:id` | Sim |
| PUT | `/users/:id` | Sim (atualização + GET confirma) |
| PATCH | `/users/:id` | Sim (soft delete de outro utilizador) |
| DELETE | `/users/:id` | Sim (403 na própria conta) |

### Companies (`/companies`)

| Método | Rota | Coberto |
|--------|------|---------|
| POST | `/companies` | Sim |
| GET | `/companies` | Sim |
| GET | `/companies/:id` | Sim |
| PATCH | `/companies/:id` | Sim |
| DELETE | `/companies/:id` | Sim |

### Projects (`/projects`)

| Método | Rota | Coberto |
|--------|------|---------|
| POST | `/projects` | Sim |
| GET | `/projects` | Sim |
| GET | `/projects/:id/participants` | Sim |
| POST | `/projects/:id/participants` | Sim |
| DELETE | `/projects/:id/participants/:userId` | Sim |
| GET | `/projects/:id` | Sim |
| PATCH | `/projects/:id` | Sim (incl. 403 participante) |
| DELETE | `/projects/:id` | Sim |

**Ainda sem E2E dedicado:** `POST .../participants` quando o utilizador já é participante (**400**), remoção com **403**, e outros erros de negócio.

### Project stages (`/project-stages`)

| Método | Rota | Coberto |
|--------|------|---------|
| POST | `/project-stages` | Sim |
| GET | `/project-stages` | Sim (lista global) |
| GET | `/project-stages/project/:id` | Sim |
| GET | `/project-stages/:id` | Sim |
| PATCH | `/project-stages/:id` | Sim |
| DELETE | `/project-stages/:id` | Sim |

### Tasks (`/tasks`)

| Método | Rota | Coberto |
|--------|------|---------|
| POST | `/tasks` | Sim |
| GET | `/tasks` | Sim |
| GET | `/tasks/stage/:stage` | Sim |
| GET | `/tasks/:taskId/timetrack` | Sim (+ 404) |
| POST | `/tasks/:taskId/timetrack/start` | Sim |
| PATCH | `/tasks/:taskId/timetrack/:id/stop` | Sim |
| PATCH | `/tasks/:taskId/timetrack/:id` | Sim (correção manual `end`) |
| DELETE | `/tasks/:taskId/timetrack/:id` | Sim |
| GET | `/tasks/:id` | Sim |
| PATCH | `/tasks/:id` | Sim |
| PATCH | `/tasks/nextStage/:id` | Sim |
| PATCH | `/tasks/previousStage/:id` | Sim |
| DELETE | `/tasks/:id` | Sim |

**Ainda sem E2E dedicado:** timetrack **403** (utilizador sem acesso ao projeto), **403** em stop/update/delete quando não é dono nem gestor; mover tarefa quando não há próxima/anterior (**400**).

### Subtasks (`/subtasks`)

| Método | Rota | Coberto |
|--------|------|---------|
| POST | `/subtasks` | Sim |
| GET | `/subtasks` | Sim |
| GET | `/subtasks/task/:taskId` | Sim |
| GET | `/subtasks/:id` | Sim |
| PATCH | `/subtasks/:id` | Sim |
| DELETE | `/subtasks/:id` | Sim |

### To-do (`/to-do`)

| Método | Rota | Coberto |
|--------|------|---------|
| POST | `/to-do` | Sim |
| GET | `/to-do` | Sim |
| GET | `/to-do/:id` | Sim |
| PATCH | `/to-do/end/:id` | Sim |
| PATCH | `/to-do/status/:id` | Sim (+ 422 enum) |
| PATCH | `/to-do/nextDateRecurring/:id` | Sim (tarefa `RECURRING`) |
| PUT | `/to-do/:id` | Sim |
| PATCH | `/to-do/:id` | Sim (soft delete) |

### WebSocket (não REST)

| Evento / fluxo | Coberto |
|----------------|---------|
| `joinTask` + emissão `timetrack:started` após HTTP start | Sim (`test/timetrack.gateway.e2e-spec.ts`) |

**Não coberto em E2E:** eventos `timetrack:stopped`, `timetrack:updated`, `timetrack:deleted` (poderiam acrescentar-se ouvindo o socket após stop/update/delete HTTP).

## Matriz por ficheiro de teste

| Ficheiro | Foco |
|----------|------|
| `test/app.e2e-spec.ts` | Health `/` |
| `test/auth.e2e-spec.ts` | Login, logout, forget-password, check-token, reset-password (validação) |
| `test/users.e2e-spec.ts` | CRUD utilizador, PUT, PATCH soft delete alheio, DELETE 403 |
| `test/companies.e2e-spec.ts` | CRUD empresas |
| `test/projects.e2e-spec.ts` | Projetos + participantes + permissões |
| `test/project-stages.e2e-spec.ts` | Colunas + GET global + 403 participante |
| `test/tasks.e2e-spec.ts` | Tarefas, timetrack completo, next/previous stage |
| `test/subtasks.e2e-spec.ts` | Subtarefas + GET lista e por id |
| `test/to-do.e2e-spec.ts` | To-do + recorrência `nextDateRecurring` |
| `test/timetrack.gateway.e2e-spec.ts` | Socket.IO `timetrack:started` |

## Correção aplicada durante os E2E

Em [`project-stages.service.ts`](../src/project-stages/project-stages.service.ts), `ForbiddenException` passou a ser re-lançada nos `catch` de `create` e `update` (antes virava 500).

## Export do `AuthModule`

[`auth.module.ts`](../src/auth/auth.module.ts) re-exporta `UsersModule` para o `AuthGuard` resolver `UsersService` em módulos que só importam `AuthModule`.

## Resumo

- **Todas as rotas REST listadas nos controllers** têm pelo menos um teste E2E que as exercita, exceto nuances puramente de erro de negócio (muitas combinações 400/403/404) e o fluxo feliz completo de **reset de senha** / **check-token** com token persistido (hoje exigiria expor o token de teste ou consultar a BD no teste).
- Para aumentar ainda mais a confiança: mais casos **403/400** em projetos/participantes/timetrack e asserções WebSocket para os outros eventos de timetrack.
