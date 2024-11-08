import { registerAs } from "@nestjs/config";

//console.log(process.env.DB_HOST);

export default registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}));