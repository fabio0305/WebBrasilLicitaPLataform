import { AppDataSource } from "../data-source";
import { Auction } from "../entities/Auction";
import { User } from "../entities/User";
import { getIo } from "./io";
import { roomAgencyDashboard } from "./rooms";

type AlertSeverity = "info" | "warning" | "critical";

type AuctionAlertReason =
  | "MANUAL_SCHEDULED" | "AUTO_SCHEDULED" | "MANUAL_OPENED"
  | "AUTO_OPENED" | "ANTI_SNIPING" | "CLOSED";

function buildAuctionAlertMessage(reason: AuctionAlertReason): { message: string; severity: AlertSeverity } {
  switch (reason) {
    case "MANUAL_SCHEDULED": return { message: "Pregão agendado manualmente.", severity: "info" };
    case "AUTO_SCHEDULED": return { message: "Pregão agendado automaticamente.", severity: "info" };
    case "MANUAL_OPENED": return { message: "Pregão aberto manualmente.", severity: "info" };
    case "AUTO_OPENED": return { message: "Pregão aberto automaticamente.", severity: "info" };
    case "ANTI_SNIPING": return { message: "Prazo prorrogado por lance de último minuto.", severity: "warning" };
    case "CLOSED": return { message: "Pregão encerrado.", severity: "critical" };
  }
}

export function mapAuctionOperationalPhase(status: string): string {
  switch (status) {
    case "DRAFT": return "Preparatória";
    case "SCHEDULED": return "Publicado";
    case "OPEN": return "Em disputa";
    case "CLOSED": return "Encerrado";
    default: return status;
  }
}

export async function emitAgencyDashboardAuctionAlert(
  auction: Auction,
  reason: AuctionAlertReason
) {
  try {
    if (!auction.createdByUserId) return;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: auction.createdByUserId },
    });
    if (!user?.agencyId) return;
    const { message, severity } = buildAuctionAlertMessage(reason);
    getIo().to(roomAgencyDashboard(user.agencyId)).emit("auction:alert", {
      auctionId: auction.id,
      title: auction.title,
      phase: mapAuctionOperationalPhase(auction.status),
      message,
      severity,
    });
  } catch { /* non-critical */ }
}
