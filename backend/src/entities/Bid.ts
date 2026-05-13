import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Lot } from "./Lot";
import type { User } from "./User";

@Entity("bids")
export class Bid {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  lotId!: string;

  @ManyToOne("Lot", (lot: Lot) => lot.bids, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lotId" })
  lot!: Lot;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "bigint" })
  amountCents!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
