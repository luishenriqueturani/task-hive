import { DataSource } from 'typeorm';
import { PostgreSQLTokens } from './postgresql.enums';

/** synchronize: true em desenvolvimento, false quando NODE_ENV=production */
const synchronize = process.env.NODE_ENV !== 'production';

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
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize,
      });
      return dataSource.initialize();
    },
  },
];


