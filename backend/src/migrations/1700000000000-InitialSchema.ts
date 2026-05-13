import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agencies" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "cnpj" character varying UNIQUE,
        "code" character varying UNIQUE,
        "name" character varying NOT NULL,
        "officialName" character varying,
        "city" character varying,
        "state" character varying(2),
        "description" text,
        "active" boolean NOT NULL DEFAULT true,
        "sphere" character varying,
        "entityType" character varying,
        "legalFramework" character varying,
        "contractAlertWindowDays" integer NOT NULL DEFAULT 60,
        "tenantSettings" jsonb,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agencies" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "email" character varying NOT NULL UNIQUE,
        "passwordHash" character varying,
        "name" character varying NOT NULL,
        "phone" character varying,
        "cpfNormalized" character varying(11),
        "cpfHash" character varying UNIQUE,
        "authProvider" character varying NOT NULL DEFAULT 'LOCAL',
        "govBrSubject" character varying,
        "govBrLevel" character varying,
        "mustChangePassword" boolean NOT NULL DEFAULT false,
        "role" character varying NOT NULL DEFAULT 'CITIZEN',
        "requestedRole" character varying,
        "onboardingStatus" character varying NOT NULL DEFAULT 'APPROVED',
        "agencyId" uuid,
        "organAccessProfiles" text,
        "agreedToTermsAt" TIMESTAMPTZ,
        "agreedToPrivacyAt" TIMESTAMPTZ,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_agency" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "supplier_profiles" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "userId" uuid NOT NULL UNIQUE,
        "linkedCitizenUserId" uuid,
        "cnpj" character varying UNIQUE,
        "stateRegistration" character varying,
        "taxRegime" character varying,
        "supplierEntityType" character varying,
        "companyName" character varying,
        "tradeName" character varying,
        "supplierEmail" character varying,
        "isMei" boolean NOT NULL DEFAULT false,
        "meiBirthDate" character varying,
        "meiEducationLevel" character varying,
        "meiProfession" character varying,
        "addressPostalCode" character varying,
        "addressStreet" character varying,
        "addressNumber" character varying,
        "addressComplement" character varying,
        "addressNeighborhood" character varying,
        "addressCity" character varying,
        "addressState" character varying(2),
        "bankName" character varying,
        "bankBranch" character varying,
        "bankAccount" character varying,
        "bankAccountType" character varying,
        "pixKey" character varying,
        "legalRepName" character varying,
        "legalRepCpf" character varying,
        "legalRepEmail" character varying,
        "legalRepPhone" character varying,
        "segments" text,
        "cnbsClasses" jsonb,
        "requiredDocumentTemplates" text,
        "financeContactName" character varying,
        "financeContactEmail" character varying,
        "financeContactPhone" character varying,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_supplier_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_supplier_profiles_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auctions" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'DRAFT',
        "phaseInversionEnabled" boolean NOT NULL DEFAULT false,
        "legalFrameworkSnapshot" jsonb,
        "startsAt" TIMESTAMPTZ,
        "endsAt" TIMESTAMPTZ,
        "createdByUserId" uuid,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auctions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lots" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "auctionId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "startingPriceCents" bigint NOT NULL,
        "minIncrementCents" bigint NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lots_auction" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bids" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "lotId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "amountCents" bigint NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bids" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bids_lot" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bids_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contracts" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "agencyId" uuid NOT NULL,
        "auctionId" uuid,
        "contractNumber" character varying NOT NULL,
        "title" character varying NOT NULL,
        "supplierName" character varying,
        "managerName" character varying,
        "startsAt" character varying NOT NULL,
        "endsAt" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'ACTIVE',
        "totalValueCents" bigint,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contracts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contracts_agency_status_ends"
      ON "contracts" ("agencyId", "status", "endsAt")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "key" character varying NOT NULL UNIQUE,
        "description" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "key" character varying NOT NULL UNIQUE,
        "name" character varying NOT NULL,
        "description" text,
        "system" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "rolesId" uuid NOT NULL,
        "permissionsId" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("rolesId", "permissionsId"),
        CONSTRAINT "FK_rp_role" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_rp_permission" FOREIGN KEY ("permissionsId") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "userId" uuid,
        "agencyId" uuid,
        "actorRole" character varying,
        "method" character varying(12) NOT NULL,
        "endpoint" character varying NOT NULL,
        "ipAddress" character varying,
        "statusCode" integer NOT NULL,
        "action" character varying NOT NULL,
        "previousPayload" jsonb,
        "nextPayload" jsonb,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "onboarding_decisions" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "targetUserId" uuid,
        "targetEmail" character varying NOT NULL,
        "targetName" character varying,
        "requestedRole" character varying,
        "requestedAgencyName" character varying,
        "decision" character varying NOT NULL,
        "resultingRole" character varying,
        "resultingAgencyId" uuid,
        "resultingAgencyName" character varying,
        "decidedByUserId" uuid,
        "decidedByEmail" character varying,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_onboarding_decisions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_recovery_requests" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "cpfNormalized" character varying(11) NOT NULL,
        "userId" uuid,
        "status" character varying NOT NULL DEFAULT 'REQUESTED',
        "deliveryChannel" character varying,
        "recoveryTokenHash" character varying,
        "tokenExpiresAt" TIMESTAMPTZ,
        "resolvedByUserId" uuid,
        "resolutionNotes" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_recovery_requests" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pncp_publication_jobs" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "auctionId" uuid NOT NULL,
        "agencyId" uuid,
        "targetEndpoint" character varying NOT NULL,
        "payload" jsonb NOT NULL,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "attempts" integer NOT NULL DEFAULT 0,
        "maxAttempts" integer NOT NULL DEFAULT 5,
        "nextAttemptAt" TIMESTAMPTZ,
        "lastError" text,
        "lastResponse" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pncp_publication_jobs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pncp_status_next"
      ON "pncp_publication_jobs" ("status", "nextAttemptAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pncp_publication_jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_recovery_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "onboarding_decisions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contracts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bids"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auctions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "supplier_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agencies"`);
  }
}
