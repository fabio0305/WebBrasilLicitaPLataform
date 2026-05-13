import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1700000000001 implements MigrationInterface {
  name = "AddNotifications1700000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "category" character varying NOT NULL DEFAULT 'GERAL',
        "targetRole" character varying NOT NULL DEFAULT 'ALL',
        "sentByUserId" uuid,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
