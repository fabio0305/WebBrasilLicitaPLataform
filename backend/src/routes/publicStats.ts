import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Auction, AuctionStatus } from "../entities/Auction";
import { Agency } from "../entities/Agency";
import { Contract } from "../entities/Contract";
import { User, UserRole } from "../entities/User";
import { asyncHandler } from "../utils/asyncHandler";
import { getIo } from "../realtime/io";

export const publicStatsRouter = Router();

export async function getPublicStats() {
  const auctionRepo  = AppDataSource.getRepository(Auction);
  const agencyRepo   = AppDataSource.getRepository(Agency);
  const contractRepo = AppDataSource.getRepository(Contract);
  const userRepo     = AppDataSource.getRepository(User);

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86_400_000);

  const [
    activeAuctions,
    closingToday,
    newToday,
    totalAuctions,
    totalAgencies,
    totalSuppliers,
    contractValueResult,
  ] = await Promise.all([
    // card painel
    auctionRepo.count({ where: { status: AuctionStatus.OPEN } }),
    auctionRepo
      .createQueryBuilder("a")
      .where("a.status = :status", { status: AuctionStatus.OPEN })
      .andWhere("a.endsAt >= :start", { start: todayStart })
      .andWhere("a.endsAt < :end", { end: todayEnd })
      .getCount(),
    auctionRepo
      .createQueryBuilder("a")
      .where("a.createdAt >= :start", { start: todayStart })
      .andWhere("a.createdAt < :end", { end: todayEnd })
      .getCount(),
    // stats grid
    auctionRepo
      .createQueryBuilder("a")
      .where("a.status != :draft", { draft: AuctionStatus.DRAFT })
      .getCount(),
    agencyRepo.count(),
    userRepo.count({ where: { role: UserRole.SUPPLIER } }),
    AppDataSource.query<[{ total: string }]>(
      `SELECT COALESCE(SUM("totalValueCents"), 0)::text AS total FROM contracts`
    ),
  ]);

  const totalContractValueCents = BigInt(contractValueResult?.[0]?.total ?? "0");
  const totalContractValueBillions = Number(totalContractValueCents) / 100 / 1_000_000_000;

  return {
    // card painel de licitações
    activeAuctions,
    closingToday,
    newToday,
    // stats grid
    totalAuctions,
    totalContractValueBillions: Math.round(totalContractValueBillions * 10) / 10,
    totalAgencies,
    totalSuppliers,
  };
}

export async function emitPublicStats() {
  try {
    const stats = await getPublicStats();
    getIo().emit("public:statsUpdated", stats);
  } catch (_) {
    // não bloqueia o fluxo principal
  }
}

publicStatsRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    return res.json(await getPublicStats());
  })
);
