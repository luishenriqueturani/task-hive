# Migrations e baseline

## Regra geral

- O TypeORM **`synchronize` está desligado** na aplicação. Não reactivar.
- Alterações ao modelo: criar migration com `npm run typeorm -- migration:generate src/migrations/DescricaoDaAlteracao` (com a BD apontada no `.env` a refletir o estado *antes* da alteração, para o TypeORM calcular o diff).
- Em deploy, as migrations pendentes são aplicadas automaticamente ao iniciar a API (`migrationsRun: true`).

## Base de dados que já existia (ex.: criada com `synchronize`)

Se o Postgres **já tem todas as tabelas** alinhadas com a migration inicial `InitialSchema1732600000000` mas a tabela `typeorm_migrations` está vazia, **não** corras `migration:run` sem mais nem menos: o `CREATE TABLE` falharia.

Faz *baseline* **uma vez**, registando a migration como já aplicada sem executar o SQL:

```sql
INSERT INTO "typeorm_migrations" ("timestamp", "name")
VALUES (1732600000000, 'InitialSchema1732600000000');
```

Confirma que o nome na coluna `name` coincide **exactamente** com a propriedade `name` da classe em `src/migrations/1732600000000-InitialSchema.ts`.

## Testes E2E

A BD do `docker-compose.e2e.yml` deve estar vazia (ou só com `typeorm_migrations` coerente) para a primeira migration criar o schema. Se tiveres erros de “relation already exists”, faz por exemplo:

```bash
docker compose -f docker-compose.e2e.yml down -v
docker compose -f docker-compose.e2e.yml up -d
```

ou apaga só o schema público no contentor Postgres E2E antes de correr `npm run test:e2e`.

## Variável obsoleta `DB_SYNCHRONIZE`

Se `DB_SYNCHRONIZE=true` estiver no ambiente, a app regista um aviso e **ignora** o valor; o schema não é sincronizado automaticamente.
