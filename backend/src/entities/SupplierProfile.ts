import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { User } from "./User";

export enum TaxRegime {
  MEI = "MEI",
  SIMPLES_NACIONAL = "SIMPLES_NACIONAL",
  OUTROS_ENQUADRAMENTO = "OUTROS_ENQUADRAMENTO",
}

export enum SupplierEntityType {
  PESSOA_JURIDICA = "PESSOA_JURIDICA",
  PESSOA_FISICA = "PESSOA_FISICA",
}

export enum BankAccountType {
  CORRENTE = "CORRENTE",
  POUPANCA = "POUPANCA",
}

@Entity("supplier_profiles")
export class SupplierProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  userId!: string;

  @OneToOne("User", (u: User) => u.supplierProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  /** UUID of the linked citizen account that converted to supplier */
  @Column({ type: "uuid", nullable: true })
  linkedCitizenUserId?: string | null;

  // ── Company identification ─────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true, unique: true })
  cnpj?: string | null;

  @Column({ type: "varchar", nullable: true })
  stateRegistration?: string | null;

  @Column({ type: "varchar", nullable: true })
  taxRegime?: string | null;

  @Column({ type: "varchar", nullable: true })
  supplierEntityType?: string | null;

  @Column({ type: "varchar", nullable: true })
  companyName?: string | null;

  @Column({ type: "varchar", nullable: true })
  tradeName?: string | null;

  @Column({ type: "varchar", nullable: true })
  supplierEmail?: string | null;

  // ── MEI specific ────────────────────────────────────────────────────────────

  @Column({ type: "boolean", default: false })
  isMei!: boolean;

  @Column({ type: "varchar", nullable: true })
  meiBirthDate?: string | null;

  @Column({ type: "varchar", nullable: true })
  meiEducationLevel?: string | null;

  @Column({ type: "varchar", nullable: true })
  meiProfession?: string | null;

  // ── Address ─────────────────────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  addressPostalCode?: string | null;

  @Column({ type: "varchar", nullable: true })
  addressStreet?: string | null;

  @Column({ type: "varchar", nullable: true })
  addressNumber?: string | null;

  @Column({ type: "varchar", nullable: true })
  addressComplement?: string | null;

  @Column({ type: "varchar", nullable: true })
  addressNeighborhood?: string | null;

  @Column({ type: "varchar", nullable: true })
  addressCity?: string | null;

  @Column({ type: "varchar", length: 2, nullable: true })
  addressState?: string | null;

  // ── Banking ─────────────────────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  bankName?: string | null;

  @Column({ type: "varchar", nullable: true })
  bankBranch?: string | null;

  @Column({ type: "varchar", nullable: true })
  bankAccount?: string | null;

  @Column({ type: "varchar", nullable: true })
  bankAccountType?: string | null;

  @Column({ type: "varchar", nullable: true })
  pixKey?: string | null;

  // ── Legal representative ────────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  legalRepName?: string | null;

  @Column({ type: "varchar", nullable: true })
  legalRepCpf?: string | null;

  @Column({ type: "varchar", nullable: true })
  legalRepEmail?: string | null;

  @Column({ type: "varchar", nullable: true })
  legalRepPhone?: string | null;

  // ── Segments & documents ────────────────────────────────────────────────────

  @Column({ type: "simple-array", nullable: true })
  segments?: string[] | null;

  @Column({ type: "jsonb", nullable: true })
  cnbsClasses?: Array<{ code: string; description: string }> | null;

  @Column({ type: "simple-array", nullable: true })
  requiredDocumentTemplates?: string[] | null;

  // ── Finance contact ─────────────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  financeContactName?: string | null;

  @Column({ type: "varchar", nullable: true })
  financeContactEmail?: string | null;

  @Column({ type: "varchar", nullable: true })
  financeContactPhone?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
