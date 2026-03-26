# Migrations e baseline

## Regra geral

- O TypeORM **`synchronize` está desligado** na aplicação. Não reactivar.
- Alterações ao modelo: criar migration com `npm run typeorm -- migration:generate src/migrations/DescricaoDaAlteracao` (com a BD apontada no `.env` a refletir o estado *antes* da alteração, para o TypeORM calcular o diff).
- Em deploy, as migrations pendentes são aplicadas automaticamente ao iniciar a API (`migrationsRun: true`).

## Base de dados que já existia (ex.: criada com `synchronize`)

A migration inicial `InitialSchema1732600000000` é **idempotente** (`CREATE TABLE IF NOT EXISTS`, enums e FKs com tolerância a duplicados). Podes correr `npm run typeorm -- migration:run` mesmo que as tabelas já existam: o TypeORM regista a migration na tabela **`migrations`** e as **próximas** migrations passam a correr normalmente.

**Baseline manual (INSERT na `migrations`)** só é necessário em cenários raros em que preferes não executar o `up` da inicial (por exemplo BD muito customizada). O TypeORM 0.3 usa por defeito a tabela **`migrations`**:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%migrat%';
```

```sql
INSERT INTO "migrations" ("timestamp", "name")
VALUES (1732600000000, 'InitialSchema1732600000000');
```

## Migrations seguintes

Novas alterações ao modelo devem ser **migrations normais** (add column, alter type, etc.), geradas com `migration:generate` ou escritas à mão. **Não** é boa prática tornar todas as migrations “if not exists”: isso esconde divergências entre ambientes. A inicial é excepção para compatibilizar quem veio do `synchronize`.

## Testes E2E

A BD E2E pode estar vazia ou já com schema: a migration inicial é idempotente. Se algo correr mal, podes repor a BD com:

```bash
docker-compose -f docker-compose.e2e.yml down -v
docker-compose -f docker-compose.e2e.yml up -d
```

ou apaga só o schema público no contentor Postgres E2E antes de correr `npm run test:e2e`.

## Variável obsoleta `DB_SYNCHRONIZE`

Se `DB_SYNCHRONIZE=true` estiver no ambiente, a app regista um aviso e **ignora** o valor; o schema não é sincronizado automaticamente.
