import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProposalsSolicitationsChat1700000000004 implements MigrationInterface {
  name = "AddProposalsSolicitationsChat1700000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to auctions
    await queryRunner.query(`
      ALTER TABLE "auctions"
        ADD COLUMN IF NOT EXISTS "modality" character varying NOT NULL DEFAULT 'PREGAO',
        ADD COLUMN IF NOT EXISTS "phase" character varying NOT NULL DEFAULT 'INTERNAL',
        ADD COLUMN IF NOT EXISTS "disputeMode" character varying NOT NULL DEFAULT 'OPEN',
        ADD COLUMN IF NOT EXISTS "judgmentCriteria" character varying NOT NULL DEFAULT 'MENOR_PRECO',
        ADD COLUMN IF NOT EXISTS "processNumber" character varying,
        ADD COLUMN IF NOT EXISTS "editalNumber" character varying,
        ADD COLUMN IF NOT EXISTS "agencyId" uuid,
        ADD COLUMN IF NOT EXISTS "estimatedValueCents" bigint,
        ADD COLUMN IF NOT EXISTS "hiddenValue" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "proposalDeadline" TIMESTAMPTZ
    `);

    // Proposals table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "proposals" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "auctionId" uuid NOT NULL,
        "lotId" uuid,
        "userId" uuid NOT NULL,
        "amountCents" bigint,
        "brand" character varying,
        "manufacturer" character varying,
        "model" character varying,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'DRAFT',
        "declarations" jsonb,
        "documents" jsonb,
        "submittedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proposals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_proposals_auction" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_proposals_lot" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_proposals_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_proposals_auction_user"
      ON "proposals" ("auctionId", "userId")
    `);

    // Solicitations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "solicitations" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "auctionId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "type" character varying NOT NULL,
        "subject" character varying NOT NULL,
        "content" text NOT NULL,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "answer" text,
        "answeredAt" TIMESTAMPTZ,
        "answeredByUserId" uuid,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_solicitations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_solicitations_auction" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_solicitations_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_solicitations_auction"
      ON "solicitations" ("auctionId")
    `);

    // Chat messages table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "auctionId" uuid NOT NULL,
        "userId" uuid,
        "senderName" character varying NOT NULL,
        "type" character varying NOT NULL DEFAULT 'USER',
        "content" text NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chat_messages_auction" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_chat_messages_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_messages_auction_created"
      ON "chat_messages" ("auctionId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "solicitations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "proposals"`);
    await queryRunner.query(`
      ALTER TABLE "auctions"
        DROP COLUMN IF EXISTS "modality",
        DROP COLUMN IF EXISTS "phase",
        DROP COLUMN IF EXISTS "disputeMode",
        DROP COLUMN IF EXISTS "judgmentCriteria",
        DROP COLUMN IF EXISTS "processNumber",
        DROP COLUMN IF EXISTS "editalNumber",
        DROP COLUMN IF EXISTS "agencyId",
        DROP COLUMN IF EXISTS "estimatedValueCents",
        DROP COLUMN IF EXISTS "hiddenValue",
        DROP COLUMN IF EXISTS "proposalDeadline"
    `);
  }
}
