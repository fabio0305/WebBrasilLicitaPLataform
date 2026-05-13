import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { User } from "./User";

export enum AgencySphere {
  MUNICIPAL = "MUNICIPAL",
  ESTADUAL = "ESTADUAL",
  FEDERAL = "FEDERAL",
}

export enum AgencyEntityType {
  ADMINISTRACAO_DIRETA = "ADMINISTRACAO_DIRETA",
  AUTARQUIA = "AUTARQUIA",
  FUNDACAO = "FUNDACAO",
  EMPRESA_PUBLICA = "EMPRESA_PUBLICA",
  SOCIEDADE_MISTA = "SOCIEDADE_MISTA",
  SISTEMA_S = "SISTEMA_S",
}

export enum LegalFramework {
  LEI_14133 = "LEI_14133",
  LEI_13303 = "LEI_13303",
  REGULAMENTO_PROPRIO = "REGULAMENTO_PROPRIO",
}

@Entity("agencies")
export class Agency {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true, unique: true })
  cnpj?: string | null;

  @Column({ type: "varchar", nullable: true, unique: true })
  code?: string | null;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", nullable: true })
  officialName?: string | null;

  @Column({ type: "varchar", nullable: true })
  city?: string | null;

  @Column({ type: "varchar", length: 2, nullable: true })
  state?: string | null;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @Column({ type: "varchar", nullable: true })
  sphere?: string | null;

  @Column({ type: "varchar", nullable: true })
  entityType?: string | null;

  @Column({ type: "varchar", nullable: true })
  legalFramework?: string | null;

  @Column({ type: "int", default: 60 })
  contractAlertWindowDays!: number;

  @Column({ type: "jsonb", nullable: true })
  tenantSettings?: Record<string, unknown> | null;

  @OneToMany("User", (user: User) => user.agency)
  users!: User[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
