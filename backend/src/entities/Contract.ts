import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum ContractStatus {
  ACTIVE = "ACTIVE",
  EXPIRING = "EXPIRING",
  EXPIRED = "EXPIRED",
  TERMINATED = "TERMINATED",
}

export enum ContractRecordType {
  CONTRACT = "CONTRACT",
  ARP = "ARP",
}

@Entity("contracts")
@Index(["agencyId", "status", "endsAt"])
export class Contract {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  agencyId!: string;

  @Column({ type: "uuid", nullable: true })
  auctionId?: string | null;

  @Column({ type: "varchar" })
  contractNumber!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar", nullable: true })
  supplierName?: string | null;

  @Column({ type: "varchar", nullable: true })
  managerName?: string | null;

  @Column({ type: "varchar" })
  startsAt!: string;

  @Column({ type: "varchar" })
  endsAt!: string;

  @Column({ type: "varchar", default: ContractStatus.ACTIVE })
  status!: string;

  @Column({ type: "bigint", nullable: true })
  totalValueCents?: string | null;

  @Column({ type: "varchar", default: ContractRecordType.CONTRACT })
  recordType!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
