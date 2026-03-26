import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.e2e') });

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
