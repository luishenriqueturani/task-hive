import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ordem das tasks na coluna + estado completedAt + histórico task_completion.
 */
export class TaskOrderAndCompletions1785500000000 implements MigrationInterface {
  name = 'TaskOrderAndCompletions1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 0`,
    );

    // Backfill order por stage (createdAt ASC → 0..n-1)
    await queryRunner.query(`
      WITH ranked AS (
        SELECT id,
          (ROW_NUMBER() OVER (
            PARTITION BY "stageId"
            ORDER BY "createdAt" ASC NULLS LAST, id ASC
          ) - 1)::integer AS rn
        FROM "task"
        WHERE "deletedAt" IS NULL
      )
      UPDATE "task" t
      SET "order" = ranked.rn
      FROM ranked
      WHERE t.id = ranked.id
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "task_completion" (
        "id" bigint NOT NULL,
        "completedAt" TIMESTAMP NOT NULL,
        "taskId" bigint,
        "stageId" bigint,
        CONSTRAINT "PK_task_completion" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "task_completion"
          ADD CONSTRAINT "FK_task_completion_task"
          FOREIGN KEY ("taskId") REFERENCES "task"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "task_completion"
          ADD CONSTRAINT "FK_task_completion_stage"
          FOREIGN KEY ("stageId") REFERENCES "project_stage"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_completion" DROP CONSTRAINT IF EXISTS "FK_task_completion_stage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completion" DROP CONSTRAINT IF EXISTS "FK_task_completion_task"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "task_completion"`);
    await queryRunner.query(
      `ALTER TABLE "task" DROP COLUMN IF EXISTS "order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" DROP COLUMN IF EXISTS "completedAt"`,
    );
  }
}
