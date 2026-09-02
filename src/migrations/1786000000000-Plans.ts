/// <reference lib="es2015" />
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Plans1786000000000 implements MigrationInterface {
  name = 'Plans1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plan" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying(64) NOT NULL,
        "name" character varying(120) NOT NULL,
        "description" text,
        "accountKind" character varying(32) NOT NULL DEFAULT 'BOTH',
        "interval" character varying(32) NOT NULL DEFAULT 'MONTHLY',
        "priceCents" integer NOT NULL DEFAULT 0,
        "currency" character varying(8) NOT NULL DEFAULT 'BRL',
        "isActive" boolean NOT NULL DEFAULT true,
        "isSystem" boolean NOT NULL DEFAULT false,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "maxProjects" integer NOT NULL DEFAULT 0,
        "maxApiKeys" integer NOT NULL DEFAULT 0,
        "maxStandaloneTasks" integer NOT NULL DEFAULT 0,
        "maxProjectGuests" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_plan" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plan_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plan_benefit" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(160) NOT NULL,
        "body" text,
        "icon" character varying(64),
        "sortOrder" integer NOT NULL DEFAULT 0,
        "planId" uuid,
        CONSTRAINT "PK_plan_benefit" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "plan_benefit"
        ADD CONSTRAINT "FK_plan_benefit_plan"
        FOREIGN KEY ("planId") REFERENCES "plan"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      INSERT INTO "plan" (
        "slug", "name", "description", "accountKind", "interval",
        "priceCents", "currency", "isActive", "isSystem", "sortOrder",
        "maxProjects", "maxApiKeys", "maxStandaloneTasks", "maxProjectGuests"
      ) VALUES
        (
          'free-trial', 'Free Trial', 'Trial técnico — não aparece na landing.',
          'BOTH', 'MONTHLY', 0, 'BRL', true, true, 0,
          3, 1, 15, 2
        ),
        (
          'starter', 'Starter', 'Para começar com Kanban, to-do e chaves de API.',
          'BOTH', 'MONTHLY', 2900, 'BRL', true, false, 1,
          5, 2, 30, 3
        ),
        (
          'pro', 'Pro', 'Mais projectos, convidados e chaves de API.',
          'BOTH', 'MONTHLY', 7900, 'BRL', true, false, 2,
          20, 10, 200, 15
        ),
        (
          'business', 'Business', 'Quotas ilimitadas e suporte prioritário.',
          'BOTH', 'MONTHLY', 19900, 'BRL', true, false, 3,
          -1, -1, -1, -1
        )
      ON CONFLICT ("slug") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "plan_benefit" ("title", "body", "sortOrder", "planId")
      SELECT seed.title, seed.body, seed.sort_order, p.id
      FROM (VALUES
        ('starter', 'Quadros Kanban', 'Organize projectos em colunas.', 0),
        ('starter', 'Tarefas avulsas (contas PF)', 'To-dos pessoais fora do quadro.', 1),
        ('starter', 'Chaves de API', 'Integrações e agentes com PAT.', 2),
        ('pro', 'Tudo do Starter', 'Kanban, to-do e chaves de API.', 0),
        ('pro', 'Mais projectos e convidados', 'Tecto mais alto para equipas.', 1),
        ('pro', 'Mais chaves de API', 'Mais tokens em simultâneo.', 2),
        ('business', 'Tudo do Pro', 'Todas as funcionalidades do Pro.', 0),
        ('business', 'Quotas ilimitadas', 'Sem tecto nos quatro eixos desta etapa.', 1),
        ('business', 'Suporte prioritário', 'Atendimento com prioridade (copy).', 2)
      ) AS seed(slug, title, body, sort_order)
      INNER JOIN "plan" p ON p."slug" = seed.slug
      WHERE NOT EXISTS (
        SELECT 1 FROM "plan_benefit" b
        WHERE b."planId" = p.id AND b.title = seed.title
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plan_benefit" DROP CONSTRAINT IF EXISTS "FK_plan_benefit_plan"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_benefit"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plan"`);
  }
}
