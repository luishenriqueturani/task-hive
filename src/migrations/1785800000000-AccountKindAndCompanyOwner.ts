import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountKindAndCompanyOwner1785800000000 implements MigrationInterface {
  name = 'AccountKindAndCompanyOwner1785800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "accountKind" character varying(32) NOT NULL DEFAULT 'INDIVIDUAL'
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "document" character varying(14)
    `);

    await queryRunner.query(`
      ALTER TABLE "company"
      ADD COLUMN IF NOT EXISTS "legalName" character varying(255)
    `);
    await queryRunner.query(`
      UPDATE "company" SET "legalName" = "name" WHERE "legalName" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "company"
      ALTER COLUMN "legalName" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "company"
      ADD COLUMN IF NOT EXISTS "tradeName" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "company"
      ADD COLUMN IF NOT EXISTS "document" character varying(14)
    `);
    await queryRunner.query(`
      ALTER TABLE "company"
      ADD COLUMN IF NOT EXISTS "ownerId" uuid
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_company_document"
      ON "company" ("document")
      WHERE "document" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_company_owner"
      ON "company" ("ownerId")
      WHERE "ownerId" IS NOT NULL
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "company"
        ADD CONSTRAINT "FK_company_owner"
        FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "FK_company_owner"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_company_owner"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_company_document"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "ownerId"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "document"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "tradeName"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "legalName"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "document"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "accountKind"`);
  }
}
