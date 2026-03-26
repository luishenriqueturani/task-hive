import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1732600000000 implements MigrationInterface {
  name = 'InitialSchema1732600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subtask" ("id" bigint NOT NULL, "name" character varying(255) NOT NULL, "description" text, "isCompleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "taskId" bigint, "responsibleId" uuid, CONSTRAINT "PK_e0cda44ad38dba885bd8ab1afd3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_time_trak" ("id" bigint NOT NULL, "start" TIMESTAMP NOT NULL, "end" TIMESTAMP, "taskId" bigint, "userId" uuid, CONSTRAINT "PK_e044e5c372e28a93a3956b9ecec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "task" ("id" bigint NOT NULL, "name" character varying(255) NOT NULL, "description" text, "finishDate" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, "stageId" bigint, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_stage" ("id" bigint NOT NULL, "name" character varying(255) NOT NULL, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "projectId" bigint, "nextStageId" bigint, "prevStageId" bigint, CONSTRAINT "REL_7030d25d1100b4f09813335117" UNIQUE ("nextStageId"), CONSTRAINT "REL_687857dbd86595373096fd3d8e" UNIQUE ("prevStageId"), CONSTRAINT "PK_4b1bd4c014be559707eb9b83dfe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "project" ("id" bigint NOT NULL, "name" character varying(255) NOT NULL, "description" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "userOwnerId" uuid, "companyOwnerId" uuid, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "to_do_completed" ("id" bigint NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "toDoId" bigint, CONSTRAINT "PK_052691bee1a28a753069827baa1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."to_do_status_enum" AS ENUM('TODO', 'DONE', 'CANCELLED', 'PAUSED', 'CREATED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."to_do_type_enum" AS ENUM('PUNCTUAL', 'RECURRING')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."to_do_recurringtype_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "to_do" ("id" bigint NOT NULL, "title" character varying(255) NOT NULL, "description" text, "status" "public"."to_do_status_enum" NOT NULL DEFAULT 'CREATED', "type" "public"."to_do_type_enum" NOT NULL DEFAULT 'RECURRING', "recurringType" "public"."to_do_recurringtype_enum" DEFAULT 'MONTHLY', "recurringTimes" integer, "recurringCount" integer DEFAULT '0', "recurringNextDate" TIMESTAMP, "recurringDeadline" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "PK_19d14b861427e18d619639c8f2b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "forget_password" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userId" uuid, CONSTRAINT "PK_72506e37c3b5302110f6674fc28" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "avatar" character varying, "role" character varying(32) NOT NULL DEFAULT 'CLIENT', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_friendship" ("id" bigint NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "user1Id" uuid, "user2Id" uuid, CONSTRAINT "PK_595d245801d8c79e55b2b13d159" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_participants_user" ("projectId" bigint NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_4dfaa5f462fbcdff205e3208abe" PRIMARY KEY ("projectId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39b59e47bcfef4bc9429d309db" ON "project_participants_user" ("projectId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef98f6b288f201552e29121e4f" ON "project_participants_user" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "subtask" ADD CONSTRAINT "FK_8209040ec2c518c62c70cd382dd" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subtask" ADD CONSTRAINT "FK_8d7433eeabff53e1bff56c8cf19" FOREIGN KEY ("responsibleId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_time_trak" ADD CONSTRAINT "FK_f07c7d508b663b4f51a2c0f329c" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_time_trak" ADD CONSTRAINT "FK_a83fac6c750e9b5ff58c0bfa338" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_93f41b86f2775a16f2890616aa0" FOREIGN KEY ("stageId") REFERENCES "project_stage"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_stage" ADD CONSTRAINT "FK_259f2ebab55ce4c7d404b0d3627" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_stage" ADD CONSTRAINT "FK_7030d25d1100b4f09813335117a" FOREIGN KEY ("nextStageId") REFERENCES "project_stage"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_stage" ADD CONSTRAINT "FK_687857dbd86595373096fd3d8e7" FOREIGN KEY ("prevStageId") REFERENCES "project_stage"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_ffd11d1af64371a2f91d61838a0" FOREIGN KEY ("userOwnerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_a5b0b17c9369fcf56bcd15430ec" FOREIGN KEY ("companyOwnerId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "to_do_completed" ADD CONSTRAINT "FK_fb82930af998ea2eee8cdda38a2" FOREIGN KEY ("toDoId") REFERENCES "to_do"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "to_do" ADD CONSTRAINT "FK_dc00b4c082848833754e5ed9a30" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "forget_password" ADD CONSTRAINT "FK_3a624e1f40a7285b1566e35717e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_friendship" ADD CONSTRAINT "FK_63bc1e53c8411a6d295cc0d9a14" FOREIGN KEY ("user1Id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_friendship" ADD CONSTRAINT "FK_8d53aee746c75b29e3061953584" FOREIGN KEY ("user2Id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_participants_user" ADD CONSTRAINT "FK_39b59e47bcfef4bc9429d309db3" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_participants_user" ADD CONSTRAINT "FK_ef98f6b288f201552e29121e4fd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_participants_user" DROP CONSTRAINT "FK_ef98f6b288f201552e29121e4fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_participants_user" DROP CONSTRAINT "FK_39b59e47bcfef4bc9429d309db3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_friendship" DROP CONSTRAINT "FK_8d53aee746c75b29e3061953584"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_friendship" DROP CONSTRAINT "FK_63bc1e53c8411a6d295cc0d9a14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forget_password" DROP CONSTRAINT "FK_3a624e1f40a7285b1566e35717e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "to_do" DROP CONSTRAINT "FK_dc00b4c082848833754e5ed9a30"`,
    );
    await queryRunner.query(
      `ALTER TABLE "to_do_completed" DROP CONSTRAINT "FK_fb82930af998ea2eee8cdda38a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_a5b0b17c9369fcf56bcd15430ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_ffd11d1af64371a2f91d61838a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_stage" DROP CONSTRAINT "FK_687857dbd86595373096fd3d8e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_stage" DROP CONSTRAINT "FK_7030d25d1100b4f09813335117a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_stage" DROP CONSTRAINT "FK_259f2ebab55ce4c7d404b0d3627"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "FK_93f41b86f2775a16f2890616aa0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_time_trak" DROP CONSTRAINT "FK_a83fac6c750e9b5ff58c0bfa338"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_time_trak" DROP CONSTRAINT "FK_f07c7d508b663b4f51a2c0f329c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subtask" DROP CONSTRAINT "FK_8d7433eeabff53e1bff56c8cf19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subtask" DROP CONSTRAINT "FK_8209040ec2c518c62c70cd382dd"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ef98f6b288f201552e29121e4f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_39b59e47bcfef4bc9429d309db"`);
    await queryRunner.query(`DROP TABLE "project_participants_user"`);
    await queryRunner.query(`DROP TABLE "user_friendship"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "forget_password"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "to_do"`);
    await queryRunner.query(`DROP TYPE "public"."to_do_recurringtype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."to_do_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."to_do_status_enum"`);
    await queryRunner.query(`DROP TABLE "to_do_completed"`);
    await queryRunner.query(`DROP TABLE "project"`);
    await queryRunner.query(`DROP TABLE "project_stage"`);
    await queryRunner.query(`DROP TABLE "task"`);
    await queryRunner.query(`DROP TABLE "task_time_trak"`);
    await queryRunner.query(`DROP TABLE "subtask"`);
    await queryRunner.query(`DROP TABLE "company"`);
  }
}
