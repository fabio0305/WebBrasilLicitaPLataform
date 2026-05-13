import "reflect-metadata";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { AppDataSource } from "./data-source";
import { createApp } from "./app";
import { env } from "./config/env";
import { createRedisClient } from "./redis";
import { setIo } from "./realtime/io";
import { seedRbacDefaults } from "./rbac/seed";
import { seedAgencyDefaults } from "./agencies/seed";
import { seedAuctionDefaults } from "./auctions/seed";
import { seedContractDefaults } from "./contracts/seed";
import { User, UserRole, OnboardingStatus } from "./entities/User";
import { hashPassword } from "./auth/password";
import { Auction, AuctionStatus } from "./entities/Auction";
import { emitAgencyDashboardAuctionAlert } from "./realtime/agencyDashboard";
import { getCookie } from "./auth/cookies";
import { getSession } from "./auth/sessions";
import { startPncpWorker } from "./services/pncp";
import { roomAuction, roomLot, roomAgencyDashboard } from "./realtime/rooms";
import { getIo } from "./realtime/io";
import { emitPublicStats } from "./routes/publicStats";

async function initDatabase(retries = 15): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await AppDataSource.initialize();
      console.log("Database connected.");
      return;
    } catch (err) {
      console.warn(`DB connect attempt ${i}/${retries} failed:`, (err as Error).message);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function runMigrations(): Promise<void> {
  const pending = await AppDataSource.showMigrations();
  if (pending) {
    console.log("Running pending migrations...");
    await AppDataSource.runMigrations({ transaction: "all" });
    console.log("Migrations complete.");
  } else {
    console.log("No pending migrations.");
  }
}

async function seedAdmin(): Promise<void> {
  const { seedEmail, seedPassword, seedName } = env.admin;
  if (!seedEmail || !seedPassword) return;
  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email: seedEmail } });
  if (existing) return;
  const passwordHash = await hashPassword(seedPassword);
  await userRepo.save(
    userRepo.create({
      email: seedEmail,
      name: seedName ?? "Administrador",
      passwordHash,
      role: UserRole.ADMIN,
      onboardingStatus: OnboardingStatus.APPROVED,
      active: true,
    })
  );
  console.log(`Admin user seeded: ${seedEmail}`);
}

function startAuctionAutomation(): void {
  setInterval(async () => {
    try {
      const auctionRepo = AppDataSource.getRepository(Auction);
      const now = new Date();

      const toOpen = await auctionRepo
        .createQueryBuilder("a")
        .where("a.status = :status", { status: AuctionStatus.SCHEDULED })
        .andWhere("a.startsAt <= :now", { now })
        .getMany();

      let statsChanged = false;
      for (const auction of toOpen) {
        auction.status = AuctionStatus.OPEN;
        await auctionRepo.save(auction);
        await emitAgencyDashboardAuctionAlert(auction, "AUTO_OPENED");
        getIo().to(roomAuction(auction.id)).emit("auction:statusChanged", {
          auctionId: auction.id,
          status: AuctionStatus.OPEN,
        });
        statsChanged = true;
      }

      const toClose = await auctionRepo
        .createQueryBuilder("a")
        .where("a.status IN (:...statuses)", { statuses: [AuctionStatus.OPEN, AuctionStatus.SCHEDULED] })
        .andWhere("a.endsAt <= :now", { now })
        .getMany();

      for (const auction of toClose) {
        auction.status = AuctionStatus.CLOSED;
        await auctionRepo.save(auction);
        await emitAgencyDashboardAuctionAlert(auction, "CLOSED");
        getIo().to(roomAuction(auction.id)).emit("auction:statusChanged", {
          auctionId: auction.id,
          status: AuctionStatus.CLOSED,
        });
        statsChanged = true;
      }

      if (statsChanged) void emitPublicStats();
    } catch (err) {
      console.error("Auction automation error:", err);
    }
  }, env.auction.autoCloseIntervalMs);
}

async function main() {
  await initDatabase();
  await runMigrations();
  await seedRbacDefaults();
  await seedAgencyDefaults();
  await seedAuctionDefaults();
  await seedContractDefaults();
  await seedAdmin();

  const app = createApp();
  const server = http.createServer(app);

  const pubClient = createRedisClient();
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);

  const io = new SocketIOServer(server, {
    cors: { origin: env.app.corsOrigin || env.app.publicUrl, credentials: true },
    path: "/socket.io",
  });
  io.adapter(createAdapter(pubClient, subClient));
  setIo(io);

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie ?? "";
      const fakeCookieName = env.session.cookieName;
      const parts = cookieHeader.split(";").map((p) => p.trim());
      let sid: string | undefined;
      for (const p of parts) {
        const idx = p.indexOf("=");
        if (idx < 0) continue;
        if (decodeURIComponent(p.slice(0, idx).trim()) === fakeCookieName) {
          sid = decodeURIComponent(p.slice(idx + 1).trim());
        }
      }
      if (!sid) return next(new Error("UNAUTHENTICATED"));
      const session = await getSession(sid);
      if (!session) return next(new Error("UNAUTHENTICATED"));
      const socketData = socket as unknown as Record<string, unknown>;
      socketData["userId"] = session.userId;
      // Eagerly load user to get role and agencyId for room authorization
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: session.userId, active: true } });
      if (!user) return next(new Error("UNAUTHENTICATED"));
      socketData["userRole"] = user.role;
      socketData["userAgencyId"] = user.agencyId ?? null;
      return next();
    } catch { return next(new Error("AUTH_ERROR")); }
  });

  io.on("connection", (socket) => {
    const socketData = socket as unknown as Record<string, unknown>;
    const userRole = socketData["userRole"] as string | undefined;
    const userAgencyId = socketData["userAgencyId"] as string | null;
    const isAgencyStaff = ["ADMIN", "AGENCY_ADMIN", "AUCTIONEER", "AUTHORITY", "SUPPORT"].includes(userRole ?? "");

    socket.on("auction:join", (auctionId: string) => { socket.join(roomAuction(auctionId)); });
    socket.on("auction:leave", (auctionId: string) => { socket.leave(roomAuction(auctionId)); });
    socket.on("lot:join", (lotId: string) => { socket.join(roomLot(lotId)); });
    socket.on("lot:leave", (lotId: string) => { socket.leave(roomLot(lotId)); });
    socket.on("agency-dashboard:join", (agencyId: string) => {
      if (userRole === "ADMIN" || (isAgencyStaff && userAgencyId === agencyId)) {
        socket.join(roomAgencyDashboard(agencyId));
      }
    });
    socket.on("agency-dashboard:leave", (agencyId: string) => { socket.leave(roomAgencyDashboard(agencyId)); });
  });

  startAuctionAutomation();
  startPncpWorker();

  server.listen(env.app.port, () => {
    console.log(`Server listening on port ${env.app.port}`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
