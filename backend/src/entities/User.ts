import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { createHash } from "crypto";
import { normalizeCpf } from "../utils/cpf";
import type { Agency } from "./Agency";
import type { SupplierProfile } from "./SupplierProfile";

export enum UserRole {
  ADMIN = "ADMIN",
  AGENCY_ADMIN = "AGENCY_ADMIN",
  AGENCY_MEMBER = "AGENCY_MEMBER",
  AUCTIONEER = "AUCTIONEER",
  AUTHORITY = "AUTHORITY",
  PUBLIC_AGENCY = "PUBLIC_AGENCY",
  SUPPORT = "SUPPORT",
  SUPPLIER = "SUPPLIER",
  CITIZEN = "CITIZEN",
}

export enum AuthProviderKind {
  LOCAL = "LOCAL",
  GOV_BR = "GOV_BR",
}

export enum GovBrAccessLevel {
  BRONZE = "BRONZE",
  PRATA = "PRATA",
  OURO = "OURO",
}

export enum OnboardingStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export enum OrganAccessProfile {
  PREGOEIRO = "PREGOEIRO",
  ASSESSOR_JURIDICO = "ASSESSOR_JURIDICO",
  ORDENADOR_DESPESAS = "ORDENADOR_DESPESAS",
  GESTOR_CONTRATOS = "GESTOR_CONTRATOS",
  APOIO_PREGAO = "APOIO_PREGAO",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar", nullable: true, select: false })
  passwordHash?: string | null;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", nullable: true })
  phone?: string | null;

  /** Normalized (digits only) CPF - for lookups */
  @Column({ type: "varchar", length: 11, nullable: true })
  cpfNormalized?: string | null;

  /** SHA-256 hash of normalized CPF - do not expose */
  @Column({ type: "varchar", nullable: true, unique: true })
  cpfHash?: string | null;

  @Column({ type: "varchar", default: AuthProviderKind.LOCAL })
  authProvider!: string;

  @Column({ type: "varchar", nullable: true })
  govBrSubject?: string | null;

  @Column({ type: "varchar", nullable: true })
  govBrLevel?: string | null;

  @Column({ type: "boolean", default: false })
  mustChangePassword!: boolean;

  @Column({ type: "varchar", default: UserRole.CITIZEN })
  role!: string;

  @Column({ type: "varchar", nullable: true })
  requestedRole?: string | null;

  @Column({ type: "varchar", default: OnboardingStatus.APPROVED })
  onboardingStatus!: string;

  @Column({ type: "uuid", nullable: true })
  agencyId?: string | null;

  @ManyToOne("Agency", (agency: Agency) => agency.users, { nullable: true })
  @JoinColumn({ name: "agencyId" })
  agency?: Agency | null;

  @Column({ type: "simple-array", nullable: true })
  organAccessProfiles?: string[] | null;

  /** Link to supplier profile (only populated when role is SUPPLIER) */
  @OneToOne("SupplierProfile", (sp: SupplierProfile) => sp.user, {
    nullable: true,
    cascade: true,
  })
  supplierProfile?: SupplierProfile | null;

  @Column({ type: "timestamptz", nullable: true })
  agreedToTermsAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  agreedToPrivacyAt?: Date | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  syncDerivedIdentityFields() {
    if (this.cpfNormalized) {
      this.cpfNormalized = normalizeCpf(this.cpfNormalized);
      this.cpfHash = createHash("sha256").update(this.cpfNormalized).digest("hex");
    }
  }
}
