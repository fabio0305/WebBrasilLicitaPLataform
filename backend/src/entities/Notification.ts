import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum NotificationCategory {
  FINANCEIRO = "FINANCEIRO",
  SEGURANCA = "SEGURANCA",
  PREGAO = "PREGAO",
  DOCUMENTOS = "DOCUMENTOS",
  GERAL = "GERAL",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", default: NotificationCategory.GERAL })
  category!: string;

  @Column({ type: "varchar", default: "ALL" })
  targetRole!: string;

  @Column({ type: "uuid", nullable: true })
  targetUserId?: string | null;

  @Column({ type: "uuid", nullable: true })
  sentByUserId?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
