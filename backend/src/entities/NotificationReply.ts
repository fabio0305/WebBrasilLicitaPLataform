import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("notification_replies")
export class NotificationReply {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  notificationId!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "timestamptz", nullable: true })
  readByAdminAt?: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
