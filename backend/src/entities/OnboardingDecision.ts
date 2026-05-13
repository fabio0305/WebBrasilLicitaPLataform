import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("onboarding_decisions")
export class OnboardingDecision {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  targetUserId?: string | null;

  @Column({ type: "varchar" })
  targetEmail!: string;

  @Column({ type: "varchar", nullable: true })
  targetName?: string | null;

  @Column({ type: "varchar", nullable: true })
  requestedRole?: string | null;

  @Column({ type: "varchar", nullable: true })
  requestedAgencyName?: string | null;

  @Column({ type: "varchar" })
  decision!: string;

  @Column({ type: "varchar", nullable: true })
  resultingRole?: string | null;

  @Column({ type: "uuid", nullable: true })
  resultingAgencyId?: string | null;

  @Column({ type: "varchar", nullable: true })
  resultingAgencyName?: string | null;

  @Column({ type: "uuid", nullable: true })
  decidedByUserId?: string | null;

  @Column({ type: "varchar", nullable: true })
  decidedByEmail?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
