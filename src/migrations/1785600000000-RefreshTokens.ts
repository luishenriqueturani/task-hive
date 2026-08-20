import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefreshTokens1785600000000 implements MigrationInterface {
  name = 'RefreshTokens1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_token" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_refresh_token" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_token_hash"
      ON "refresh_token" ("tokenHash")
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "refresh_token"
        ADD CONSTRAINT "FK_refresh_token_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    /** Sessões antigas (JWT em texto) deixam de ser válidas após passar a guardar hash. */
    await queryRunner.query(`DELETE FROM "session"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token" DROP CONSTRAINT IF EXISTS "FK_refresh_token_user"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_token"`);
  }
}
