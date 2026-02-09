# Análise do Projeto Task Hive

Este documento consolida a análise do backend (NestJS), o cruzamento com o `to-do.md`, o que está implementado, o que falta, bugs encontrados, más práticas e melhorias recomendadas.

---

## 1. Visão geral

- **Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, JWT, Swagger, Docker.
- **Contexto:** Primeiro projeto NestJS do autor; há soluções improvisadas, principalmente em módulos/DI e uso de TypeORM.

---

## 2. Cruzamento com o to-do.md

### 2.1 Por fazer (resumo)

| Item | Estado | Observação |
|------|--------|------------|
| Sistema de timetrack (projetos) | Não implementado | Entidade `TaskTimeTrak` e provider existem; não há CRUD/endpoints de timetrack nem regras de negócio. |
| CRUD de membros de projeto | Não implementado | `Project.participants` (ManyToMany) existe na entidade; sem serviço/controller. |
| Sistema de amizades | Parcial | Entidade `UserFriendship` e provider existem; sem módulo/serviço/controller. |
| WebSocket para timetrack | Não implementado | Nenhum gateway ou WebSocket no projeto. |
| Lógica de participantes de projetos | Não implementado | Sem regras de quem pode ver/editar por projeto. |
| Cronjobs (tarefas avulsas) | Não implementado | Sem `@nestjs/schedule` ou jobs. |
| Kafka (notificações, emails, cronjobs) | Não implementado | Sem dependência ou uso de Kafka. |
| Usuário/Empresa (dona do projeto, linkar membros) | Parcial | Projeto tem `companyOwner`; sem “empresa como dona”, linkar membros ou permissões. |
| Sessão por empresa / CEO | Não definido | A definir. |
| Permissionamento rotas empresa | Não implementado | Rotas de Companies **sem** `AuthGuard` (veja seção 4). |
| Disparo de notificações e emails | Não implementado | Comentários no código (“disparar notificação”) em to-do.service (create, endTask), auth.service (forgetPassword, resetPassword); sem serviço de notificação/email. |

### 2.2 Feito (confirmado)

- CRUD de projetos, project stages, tarefas, subtarefas.
- CRUD de company (sem auth nas rotas).
- CRUD de to-do (tarefas avulsas).
- Controle de sessão (login/logout, sessão por token).
- Módulo de autenticação (login, forget/reset password).
- CRUD de usuários.
- Base do banco (entidades e repositórios via providers manuais).

---

## 3. Arquitetura e dependências (problemas atuais)

### 3.1 Duplicação de providers e serviços (evitando “dependência circular”)

Vários módulos **não importam** `AuthModule` ou `UsersModule`; em vez disso, redeclaram os mesmos providers e serviços:

- **Repetidos em vários módulos:** `userProviders`, `sessionProviders`, `forgetPasswordProviders`, `AuthService`, `UsersService`.
- **Módulos afetados:** ProjectsModule, TasksModule, ToDoModule, ProjectStagesModule, SubtasksModule, UsersModule, AuthModule.

Problemas:

- Múltiplas instâncias de `AuthService` e `UsersService` (uma por módulo que os declara).
- Qualquer alteração em providers (ex.: sessão) precisa ser replicada em vários módulos.
- Dificulta manutenção e aumenta risco de inconsistência.

Recomendação: criar um **módulo compartilhado** (ex.: `AuthPersistenceModule` ou similar) que declare e exporte apenas os providers de repositório/sessão/usuário necessários ao auth, e fazer `AuthModule` e `UsersModule` importarem esse módulo. Os demais módulos devem **importar** `AuthModule` (e, se necessário, `UsersModule`) e **não** redeclarar `AuthService`/`UsersService`/repositórios. Se surgir dependência circular, usar `forwardRef()` ou extrair apenas a interface necessária em um módulo compartilhado.

### 3.2 Uso de TypeORM fora do padrão NestJS

- Não é usado `TypeOrmModule` do `@nestjs/typeorm`.
- Foi criado um `DataSource` manual em `database.providers.ts` e cada repositório é registrado como provider com `getRepository(Entity)`.
- `DatabaseModule` exporta só o `DATA_SOURCE`; cada módulo de domínio declara seus próprios repository providers.

Problemas:

- Muito boilerplate e repetição.
- Migrations e integração com o ecossistema NestJS/TypeORM ficam mais manuais.
- Dificulta uso de transações e múltiplos data sources de forma idiomática.

Recomendação: migrar para `TypeOrmModule.forRoot()` no `AppModule` e `TypeOrmModule.forFeature([...])` nos módulos de domínio; manter os tokens/repositórios customizados só se houver necessidade real (ex.: testes).

### 3.3 AuthGuard e módulos

O `AuthGuard` depende de `AuthService` e `UsersService`. Como esses serviços são redeclarados em vários módulos, o guard pode estar usando uma instância diferente da que criou a sessão. Ao centralizar Auth/Users em módulos exportados e importados, o guard deve usar a mesma instância do `AuthService` que valida o token.

---

## 4. Segurança

### 4.1 Rotas de Companies sem autenticação

O `CompaniesController` **não** usa `@UseGuards(AuthGuard)`. Qualquer um pode:

- Criar, listar, atualizar e remover empresas.

Isso está alinhado ao to-do (“Permissionamento nas rotas da empresa, elas estão liberadas”), mas é um **risco em produção**. É prioritário definir e implementar autenticação e permissões (por exemplo, apenas usuários autenticados e, no futuro, por papel/empresa).

### 4.2 Projetos sem filtro por usuário

`ProjectsService.findAll()` retorna **todos** os projetos do banco, sem filtrar por dono ou participante. Qualquer usuário autenticado vê projetos de todos. Recomendação: filtrar por `userOwner` e/ou por `participants` quando a lógica de participantes estiver implementada.

---

## 5. Bugs e correções necessárias

### 5.1 to-do.service – uso de `find` em vez de `findOne`

Nos métodos `update`, `remove`, `endTask` e `changeTaskStatus`:

- É usado `this.toDoRepository.find({ where: { id: String(id) } })`, que retorna **array**.
- Em seguida usa-se `if (!todo)`, mas um array vazio é truthy em JavaScript, então a verificação não funciona como “tarefa não encontrada”.
- O tipo correto para “uma tarefa” é `findOne`.

**Correção:** trocar `find` por `findOne` e ajustar a variável (ex.: `const todo = await this.toDoRepository.findOne(...)`). Garantir que `findOne` inclua `relations`/`where` necessários quando for usar `todo` depois.

### 5.2 auth.service – resetPassword e checkTokenResetPassword

- `checkTokenResetPassword` é **async**, mas em `resetPassword` é chamada sem `await`:  
  `const check = this.checkTokenResetPassword(token)`.  
  Assim, `check` é uma `Promise`, não um booleano, e `if (!check)` não valida o token corretamente.
- Em `resetPassword`, o `findOne` em `forgetPasswordRepository` não carrega a relação `user`. Depois usa-se `fp.user.id`, o que pode gerar erro se `fp.user` for `undefined`.

**Correção:**

- Em `resetPassword`: usar `const check = await this.checkTokenResetPassword(token)`.
- No `findOne` de `ForgetPassword`, adicionar `relations: ['user']` (ou o nome correto da relação na entidade).

### 5.3 auth.service – forgetPassword e expiresIn do JWT

O token de “esqueci minha senha” é criado com:

```ts
expiresIn: expiresIn.getTime().toString()
```

`getTime()` retorna **milissegundos**; a opção `expiresIn` do JWT espera segundos (número) ou string no formato aceito (ex.: `'24h'`, `'1d'`). Passar milissegundos como string pode gerar comportamento incorreto de expiração.

**Correção:** usar, por exemplo, `expiresIn: '24h'` ou `expiresIn: 86400` (segundos), e manter `expiresAt` na entidade `ForgetPassword` para controle no banco se necessário.

### 5.4 Entidades TypeORM com injeção de serviço (SnowflakeIdService)

As entidades **Project**, **Task**, **TaskTimeTrak**, **ToDo**, **ProjectStage** têm:

- Construtor com `private snowflakeIdService: SnowflakeIdService`.
- `@BeforeInsert()` chamando `this.snowflakeIdService.generateId()`.

Problemas:

- TypeORM instancia entidades ao carregar do banco (ex.: `find`, `findOne`). Não usa o container de DI do NestJS, então `snowflakeIdService` será `undefined` e pode causar erro em `@BeforeInsert` em alguns fluxos.
- Os IDs já estão sendo definidos nos **services** (ex.: `projects.service.ts`, `to-do.service.ts`) antes do `save`. O `@BeforeInsert` nas entidades fica redundante e acoplado a um serviço.

**Correção:** remover `SnowflakeIdService` (e qualquer outro serviço) das entidades. Manter a geração de ID apenas nos services e passar o `id` no objeto salvo (como já é feito em vários lugares). Remover `@BeforeInsert` que depende de serviço.

### 5.5 User.entity – tipo da relação taskTimeTrack

Na entidade `User`, a relação com `TaskTimeTrak` está declarada como:

```ts
taskTimeTrack: TaskTimeTrak   // deveria ser array
```

É `OneToMany` → um usuário tem **vários** registros de timetrack. O tipo correto é `TaskTimeTrak[]`.

### 5.6 tasks.service – typo no nome do serviço

O `ProjectStagesService` está injetado como `poujectStagesService` (typo). Corrigir para `projectStagesService` (ou o nome que for usado no restante do código).

### 5.7 projects.service – update retorno

`projects.service.update()` usa `this.projectsRepository.update(...)`, que retorna um `UpdateResult`, não o projeto atualizado. Se a API precisar devolver o projeto atualizado, usar `save` após carregar o projeto ou `findOne` após o `update`. O mesmo padrão pode ser revisado em outros services que retornam resultado de `update`.

---

## 6. Configuração e ambiente

### 6.1 synchronize: true

Em `database.providers.ts` está `synchronize: true`. Em produção isso pode alterar o schema automaticamente e causar perda de dados. Recomendação: usar `synchronize: false` em produção e passar a usar **migrations** do TypeORM.

### 6.2 Porta da aplicação

- `main.ts` usa `process.env.APP_PORT || 3001`.
- `configuration.ts` expõe `port: process.env.PORT || 3000`.

Há inconsistência (PORT vs APP_PORT e 3000 vs 3001). Vale unificar variável e valor default (ex.: `APP_PORT` e 3001 em todo o projeto).

### 6.3 Token não utilizado

Em `postgresql.enums.ts` existe `TODO_TYPE_REPOSITORY`; não há provider nem entidade correspondente. Pode ser removido ou implementado quando houver tipo de to-do separado.

---

## 7. Melhorias gerais

### 7.1 Tratamento de erros

Vários services usam `try/catch` com `console.log(error)` e depois `throw new Error('mensagem genérica')`. Isso perde o tipo e o detalhe do erro (ex.: `BadRequestException`). Recomendação: deixar exceções do NestJS propagarem ou mapear para exceções HTTP adequadas (ex.: `BadRequestException`, `NotFoundException`) sem trocar por `Error` genérico.

### 7.2 Validação e DTOs

Há uso de `class-validator` e `ValidationPipe` no `main.ts`. Vale revisar todos os DTOs (create/update) para garantir que propriedades obrigatórias e formatos estejam com decorators de validação e que os tipos estejam alinhados com as entidades (ex.: `id` como string quando for bigint no banco).

### 7.3 Testes

Existem arquivos `*.spec.ts` (controllers e services), mas a análise não verificou se os testes estão passando ou cobrindo os fluxos críticos. Recomendação: rodar a suíte de testes, corrigir falhas e priorizar testes para auth, to-do e projetos.

### 7.4 Documentação Swagger

O Swagger está configurado em `main.ts`. Os controllers podem ser enriquecidos com decorators do `@nestjs/swagger` (ex.: `@ApiTags`, `@ApiBearerAuth()`, `@ApiBody`, respostas) para refletir autenticação e payloads, principalmente onde há guard de auth.

### 7.5 Soft delete

Várias entidades usam `deletedAt` e o “remove” faz apenas `update(..., { deletedAt: new Date() })`. As consultas (ex.: `find`, `findOne`) precisam garantir que filtrem `deletedAt: IsNull()` onde for o caso, ou usar o recurso de soft delete do TypeORM (`@DeleteDateColumn` e `withDeleted`) de forma consistente para não retornar registros “deletados”.

---

## 8. Resumo de prioridades

| Prioridade | Item | Tipo |
|------------|------|------|
| Alta | Rotas de Companies sem auth | Segurança |
| Alta | Remoção de usuário (hard delete) sem checagem de role – qualquer um pode deletar qualquer usuário | Segurança |
| Alta | to-do.service: find → findOne e verificação de “não encontrado” | Bug |
| Alta | auth.service: await checkTokenResetPassword + relations em resetPassword | Bug |
| Alta | auth.service: expiresIn do JWT em forgetPassword | Bug |
| Alta | Remover SnowflakeIdService (e @BeforeInsert) das entidades | Bug/design |
| Alta | Implementar níveis de usuário (admin god, colaborador, cliente) e permissionamento (seção 10) | Funcionalidade |
| Média | Projetos: verificar dono/participante em update/remove; filtrar findAll | Segurança/lógica |
| Média | Project-stages: restringir create/update/remove a dono do projeto (ou admin) | Segurança/lógica |
| Média | Tarefas: permitir “participante” editar nome/descrição sem mover status nem remover | Funcionalidade |
| Média | User.entity: taskTimeTrack como array | Bug |
| Média | Refatorar módulos: evitar duplicar Auth/Users providers e serviços | Arquitetura |
| Média | Migrar para TypeOrmModule (forRoot/forFeature) | Arquitetura |
| Média | synchronize: false em produção + migrations | Config |
| Baixa | Typo poujectStagesService | Código |
| Baixa | Retorno de update em projects.service (e outros) | API |
| Baixa | Tratamento de erros e Swagger | Qualidade |
| Futuro | Empresa: dono (User–Company), colaboradores, “adicionar colaboradores aos projetos” (seção 10.2.7) | Funcionalidade |

---

## 10. Análise de níveis de usuário e permissionamento

Esta seção verifica o que existe hoje em relação a níveis de usuário (admin, colaborador, cliente) e às regras de permissão desejadas, e aponta lacunas, erros e melhorias.

### 10.1 Requisitos desejados (resumo)

| Nível | Regra |
|-------|--------|
| **Admin (god mode)** | Pode fazer tudo, inclusive remoção real (hard delete). |
| **Admin (colaborador)** | Quase tudo, com foco em auxiliar; **não** pode remover dados livremente (apenas soft delete; hard delete restrito). |
| **Cliente – próprio** | Nos seus projetos e tarefas: CRUD normal. |
| **Cliente – projeto de outro** | Apenas **busca** (leitura) e **criação de tarefa**; não pode alterar nome do projeto nem remover nada. |
| **Cliente – tarefa de outro** | Pode alterar nome, adicionar descrição etc.; **não** pode mudar status (mover coluna do kanban) nem remover. |

### 10.2 Estado atual no código

#### 10.2.1 Níveis de usuário

- **Não existe** nenhum conceito de nível ou role no modelo de usuário.
- A entidade `User` **não** possui campo `role`, `level` ou equivalente (apenas id, name, email, password, avatar, timestamps).
- O JWT usa apenas `audience` (LOGIN, FORGET_PASSWORD), não role/nível.
- O `AuthGuard` só verifica token e sessão; não considera papel do usuário.

**Conclusão:** Toda a lógica de admin (god vs colaborador) e de cliente (próprio vs outros) **ainda precisa ser implementada** do zero.

#### 10.2.2 Projetos

| Ação | Implementado? | Comportamento atual |
|------|----------------|---------------------|
| Create | Sim | Qualquer usuário autenticado cria e vira `userOwner`. |
| FindAll | Sim | Retorna **todos** os projetos; sem filtro por dono/participante. |
| FindOne | Sim | Qualquer autenticado pode buscar **qualquer** projeto por id. |
| Update | Sim | **Nenhuma** verificação de dono/participante; qualquer um pode alterar nome/descrição. |
| Remove (soft) | Sim | **Nenhuma** verificação; qualquer um pode “remover” (soft delete) qualquer projeto. |

- Não há distinção entre “meu projeto” e “projeto de outro”.
- A entidade tem `participants: User[]`, mas não há CRUD de participantes nem uso dessa lista nas regras de permissão.

**Problemas:** Qualquer cliente pode editar e dar soft delete em projeto alheio. Não atende ao requisito “para projetos de outros: apenas busca e criação de tarefa”.

#### 10.2.3 Colunas do projeto (project-stages)

| Ação | Implementado? | Comportamento atual |
|------|----------------|---------------------|
| Create / Update / Remove / FindAll / FindOne | Sim | **Nenhuma** verificação de dono do projeto ou participante. Qualquer autenticado pode criar, alterar e remover colunas de **qualquer** projeto. |

**Problemas:** Colunas são recurso do projeto; o esperado seria que apenas dono (ou admin) pudesse criar/editar/remover colunas. Hoje está totalmente aberto.

#### 10.2.4 Tarefas

| Ação | Implementado? | Comportamento atual |
|------|----------------|---------------------|
| Create | Sim | Qualquer autenticado pode criar tarefa em **qualquer** stage; a tarefa fica com `user` = quem criou. Não verifica se o usuário é dono/participante do projeto. |
| FindAll | Sim | Filtra por `task.user.id === user.id` → só “minhas” tarefas. |
| FindOne | Sim | **Sem** filtro; qualquer autenticado pode ler qualquer tarefa. |
| FindByStage | Sim | Retorna todas as tarefas da stage; **sem** verificação de projeto/participante. |
| Update | Sim | Só permite se `task.user.id === user.id`. Quem não é dono **não** pode alterar nada (nem nome, nem descrição). |
| toNextStage / toPreviousStage | Sim | Só permite se `task.user.id === user.id`. |
| Remove (soft) | Sim | Só permite se `task.user.id === user.id`. |

**Problemas:**

- O requisito para **tarefa de outro** é: pode alterar nome, descrição etc., mas **não** pode mudar status (coluna) nem remover. Hoje a regra é “tudo ou nada”: ou é dono (pode tudo) ou não é (não pode nada). Falta um modo intermediário “participante/colaborador da tarefa” que possa editar campos mas não mover nem remover.
- Create: não há checagem se o usuário tem permissão no projeto (dono ou participante) para criar tarefa naquele stage.
- FindOne / FindByStage: qualquer um pode ler qualquer tarefa; do ponto de vista de “projeto de outro: apenas busca” está permitido em excesso (busca de tarefas de qualquer projeto), mas a leitura em si não está restrita – pode ser aceitável se depois filtrar por “projetos que tenho acesso”.

#### 10.2.5 Subtarefas

| Ação | Implementado? | Comportamento atual |
|------|----------------|---------------------|
| Create | Sim | Qualquer autenticado pode criar subtarefa em qualquer tarefa; `responsible` = usuário atual. |
| Update / Remove | Sim | Apenas o `responsible` da subtarefa pode alterar/remover. |

- Não há noção de “dono da tarefa” vs “responsável da subtarefa” em relação a níveis (admin/cliente). Para cliente em tarefa de outro, faria sentido poder criar/editar subtarefas em que é responsável, sem poder remover a tarefa – hoje remove é só do responsável da subtarefa, o que está alinhado com “não remover tarefa de outro”.

#### 10.2.6 Remoção real (hard delete)

- Na maior parte do sistema só existe **soft delete** (`update(..., { deletedAt: new Date() })`).
- **Hard delete** aparece apenas em:
  - **Users:** `users.service.remove()` usa `this.userRepository.delete(id)` → qualquer usuário autenticado que chegue na rota pode deletar **qualquer** usuário do sistema (incluindo a si mesmo ou outro usuário). Não há role nem checagem de “sou admin”.
  - **Auth:** `sessionRepository.delete()` no logout (apagar sessão), que é comportamento esperado.

**Problemas:** (1) Não existe o conceito de “apenas admin pode hard delete”; (2) a rota de remoção de usuário está crítica: hoje qualquer um pode hard delete qualquer usuário.

#### 10.2.7 Empresa e colaboradores em projetos

Cenário desejado (plano futuro): um usuário que **possui uma empresa** pode adicionar **colaboradores** aos projetos dessa empresa.

| Aspecto | Implementado? | Estado atual |
|---------|----------------|--------------|
| Dono da empresa (User ↔ Company) | **Não** | A entidade `Company` tem apenas `id`, `name` e `projects`. Não existe relação com `User` (nenhum campo owner, CEO, members, etc.). Qualquer um pode criar empresa (rotas sem auth) e não há “minha empresa”. |
| Empresa com colaboradores/funcionários | **Não** | Não existe entidade ou tabela de “membro da empresa” nem lista de usuários vinculados à empresa. |
| Dono da empresa adiciona colaboradores ao projeto | **Não** | Não há dono de empresa; não há lista de colaboradores da empresa; não há fluxo “adicionar usuário X como participante do projeto” por parte da empresa. |
| Uso de `companyOwner` no projeto | Parcial | O projeto pode ter `companyOwner` (Company) opcional. No create do projeto aceita-se `companyOwnerId` e grava-se a empresa no projeto. Nenhuma regra de permissão usa isso (quem pode criar projeto “em nome” da empresa, quem pode editar projetos da empresa, etc.). |

**Conclusão:** Não há implementação do fluxo “usuário com empresa adiciona colaboradores aos projetos”. Era plano futuro; o modelo atual só permite: (1) projeto com dono pessoa (`userOwner`) e/ou dono empresa (`companyOwner`), e (2) lista genérica de `participants` no projeto, sem CRUD e sem vínculo com a empresa. Para implementar o cenário desejado, será necessário definir relação User–Company (ex.: dono/CEO, membros/colaboradores), quem pode “adicionar colaborador ao projeto” (ex.: dono do projeto ou dono da empresa) e como isso popula `Project.participants` (e eventualmente um papel “colaborador da empresa” em projetos da empresa).

### 10.3 Lacunas e erros (resumo)

1. **Nenhum nível de usuário** – Não há role (admin god, admin colaborador, cliente); não há como aplicar regras diferentes por tipo de usuário.
2. **Projetos** – Sem checagem de dono/participante em update/remove; findAll retorna tudo; não há “apenas leitura + criar tarefa” para projeto de outro.
3. **Project-stages** – Sem permissão; qualquer um pode criar/editar/remover colunas de qualquer projeto.
4. **Tarefas** – Regra binária (dono pode tudo, não-dono não pode nada); falta o caso “participante pode editar campos mas não mover nem remover”.
5. **Hard delete** – Único hard delete (usuário) está sem proteção por role; não existe distinção “colaborador não pode hard delete”.
6. **Participantes** – `Project.participants` existe na entidade mas não é usado em nenhuma regra nem tem CRUD; sem isso não dá para definir “projeto de outro” (acesso como participante vs estranho).
7. **Empresa e colaboradores** – Não há dono da empresa (User–Company), nem membros/colaboradores da empresa, nem fluxo de “empresa adiciona colaboradores aos projetos”. O campo `companyOwner` no projeto existe mas não é usado em permissões.

### 10.4 Melhorias e implementação sugerida

- **Modelo de usuário**
  - Adicionar enum de role, por exemplo: `ADMIN_GOD`, `ADMIN_COLLABORATOR`, `CLIENT`.
  - Campo em `User`: `role: UserRole` (ou equivalente).
  - Incluir `role` no payload do JWT (e no `session.user` se necessário) para uso em guards e services.

- **Guards e serviços**
  - Guard de **role** (ex.: `RolesGuard`) que verifica se `request.user.role` está em uma lista permitida para a rota (ex.: apenas ADMIN_GOD em rotas de hard delete).
  - Serviço ou helpers de **permissão por recurso**:
    - “É dono do projeto?” (project.userOwner.id === user.id).
    - “É participante do projeto?” (project.participants inclui user – após implementar CRUD de participantes).
    - “É dono da tarefa?” (task.user.id === user.id).
    - “Tem acesso ao projeto?” (dono ou participante).
  - Em **projects.service**: em update/remove, exigir que o usuário seja dono (ou participante, conforme regra) ou admin; em findAll, filtrar por projetos em que o usuário é dono ou participante.
  - Em **project-stages.service**: em create/update/remove, verificar se o usuário é dono do projeto (ou admin); repassar `user` do controller para o service.
  - Em **tasks.service**:
    - Create: permitir se o usuário tem acesso ao projeto da stage (dono ou participante).
    - FindOne / FindByStage: opcionalmente filtrar por “projetos com acesso” (evitar vazamento de dados de projetos alheios sem permissão).
    - Update:  
      - Se for **dono** da tarefa: permitir tudo (incluindo `stageId` / mudar coluna).  
      - Se for **cliente com acesso ao projeto mas não dono** da tarefa: permitir apenas atualização de nome, descrição, finishDate; **bloquear** alteração de `stage` (e endpoints toNextStage/toPreviousStage).  
    - Remove: permitir apenas dono da tarefa (ou admin); cliente em “tarefa de outro” não pode remover.

- **Hard delete**
  - Manter soft delete como padrão nas rotas atuais de “remove” (projeto, stage, tarefa, subtask, etc.).
  - Se/quando existir endpoint de “remoção definitiva” (hard delete), restringir a **ADMIN_GOD** (e documentar que colaborador não pode).
  - **Urgente:** na rota de **remover usuário**, ou exige-se ADMIN_GOD (e talvez impede auto-delete) ou troca para soft delete; hoje está inseguro.

- **Participantes**
  - Implementar CRUD de membros/participantes do projeto (como no to-do) e popular `Project.participants`.
  - Usar “dono ou participante” em todas as regras de “acesso ao projeto”.

- **Empresa e colaboradores (futuro)**
  - Definir relação **User–Company**: ex. `Company` com `ownerId` (User) ou tabela de papéis (CompanyMember: company, user, role = OWNER | MEMBER).
  - Se fizer sentido “colaboradores da empresa”: entidade ou lista de usuários vinculados à empresa (ex. CompanyMember com role COLLABORATOR).
  - Regra “quem pode adicionar participante ao projeto”: dono do projeto (`userOwner`) ou, quando o projeto tiver `companyOwner`, dono/admin da empresa. Ao adicionar, incluir usuário em `Project.participants` (e opcionalmente restringir a “colaboradores da empresa” quando o projeto for da empresa).
  - Proteger rotas de Company (auth +, se aplicável, “só dono da empresa pode editar/remover empresa”).
  - Com isso, o cenário “usuário com empresa adiciona colaboradores aos seus projetos” fica coberto sem conflitar com níveis de usuário (admin/cliente): o role continua no User; o “pode gerenciar projetos da empresa X” é permissão por recurso (vínculo User–Company e Project.companyOwner).

### 10.5 Sugestões de features relacionadas

- **Auditoria:** Registrar em log (ou tabela) quem fez alteração em projeto/tarefa (role + userId), especialmente movimentação de status e remoções. Ajuda em “quem moveu a tarefa” e alinha com perfil de colaborador.
- **Permissões por coluna:** No futuro, permitir que o dono do projeto defina, por coluna, quem pode mover tarefas (ex.: apenas dono da tarefa, ou qualquer participante). Isso complementa o “cliente não pode mudar status em tarefa de outro”.
- **Convite por link/email:** Para projetos de outros, o fluxo “convite para participar” (por link ou email) define quem vira participante e ganha “busca + criar tarefa” e “editar campos da tarefa sem mover/remover”.
- **Admin “impersonate”:** Em ambiente suporte, admin god poder “entrar como” outro usuário (sessão temporária) para reproduzir problema; exige log e auditoria.
- **Empresa e projetos:** Quando existir dono da empresa e colaboradores, permitir que o dono (ou um “admin da empresa”) veja todos os projetos da empresa e gerencie participantes; opcionalmente, projetos com `companyOwner` podem herdar “quem pode adicionar participante” da lista de colaboradores da empresa (ex.: só colaboradores da empresa podem ser adicionados como participantes do projeto).

---

## 9. Próximos passos sugeridos (além do to-do)

1. Corrigir os bugs listados na seção 5 (to-do, auth, entidades, User.entity, typo).
2. Proteger rotas de Companies com AuthGuard e definir política de permissões.
3. **Níveis de usuário (seção 10):** adicionar role em `User` e no JWT; implementar `RolesGuard` e regras por recurso (dono/participante); proteger hard delete (ex.: remoção de usuário) para admin god; aplicar em projetos, project-stages e tarefas conforme tabelas da seção 10.
4. Implementar CRUD de participantes do projeto e usar em todas as regras de “acesso ao projeto”.
5. Refatorar módulos (Auth/Users compartilhados) e migrar para TypeOrmModule.
6. Implementar filtro de projetos por dono/participante.
7. Desligar `synchronize` em produção e criar migrations.
8. Em seguida, implementar itens do to-do: timetrack, membros, amizades, WebSocket, cronjobs, Kafka, notificações e emails, lógica empresa/participantes.
9. **Empresa e colaboradores (quando for prioridade):** relação User–Company (dono/membros), CRUD de colaboradores da empresa e “dono da empresa adiciona colaboradores aos projetos” (seção 10.2.7 e 10.4).

Esta análise pode ser usada como checklist de correções e como base para planejamento das próximas sprints.
