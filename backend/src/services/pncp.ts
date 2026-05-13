import { AppDataSource } from "../data-source";
import { Auction } from "../entities/Auction";
import { PncpPublicationJob, PncpJobStatus } from "../entities/PncpPublicationJob";
import { env } from "../config/env";

export async function enqueuePncpPublication(auction: Auction, agencyId: string | null) {
  if (!env.pncp.enabled) return;
  const repo = AppDataSource.getRepository(PncpPublicationJob);
  const job = repo.create({
    auctionId: auction.id,
    agencyId,
    targetEndpoint: `${env.pncp.baseUrl}/contratos-publicos`,
    payload: {
      tenant: { agencyId },
      processo: {
        id: auction.id,
        title: auction.title,
        status: auction.status,
        startsAt: auction.startsAt?.toISOString() ?? null,
        endsAt: auction.endsAt?.toISOString() ?? null,
      },
    },
    status: PncpJobStatus.PENDING,
    maxAttempts: env.pncp.maxAttempts,
    nextAttemptAt: new Date(),
  });
  await repo.save(job);
}

export function startPncpWorker() {
  if (!env.pncp.enabled) return;
  setInterval(async () => {
    const repo = AppDataSource.getRepository(PncpPublicationJob);
    const jobs = await repo
      .createQueryBuilder("j")
      .where("j.status IN (:...statuses)", { statuses: [PncpJobStatus.PENDING, PncpJobStatus.RETRYING] })
      .andWhere("(j.nextAttemptAt IS NULL OR j.nextAttemptAt <= :now)", { now: new Date() })
      .take(10)
      .getMany();

    for (const job of jobs) {
      job.status = PncpJobStatus.PROCESSING;
      job.attempts += 1;
      await repo.save(job);
      try {
        const r = await fetch(job.targetEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.pncp.bearerToken}`,
          },
          body: JSON.stringify(job.payload),
          signal: AbortSignal.timeout(30000),
        });
        const body = await r.text();
        if (r.ok) {
          job.status = PncpJobStatus.SUCCEEDED;
          job.lastResponse = body;
        } else {
          throw new Error(`HTTP ${r.status}: ${body}`);
        }
      } catch (err) {
        job.lastError = String(err);
        if (job.attempts >= job.maxAttempts) {
          job.status = PncpJobStatus.FAILED;
        } else {
          job.status = PncpJobStatus.RETRYING;
          const delay = Math.min(
            env.pncp.maxRetryDelayMs,
            env.pncp.baseRetryDelayMs * 2 ** (job.attempts - 1)
          );
          job.nextAttemptAt = new Date(Date.now() + delay);
        }
      }
      await repo.save(job);
    }
  }, env.pncp.workerIntervalMs);
}
