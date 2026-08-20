import { MigrationInterface, QueryRunner } from 'typeorm';

export class PersonalAccessTokens1785700000000 implements MigrationInterface {
  name = 'PersonalAccessTokens1785700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "personal_access_token" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "tokenHash" character varying NOT NULL,
        "tokenPrefix" character varying(24) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "lastUsedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_personal_access_token" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_personal_access_token_hash"
      ON "personal_access_token" ("tokenHash")
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "personal_access_token"
        ADD CONSTRAINT "FK_personal_access_token_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "personal_access_token" DROP CONSTRAINT IF EXISTS "FK_personal_access_token_user"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "personal_access_token"`);
  }
}
