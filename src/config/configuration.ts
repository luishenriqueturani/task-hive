export default () => ({
  port: process.env.APP_PORT || 3001,
  /** Rounds bcrypt; CRYPT_SALT preferido (ver também `src/utils/crypt.ts`). */
  cryptSault: process.env.CRYPT_SALT ?? process.env.CRYPT_SAULT,
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '1h',
  jwtRefreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 30),
  isProduction: process.env.NODE_ENV === 'production',
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    /**
     * Obsoleto: synchronize nunca é usado pela app (sempre false em `database.providers.ts`).
     * Use apenas migrations em `src/migrations/`.
     */
    synchronize: false,
  },
});
