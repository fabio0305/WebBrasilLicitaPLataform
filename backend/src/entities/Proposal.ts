import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Auction } from "./Auction";
import type { Lot } from "./Lot";
import type { User } from "./User";

export enum ProposalStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  CLASSIFIED = "CLASSIFIED",
  WINNER = "WINNER",
  DISQUALIFIED = "DISQUALIFIED",
}

@Entity("proposals")
export class Proposal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  auctionId!: string;

  @ManyToOne("Auction", { onDelete: "CASCADE" })
  @JoinColumn({ name: "auctionId" })
  auction!: Auction;

  @Column({ type: "uuid", nullable: true })
  lotId?: string | null;

  @ManyToOne("Lot", { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "lotId" })
  lot?: Lot | null;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "bigint", nullable: true })
  amountCents?: string | null;

  @Column({ type: "varchar", nullable: true })
  brand?: string | null;

  @Column({ type: "varchar", nullable: true })
  manufacturer?: string | null;

  @Column({ type: "varchar", nullable: true })
  model?: string | null;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "varchar", default: ProposalStatus.DRAFT })
  status!: string;

  @Column({ type: "jsonb", nullable: true })
  declarations?: Record<string, boolean> | null;

  @Column({ type: "jsonb", nullable: true })
  documents?: { name: string; url: string; uploadedAt: string }[] | null;

  @Column({ type: "timestamptz", nullable: true })
  submittedAt?: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
