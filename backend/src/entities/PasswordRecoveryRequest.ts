import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum PasswordRecoveryRequestStatus {
  REQUESTED = "REQUESTED",
  LINK_READY = "LINK_READY",
  EMAIL_SENT = "EMAIL_SENT",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum PasswordRecoveryDeliveryChannel {
  INTERNAL = "INTERNAL",
  MANUAL_LINK = "MANUAL_LINK",
  EMAIL = "EMAIL",
}

@Entity("password_recovery_requests")
export class PasswordRecoveryRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 11 })
  cpfNormalized!: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string | null;

  @Column({ type: "varchar", default: PasswordRecoveryRequestStatus.REQUESTED })
  status!: string;

  @Column({ type: "varchar", nullable: true })
  deliveryChannel?: string | null;

  @Column({ type: "varchar", nullable: true, select: false })
  recoveryTokenHash?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  tokenExpiresAt?: Date | null;

  @Column({ type: "uuid", nullable: true })
  resolvedByUserId?: string | null;

  @Column({ type: "text", nullable: true })
  resolutionNotes?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
