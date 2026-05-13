import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Lot } from "./Lot";

export enum AuctionStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export enum AuctionModality {
  PREGAO = "PREGAO",
  DISPENSA = "DISPENSA",
  CREDENCIAMENTO = "CREDENCIAMENTO",
  CONCORRENCIA = "CONCORRENCIA",
  INEXIGIBILIDADE = "INEXIGIBILIDADE",
  LEILAO = "LEILAO",
  PRE_QUALIFICACAO = "PRE_QUALIFICACAO",
}

export enum AuctionPhase {
  INTERNAL = "INTERNAL",
  PUBLISHED = "PUBLISHED",
  PROPOSALS = "PROPOSALS",
  CLASSIFICATION = "CLASSIFICATION",
  SESSION = "SESSION",
  QUALIFICATION = "QUALIFICATION",
  DECISION = "DECISION",
  CONTRACT = "CONTRACT",
  CLOSED = "CLOSED",
}

export enum DisputeMode {
  OPEN = "OPEN",
  OPEN_CLOSED = "OPEN_CLOSED",
}

export enum JudgmentCriteria {
  MENOR_PRECO = "MENOR_PRECO",
  MAIOR_DESCONTO = "MAIOR_DESCONTO",
  TECNICA_PRECO = "TECNICA_PRECO",
  MELHOR_TECNICA = "MELHOR_TECNICA",
}

@Entity("auctions")
export class Auction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "varchar", default: AuctionStatus.DRAFT })
  status!: string;

  @Column({ type: "boolean", default: false })
  phaseInversionEnabled!: boolean;

  @Column({ type: "varchar", default: AuctionModality.PREGAO })
  modality!: string;

  @Column({ type: "varchar", default: AuctionPhase.INTERNAL })
  phase!: string;

  @Column({ type: "varchar", default: DisputeMode.OPEN })
  disputeMode!: string;

  @Column({ type: "varchar", default: JudgmentCriteria.MENOR_PRECO })
  judgmentCriteria!: string;

  @Column({ type: "varchar", nullable: true })
  processNumber?: string | null;

  @Column({ type: "varchar", nullable: true })
  editalNumber?: string | null;

  @Column({ type: "varchar", nullable: true })
  agencyId?: string | null;

  @Column({ type: "bigint", nullable: true })
  estimatedValueCents?: string | null;

  @Column({ type: "boolean", default: false })
  hiddenValue!: boolean;

  @Column({ type: "jsonb", nullable: true })
  legalFrameworkSnapshot?: Record<string, unknown> | null;

  @Column({ type: "timestamptz", nullable: true })
  startsAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  endsAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  proposalDeadline?: Date | null;

  @Column({ type: "uuid", nullable: true })
  createdByUserId?: string | null;

  @OneToMany("Lot", (lot: Lot) => lot.auction, { cascade: true })
  lots!: Lot[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
