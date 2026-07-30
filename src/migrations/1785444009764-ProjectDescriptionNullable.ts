import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `project.description` era `text NOT NULL` (diferente de task/subtask/to_do,
 * que são nullable) e quebrava com 500 ao criar projeto sem descrição —
 * o campo é opcional no CreateProjectDto.
 */
export class ProjectDescriptionNullable1785444009764 implements MigrationInterface {
  name = 'ProjectDescriptionNullable1785444009764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "description" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "project" SET "description" = '' WHERE "description" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "description" SET NOT NULL`,
    );
  }
}
