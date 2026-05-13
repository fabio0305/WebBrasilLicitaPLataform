import { AppDataSource } from "../data-source";
import { Auction, AuctionStatus } from "../entities/Auction";
import { Lot } from "../entities/Lot";

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setUTCHours(14, 0, 0, 0);
  return d;
}

const DEFAULT_AUCTIONS = [
  {
    title: "Pregão Eletrônico - Notebooks Educacionais",
    description: "Aquisição de notebooks para laboratórios de informática.",
    status: AuctionStatus.OPEN,
    startsAt: addDays(-1),
    endsAt: addDays(2),
    lots: [{ title: "Lote 1 - 50 Notebooks Core i5", startingPriceCents: "250000000", minIncrementCents: "100000" }],
  },
  {
    title: "Concorrência Eletrônica - Reforma UBS",
    description: "Reforma e ampliação de Unidade Básica de Saúde.",
    status: AuctionStatus.SCHEDULED,
    startsAt: addDays(10),
    endsAt: addDays(11),
    lots: [{ title: "Reforma estrutural e elétrica", startingPriceCents: "180000000000", minIncrementCents: "1000000" }],
  },
  {
    title: "Dispensa Eletrônica - No-breaks",
    description: "Fornecimento de no-breaks para servidores.",
    status: AuctionStatus.OPEN,
    startsAt: addDays(-2),
    endsAt: addDays(1),
    lots: [{ title: "20 No-breaks 1500VA", startingPriceCents: "8000000", minIncrementCents: "50000" }],
  },
  {
    title: "Credenciamento - Laboratórios",
    description: "Credenciamento de laboratórios para análises clínicas.",
    status: AuctionStatus.SCHEDULED,
    startsAt: addDays(15),
    endsAt: addDays(16),
    lots: [{ title: "Serviços de Análise Clínica", startingPriceCents: "50000000", minIncrementCents: "100000" }],
  },
  {
    title: "Leilão - Veículos Inservíveis",
    description: "Alienação de veículos da frota municipal.",
    status: AuctionStatus.CLOSED,
    startsAt: addDays(-10),
    endsAt: addDays(-8),
    lots: [{ title: "Lote A - 5 Veículos Leves", startingPriceCents: "5000000", minIncrementCents: "50000" }],
  },
];

export async function seedAuctionDefaults() {
  const auctionRepo = AppDataSource.getRepository(Auction);
  const lotRepo = AppDataSource.getRepository(Lot);
  for (const item of DEFAULT_AUCTIONS) {
    const existing = await auctionRepo.findOne({ where: { title: item.title } });
    if (existing) continue;
    const auction = auctionRepo.create({
      title: item.title,
      description: item.description,
      status: item.status,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
    });
    await auctionRepo.save(auction);
    for (const lotDef of item.lots) {
      await lotRepo.save(lotRepo.create({ ...lotDef, auctionId: auction.id }));
    }
  }
}
