import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { Agency } from "./entities/Agency";
import { AuditLog } from "./entities/AuditLog";
import { Auction } from "./entities/Auction";
import { Bid } from "./entities/Bid";
import { Contract } from "./entities/Contract";
import { Lot } from "./entities/Lot";
import { OnboardingDecision } from "./entities/OnboardingDecision";
import { PasswordRecoveryRequest } from "./entities/PasswordRecoveryRequest";
import { Permission } from "./entities/Permission";
import { PncpPublicationJob } from "./entities/PncpPublicationJob";
import { Role } from "./entities/Role";
import { SupplierProfile } from "./entities/SupplierProfile";
import { Notification } from "./entities/Notification";
import { NotificationReply } from "./entities/NotificationReply";
import { Proposal } from "./entities/Proposal";
import { Solicitation } from "./entities/Solicitation";
import { ChatMessage } from "./entities/ChatMessage";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: false,
  logging: false,
  entities: [
    Agency,
    AuditLog,
    Auction,
    Bid,
    Contract,
    Lot,
    OnboardingDecision,
    PasswordRecoveryRequest,
    Permission,
    PncpPublicationJob,
    Role,
    Notification,
    NotificationReply,
    Proposal,
    Solicitation,
    ChatMessage,
    SupplierProfile,
    User,
  ],
  migrations: ["dist/migrations/*.js"],
  migrationsTableName: "typeorm_migrations",
});
