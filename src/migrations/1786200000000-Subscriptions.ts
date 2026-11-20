/// <reference lib="es2015" />
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Subscriptions1786200000000 implements MigrationInterface {
  name = 'Subscriptions1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" character varying(32) NOT NULL,
        "startsAt" TIMESTAMP NOT NULL,
        "endsAt" TIMESTAMP,
        "canceledAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "planId" uuid NOT NULL,
        "userId" uuid,
        "companyId" uuid,
        "couponId" uuid,
        CONSTRAINT "PK_subscription" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_subscription_xor" CHECK (
          ("userId" IS NOT NULL AND "companyId" IS NULL)
          OR ("userId" IS NULL AND "companyId" IS NOT NULL)
        )
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_user"
      ON "subscription" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_company"
      ON "subscription" ("companyId")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_subscription_live_user"
      ON "subscription" ("userId")
      WHERE "userId" IS NOT NULL
        AND status IN ('TRIAL', 'ACTIVE')
        AND "deletedAt" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_subscription_live_company"
      ON "subscription" ("companyId")
      WHERE "companyId" IS NOT NULL
        AND status IN ('TRIAL', 'ACTIVE')
        AND "deletedAt" IS NULL
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "subscription"
        ADD CONSTRAINT "FK_subscription_plan"
        FOREIGN KEY ("planId") REFERENCES "plan"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "subscription"
        ADD CONSTRAINT "FK_subscription_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "subscription"
        ADD CONSTRAINT "FK_subscription_company"
        FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "subscription"
        ADD CONSTRAINT "FK_subscription_coupon"
        FOREIGN KEY ("couponId") REFERENCES "coupon"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "coupon_redemption"
        ADD CONSTRAINT "FK_coupon_redemption_subscription"
        FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coupon_redemption" DROP CONSTRAINT IF EXISTS "FK_coupon_redemption_subscription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT IF EXISTS "FK_subscription_coupon"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT IF EXISTS "FK_subscription_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT IF EXISTS "FK_subscription_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT IF EXISTS "FK_subscription_plan"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_subscription_live_company"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_subscription_live_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_company"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription"`);
  }
}
