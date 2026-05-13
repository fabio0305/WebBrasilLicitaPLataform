import { AppDataSource } from "../data-source";
import { Agency, AgencySphere, AgencyEntityType, LegalFramework } from "../entities/Agency";

const DEFAULT_AGENCIES = [
  { code: "PMC-PR", name: "Prefeitura Municipal de Curitiba", city: "Curitiba", state: "PR", sphere: AgencySphere.MUNICIPAL, entityType: AgencyEntityType.ADMINISTRACAO_DIRETA, legalFramework: LegalFramework.LEI_14133, description: "Compras e contratos da Prefeitura de Curitiba." },
  { code: "PBH-MG", name: "Prefeitura de Belo Horizonte", city: "Belo Horizonte", state: "MG", sphere: AgencySphere.MUNICIPAL, entityType: AgencyEntityType.ADMINISTRACAO_DIRETA, legalFramework: LegalFramework.LEI_14133, description: "Licitações da Prefeitura de Belo Horizonte." },
  { code: "GESP-SP", name: "Governo do Estado de São Paulo - Compras", city: "São Paulo", state: "SP", sphere: AgencySphere.ESTADUAL, entityType: AgencyEntityType.ADMINISTRACAO_DIRETA, legalFramework: LegalFramework.LEI_14133, description: "Portal de compras do Governo do Estado de SP." },
  { code: "TJGO-GO", name: "Tribunal de Justiça de Goiás", city: "Goiânia", state: "GO", sphere: AgencySphere.ESTADUAL, entityType: AgencyEntityType.AUTARQUIA, legalFramework: LegalFramework.REGULAMENTO_PROPRIO, description: "Licitações do TJ-GO." },
  { code: "CMR-PE", name: "Câmara Municipal do Recife", city: "Recife", state: "PE", sphere: AgencySphere.MUNICIPAL, entityType: AgencyEntityType.ADMINISTRACAO_DIRETA, legalFramework: LegalFramework.LEI_14133, description: "Compras da Câmara do Recife." },
  { code: "SESA-CE", name: "Secretaria da Saúde do Ceará", city: "Fortaleza", state: "CE", sphere: AgencySphere.ESTADUAL, entityType: AgencyEntityType.ADMINISTRACAO_DIRETA, legalFramework: LegalFramework.LEI_14133, description: "Aquisições da SESA-CE." },
];

export async function seedAgencyDefaults() {
  const repo = AppDataSource.getRepository(Agency);
  for (const item of DEFAULT_AGENCIES) {
    const existing = await repo.findOne({ where: { code: item.code } });
    if (!existing) {
      await repo.save(repo.create({ ...item, active: true }));
    }
  }
}
