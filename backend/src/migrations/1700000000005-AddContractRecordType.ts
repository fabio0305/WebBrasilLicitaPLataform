import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContractRecordType1700000000005 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS "recordType" VARCHAR NOT NULL DEFAULT 'CONTRACT';
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE contracts DROP COLUMN IF EXISTS "recordType";`);
  }
}
