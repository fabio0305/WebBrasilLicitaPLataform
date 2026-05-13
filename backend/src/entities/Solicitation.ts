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
import type { User } from "./User";

export enum SolicitationType {
  IMPUGNACAO = "IMPUGNACAO",
  ESCLARECIMENTO = "ESCLARECIMENTO",
  RECURSO = "RECURSO",
  CONTRARRAZAO = "CONTRARRAZAO",
}

export enum SolicitationStatus {
  PENDING = "PENDING",
  ANSWERED = "ANSWERED",
  REJECTED = "REJECTED",
}

@Entity("solicitations")
export class Solicitation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  auctionId!: string;

  @ManyToOne("Auction", { onDelete: "CASCADE" })
  @JoinColumn({ name: "auctionId" })
  auction!: Auction;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  type!: string;

  @Column({ type: "varchar" })
  subject!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "varchar", default: SolicitationStatus.PENDING })
  status!: string;

  @Column({ type: "text", nullable: true })
  answer?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  answeredAt?: Date | null;

  @Column({ type: "uuid", nullable: true })
  answeredByUserId?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
