import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Auction } from "./Auction";
import type { Bid } from "./Bid";

@Entity("lots")
export class Lot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  auctionId!: string;

  @ManyToOne("Auction", (a: Auction) => a.lots, { onDelete: "CASCADE" })
  @JoinColumn({ name: "auctionId" })
  auction!: Auction;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  /** All monetary values stored as integer cents (bigint) */
  @Column({ type: "bigint" })
  startingPriceCents!: string;

  @Column({ type: "bigint", default: "1" })
  minIncrementCents!: string;

  @OneToMany("Bid", (bid: Bid) => bid.lot, { cascade: true })
  bids!: Bid[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
