import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string | null;

  @Column({ type: "uuid", nullable: true })
  agencyId?: string | null;

  @Column({ type: "varchar", nullable: true })
  actorRole?: string | null;

  @Column({ type: "varchar", length: 12 })
  method!: string;

  @Column({ type: "varchar" })
  endpoint!: string;

  @Column({ type: "varchar", nullable: true })
  ipAddress?: string | null;

  @Column({ type: "int" })
  statusCode!: number;

  @Column({ type: "varchar" })
  action!: string;

  @Column({ type: "jsonb", nullable: true })
  previousPayload?: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true })
  nextPayload?: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
