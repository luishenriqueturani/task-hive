import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { PostgreSQLTokens } from './postgresql.enums';

if (process.env.DB_SYNCHRONIZE === 'true') {
  Logger.warn(
    'DB_SYNCHRONIZE está obsoleto e é ignorado. Não use TypeORM synchronize: altere o schema apenas com migrations (`npm run migration:generate` / `migration:run`). Ver README.',
  );
}

/**
 * synchronize está sempre desligado. O schema é aplicado via migrations em `src/migrations/`
 * (`migrationsRun: true` na primeira conexão).
 */
export const databaseProviders = [
  {
    provide: PostgreSQLTokens.DATA_SOURCE,
    useFactory: async () => {
      const { DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
      const dbHost =
        process.env.OPENAPI_GENERATE === '1' && process.env.DB_HOST_OPENAPI
          ? process.env.DB_HOST_OPENAPI
          : process.env.DB_HOST;
      if (DB_PASSWORD === undefined || DB_PASSWORD === '') {
        throw new Error(
          'DB_PASSWORD em falta ou vazio: o cliente PostgreSQL (SCRAM) exige uma string. Verifica .env e, no Docker, docker-compose.yml (passwords com # têm de ir entre aspas na expansão).',
        );
      }
      const dataSource = new DataSource({
        type: 'postgres',
        host: dbHost,
        port: Number(DB_PORT),
        username: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
        synchronize: false,
        migrationsRun: true,
      });
      return dataSource.initialize();
    },
  },
];
