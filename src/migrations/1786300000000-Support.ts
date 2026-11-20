/// <reference lib="es2015" />
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Support1786300000000 implements MigrationInterface {
  name = 'Support1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_ticket" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subject" character varying(120) NOT NULL,
        "status" character varying(32) NOT NULL,
        "lastMessageAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "createdById" uuid NOT NULL,
        "assignedToId" uuid,
        CONSTRAINT "PK_support_ticket" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_support_ticket_status_last"
      ON "support_ticket" ("status", "lastMessageAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_support_ticket_created_by"
      ON "support_ticket" ("createdById")
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_message" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "body" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "ticketId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        CONSTRAINT "PK_support_message" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_support_message_ticket"
      ON "support_message" ("ticketId", "createdAt")
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_ticket"
        ADD CONSTRAINT "FK_support_ticket_created_by"
        FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_ticket"
        ADD CONSTRAINT "FK_support_ticket_assigned_to"
        FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_message"
        ADD CONSTRAINT "FK_support_message_ticket"
        FOREIGN KEY ("ticketId") REFERENCES "support_ticket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_message"
        ADD CONSTRAINT "FK_support_message_author"
        FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "support_message" DROP CONSTRAINT IF EXISTS "FK_support_message_author"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_message" DROP CONSTRAINT IF EXISTS "FK_support_message_ticket"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_ticket" DROP CONSTRAINT IF EXISTS "FK_support_ticket_assigned_to"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_ticket" DROP CONSTRAINT IF EXISTS "FK_support_ticket_created_by"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_message_ticket"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_message"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_support_ticket_created_by"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_support_ticket_status_last"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "support_ticket"`);
  }
}
