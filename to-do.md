# Task Hive – To-Do (finalização do projeto)

Baseado na **ANALISE-PROJETO.md**. Ordem: **primeiro correções**, depois **novas implementações**.

---

## Fase 1 – Correções (bugs e segurança)

### 1.1 Bugs críticos
- [x] **to-do.service:** Trocar `find` por `findOne` em `update`, `remove`, `endTask` e `changeTaskStatus`; corrigir verificação de "tarefa não encontrada" (array vazio é truthy).
- [x] **auth.service:** Em `resetPassword`, usar `await this.checkTokenResetPassword(token)`; no `findOne` de ForgetPassword, adicionar `relations: ['user']` para não quebrar em `fp.user.id`.
- [x] **auth.service:** Corrigir `expiresIn` do JWT em `forgetPassword` (usar `'24h'` ou segundos; não milissegundos como string).
- [x] **Entidades:** Remover `SnowflakeIdService` e `@BeforeInsert` que dependem dele das entidades Project, Task, TaskTimeTrak, ToDo, ProjectStage; manter geração de ID apenas nos services.
- [x] **User.entity:** Corrigir tipo da relação `taskTimeTrack` para `TaskTimeTrak[]` (hoje está como único).
- [x] **tasks.service:** Corrigir typo `poujectStagesService` → `projectStagesService`.

### 1.2 Segurança urgente
- [x] **Companies:** Adicionar `AuthGuard` nas rotas do `CompaniesController`; definir quem pode criar/editar/remover empresa (ex.: apenas autenticado, depois por role/dono).
- [x] **Remoção de usuário:** Na rota de delete de usuário, restringir a **ADMIN_GOD** (e considerar impedir auto-delete) **ou** trocar para soft delete; hoje qualquer autenticado pode hard delete qualquer usuário.

### 1.3 Ajustes de API e configuração
- [x] **projects.service (e outros):** Quando a API precisar devolver o recurso atualizado após `update`, usar `findOne` após o `update` ou `save` em vez de retornar apenas `UpdateResult`.
- [x] **Porta:** Unificar variável de porta (ex.: `APP_PORT`) e valor default (ex.: 3001) em `main.ts` e `configuration.ts`.
- [x] **postgresql.enums:** Remover ou documentar `TODO_TYPE_REPOSITORY` se não houver entidade/provider correspondente.
- [x] **Tratamento de erros:** Evitar `throw new Error('mensagem genérica')` nos services; usar exceções HTTP do Nest (`BadRequestException`, `NotFoundException`, etc.) para não perder contexto.
- [x] **Soft delete:** Garantir que consultas (`find`, `findOne`) não retornem registros com `deletedAt` preenchido onde for o caso, ou usar `@DeleteDateColumn` e `withDeleted` de forma consistente.

---

## Fase 2 – Arquitetura e qualidade (recomendado antes de crescer)

- [x] **Módulos:** Deixar de duplicar `userProviders`, `sessionProviders`, `AuthService`, `UsersService` em vários módulos; importar `AuthModule`/`UsersModule` (ou criar módulo compartilhado) para evitar múltiplas instâncias.
- [ ] **TypeORM:** Migrar para `TypeOrmModule.forRoot()` e `TypeOrmModule.forFeature()` em vez de `DataSource` manual e repository providers manuais.
- [x] **Produção:** `synchronize` controlado por variável de ambiente: `NODE_ENV !== 'production'` (em produção usar `NODE_ENV=production` para desativar sync). Migrations do TypeORM ficam para quando for a produção de fato.
- [x] **Swagger:** Enriquecer controllers com `@ApiTags`, `@ApiBearerAuth()`, tags no DocumentBuilder e `addBearerAuth()`.
- [x] **Testes:** Jest com `moduleNameMapper` para alias `src/*`; specs ainda precisam de mocks dos repositórios (priorizar auth, to-do e projetos quando for corrigir).
- [x] **DTOs:** Revisar validação com `class-validator` em todos os DTOs de create/update (já utilizam IsString, IsEmail, IsOptional, etc.).

---

## Fase 3 – Níveis de usuário e permissionamento

- [x] **Modelo:** Adicionar campo `role` em `User` (enum `ADMIN_GOD`, `ADMIN_COLLABORATOR`, `CLIENT`) e incluir no payload do JWT e na sessão.
- [x] **Guards:** Implementar `RolesGuard` e decorator `@Roles()` para rotas que exijam role (ex.: futuro hard delete só ADMIN_GOD).
- [x] **Helpers:** Helpers de permissão em `project-permissions.helper.ts`: `isProjectOwner`, `isProjectParticipant`, `canAccessProject`, `canManageProject`, `isTaskOwner`, `canMoveOrRemoveTask`.
- [x] **Projetos:** Em `update` e `remove`, exigir `canManageProject` (dono ou admin); em `findAll`, filtrar por dono ou participante.
- [x] **Project-stages:** Em `create`, `update` e `remove`, verificar `canManageProject` no projeto; `user` repassado do controller para o service.
- [x] **Tarefas:** `create` só se `canAccessProject`; `update`: dono/admin podem tudo (inclusive stageId), participante só nome/descrição/finishDate; `toNextStage`/`toPreviousStage` e `remove` só `canMoveOrRemoveTask` (dono ou admin).
- [x] **Hard delete:** Soft delete mantido como padrão; quando houver endpoint de remoção definitiva, usar `@Roles(UserRole.ADMIN_GOD)`.

---

## Fase 4 – Participantes e acesso ao projeto

- [x] **CRUD de participantes:** Implementar adicionar/remover/listar participantes do projeto (`Project.participants`); endpoints no módulo de projetos (ou dedicado).
- [x] **Regras:** Usar "dono ou participante" em todas as verificações de "tem acesso ao projeto?" (projetos, stages, tarefas).
- [ ] **(Opcional) Sistema de amizades:** Entidade `UserFriendship` e provider existem; implementar módulo/serviço/controller se fizer parte do escopo (ex.: convite para participar por amizade).

---

## Fase 5 – Novas funcionalidades do produto

### Módulo de projetos
- [x] **Sistema de timetrack:** CRUD e endpoints para `TaskTimeTrak`; regras de negócio (quem pode registrar, início/fim, etc.).
- [x] **WebSocket:** Atualizações em tempo real do timetrack (gateway e integração com o serviço de timetrack).

### Tarefas avulsas (to-do)
- [ ] **Cronjobs:** Implementar agendamento (ex.: `@nestjs/schedule`); o cron roda no horário, a execução das tarefas pode ser delegada ao Kafka.
- [ ] **Kafka:** Para envio de notificações, envio de emails e execução das lógicas dos cronjobs.
- [ ] **Notificações e emails:** Implementar disparo nos pontos já marcados no código:
  - to-do.service: `create`, `endTask`
  - auth.service: `forgetPassword`, `resetPassword`

### Empresa (futuro / quando for prioridade)
- [ ] **Relação User–Company:** Dono da empresa (ex.: `Company.ownerId` ou tabela CompanyMember com role OWNER/MEMBER).
- [ ] **Permissionamento:** Rotas de Company com auth e regra "só dono (ou admin) pode editar/remover empresa".
- [ ] **Colaboradores da empresa:** Entidade ou lista de membros/colaboradores vinculados à empresa.
- [ ] **Projetos da empresa:** Dono da empresa (ou admin da empresa) pode adicionar colaboradores aos projetos (`Project.participants`); opcionalmente restringir participantes a colaboradores da empresa quando o projeto tiver `companyOwner`.
- [ ] **Sessão por empresa / CEO:** A definir (se haverá contexto "logado como empresa" ou usuário CEO).

---

## Locais com disparo de notificações/emails (para implementação na Fase 5)

- to-do.service: `create`, `endTask`
- auth.service: `forgetPassword`, `resetPassword`

---

## Feito

- CRUD de projetos, project stages (colunas), tarefas, subtarefas
- CRUD de company (sem auth nas rotas até correção)
- CRUD do módulo de tarefas avulsas (to-do)
- Controle de sessão (login/logout, sessão por token)
- Módulo de autenticação (login, forget/reset password)
- CRUD de usuários
- Base do banco de dados (entidades e repositórios)
