import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum PncpJobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  RETRYING = "RETRYING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

@Entity("pncp_publication_jobs")
@Index(["status", "nextAttemptAt"])
export class PncpPublicationJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  auctionId!: string;

  @Column({ type: "uuid", nullable: true })
  agencyId?: string | null;

  @Column({ type: "varchar" })
  targetEndpoint!: string;

  @Column({ type: "jsonb" })
  payload!: Record<string, unknown>;

  @Column({ type: "varchar", default: PncpJobStatus.PENDING })
  status!: string;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "int", default: 5 })
  maxAttempts!: number;

  @Column({ type: "timestamptz", nullable: true })
  nextAttemptAt?: Date | null;

  @Column({ type: "text", nullable: true })
  lastError?: string | null;

  @Column({ type: "text", nullable: true })
  lastResponse?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
