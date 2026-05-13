import { AppDataSource } from "../data-source";
import { Agency } from "../entities/Agency";
import { Contract, ContractStatus } from "../entities/Contract";

const DEFAULT_CONTRACTS = [
  { agencyCode: "PMC-PR", contractNumber: "CTR-2026-014", title: "Manutenção da infraestrutura da sala do pregoeiro", supplierName: "Infra Gov Soluções Ltda", startsAt: "2026-01-10", endsAt: "2026-05-20", totalValueCents: "12800000", managerName: "Carla Menezes" },
  { agencyCode: "PBH-MG", contractNumber: "CTR-2026-031", title: "Plataforma de notificações e comunicação institucional", supplierName: "Rede Pública Digital S/A", startsAt: "2026-02-01", endsAt: "2026-06-15", totalValueCents: "20990000", managerName: "Ricardo Tavares" },
  { agencyCode: "SESA-CE", contractNumber: "CTR-2026-087", title: "Fornecimento de equipamentos para suporte remoto", supplierName: "SaudeNet Comercio e Serviços", startsAt: "2026-01-22", endsAt: "2026-04-25", totalValueCents: "58400000", managerName: "Helena Andrade" },
];

function resolveStatus(endsAt: string): string {
  const today = new Date();
  const end = new Date(`${endsAt}T23:59:59Z`);
  if (end.getTime() < today.getTime()) return ContractStatus.EXPIRED;
  if (end.getTime() <= today.getTime() + 60 * 24 * 60 * 60 * 1000) return ContractStatus.EXPIRING;
  return ContractStatus.ACTIVE;
}

export async function seedContractDefaults() {
  const contractRepo = AppDataSource.getRepository(Contract);
  const agencyRepo = AppDataSource.getRepository(Agency);
  for (const item of DEFAULT_CONTRACTS) {
    const agency = await agencyRepo.findOne({ where: { code: item.agencyCode } });
    if (!agency) continue;
    const existing = await contractRepo.findOne({ where: { agencyId: agency.id, contractNumber: item.contractNumber } });
    if (existing) continue;
    await contractRepo.save(contractRepo.create({ ...item, agencyId: agency.id, status: resolveStatus(item.endsAt) }));
  }
}
