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
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
        synchronize: false,
        migrationsRun: true,
      });
      return dataSource.initialize();
    },
  },
];
