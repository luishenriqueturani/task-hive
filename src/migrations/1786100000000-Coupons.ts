/// <reference lib="es2015" />
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Coupons1786100000000 implements MigrationInterface {
  name = 'Coupons1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coupon" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(32) NOT NULL,
        "type" character varying(32) NOT NULL,
        "value" integer NOT NULL,
        "maxRedemptions" integer,
        "redeemedCount" integer NOT NULL DEFAULT 0,
        "startsAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_coupon" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_coupon_code_active"
      ON "coupon" ("code")
      WHERE "deletedAt" IS NULL
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coupon_applicable_plan" (
        "couponId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        CONSTRAINT "PK_coupon_applicable_plan" PRIMARY KEY ("couponId", "planId")
      )
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "coupon_applicable_plan"
        ADD CONSTRAINT "FK_coupon_applicable_plan_coupon"
        FOREIGN KEY ("couponId") REFERENCES "coupon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "coupon_applicable_plan"
        ADD CONSTRAINT "FK_coupon_applicable_plan_plan"
        FOREIGN KEY ("planId") REFERENCES "plan"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coupon_redemption" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscriptionId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "couponId" uuid,
        "userId" uuid,
        CONSTRAINT "PK_coupon_redemption" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "coupon_redemption"
        ADD CONSTRAINT "FK_coupon_redemption_coupon"
        FOREIGN KEY ("couponId") REFERENCES "coupon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "coupon_redemption"
        ADD CONSTRAINT "FK_coupon_redemption_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coupon_redemption" DROP CONSTRAINT IF EXISTS "FK_coupon_redemption_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemption" DROP CONSTRAINT IF EXISTS "FK_coupon_redemption_coupon"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "coupon_redemption"`);
    await queryRunner.query(
      `ALTER TABLE "coupon_applicable_plan" DROP CONSTRAINT IF EXISTS "FK_coupon_applicable_plan_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_applicable_plan" DROP CONSTRAINT IF EXISTS "FK_coupon_applicable_plan_coupon"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "coupon_applicable_plan"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_coupon_code_active"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupon"`);
  }
}
