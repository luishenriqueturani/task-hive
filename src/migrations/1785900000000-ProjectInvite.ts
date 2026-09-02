/// <reference lib="es2015" />
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectInvite1785900000000 implements MigrationInterface {
  name = 'ProjectInvite1785900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_invite" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "token" character varying(128) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'PENDING',
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "projectId" bigint,
        "invitedById" uuid,
        "acceptedById" uuid,
        CONSTRAINT "PK_project_invite" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_invite_token" UNIQUE ("token")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_project_invite_pending_email"
      ON "project_invite" ("projectId", "email")
      WHERE "status" = 'PENDING'
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "project_invite"
        ADD CONSTRAINT "FK_project_invite_project"
        FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "project_invite"
        ADD CONSTRAINT "FK_project_invite_invited_by"
        FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "project_invite"
        ADD CONSTRAINT "FK_project_invite_accepted_by"
        FOREIGN KEY ("acceptedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_invite" DROP CONSTRAINT IF EXISTS "FK_project_invite_accepted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_invite" DROP CONSTRAINT IF EXISTS "FK_project_invite_invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_invite" DROP CONSTRAINT IF EXISTS "FK_project_invite_project"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_project_invite_pending_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_invite"`);
  }
}
