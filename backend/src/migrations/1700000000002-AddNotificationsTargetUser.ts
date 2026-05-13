import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationsTargetUser1700000000002 implements MigrationInterface {
  name = "AddNotificationsTargetUser1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "targetUserId" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "targetUserId"`);
  }
}
