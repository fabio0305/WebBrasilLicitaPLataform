import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationReplies1700000000003 implements MigrationInterface {
  name = "AddNotificationReplies1700000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_replies" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "notificationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "message" text NOT NULL,
        "readByAdminAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_replies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_reply_user" UNIQUE ("notificationId", "userId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notif_replies_notif" ON "notification_replies" ("notificationId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_replies"`);
  }
}
