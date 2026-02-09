export default () => ({
  port: process.env.APP_PORT || 3001,
  cryptSault: process.env.CRYPT_SALT,
  jwtSecret: process.env.JWT_SECRET,
  /** false em produção (NODE_ENV=production); true em desenvolvimento */
  isProduction: process.env.NODE_ENV === 'production',
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    /** Sincronizar schema: true em dev, false em produção. Use NODE_ENV=production para desativar. */
    synchronize: process.env.NODE_ENV !== 'production',
  },
});