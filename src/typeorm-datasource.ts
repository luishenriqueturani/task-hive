import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

config();

/** DataSource para CLI (`npm run migration:*`) e para referência; a app Nest usa `database.providers.ts`. */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
});
