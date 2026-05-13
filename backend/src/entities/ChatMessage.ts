import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Auction } from "./Auction";
import type { User } from "./User";

export enum ChatMessageType {
  USER = "USER",
  SYSTEM = "SYSTEM",
  AUCTIONEER = "AUCTIONEER",
}

@Entity("chat_messages")
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  auctionId!: string;

  @ManyToOne("Auction", { onDelete: "CASCADE" })
  @JoinColumn({ name: "auctionId" })
  auction!: Auction;

  @Column({ type: "uuid", nullable: true })
  userId?: string | null;

  @ManyToOne("User", { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "userId" })
  user?: User | null;

  @Column({ type: "varchar" })
  senderName!: string;

  @Column({ type: "varchar", default: ChatMessageType.USER })
  type!: string;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
