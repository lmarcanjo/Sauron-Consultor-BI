import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImportContextService } from "./ImportContextService";
import { WorkspaceRepository } from "../../modules/consultant-workspace/WorkspaceRepository";
import { ClientService } from "../../modules/consultant-workspace/ClientService";
import { EngagementService } from "../../modules/consultant-workspace/EngagementService";
import { OrganizationService } from "../../modules/consultant-workspace/OrganizationService";
import { EnterpriseRepository } from "../persistence/EnterpriseRepository";
import { DataSourceService } from "../datasource/DataSourceService";
import { LocalDataSourceRepository } from "../datasource/LocalDataSourceRepository";
import { LegacyEnterpriseMigrationService } from "../migrations/LegacyEnterpriseMigrationService";
import { PlatformUser } from "../identity/types";

const localStorageMock = (() => {
  let values: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => values[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { values[key] = value; }),
    removeItem: vi.fn((key: string) => { delete values[key]; }),
    clear: vi.fn(() => { values = {}; }),
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

const consultantA: PlatformUser = {
  id: "recovery-consultant-a",
  profile: { id: "recovery-consultant-a", fullName: "Consultor A", email: "a@recovery.local" },
  role: "CONSULTANT",
};

const consultantB: PlatformUser = {
  id: "recovery-consultant-b",
  profile: { id: "recovery-consultant-b", fullName: "Consultor B", email: "b@recovery.local" },
  role: "CONSULTANT",
};

describe("ImportContextService", () => {
  let workspaceRepository: WorkspaceRepository;
  let enterpriseRepository: EnterpriseRepository;
  let clientService: ClientService;
  let engagementService: EngagementService;
  let organizationService: OrganizationService;
  let importContextService: ImportContextService;

  beforeEach(() => {
    localStorageMock.clear();
    workspaceRepository = new WorkspaceRepository();
    enterpriseRepository = new EnterpriseRepository();
    clientService = new ClientService(workspaceRepository);
    engagementService = new EngagementService(workspaceRepository);
    organizationService = new OrganizationService(enterpriseRepository, workspaceRepository);
    const dataSourceService = new DataSourceService(
      new LocalDataSourceRepository(),
      workspaceRepository,
      organizationService,
      enterpriseRepository,
    );
    importContextService = new ImportContextService(
      workspaceRepository,
      organizationService,
      dataSourceService,
      new LegacyEnterpriseMigrationService(enterpriseRepository),
    );
  });

  it("bloqueia a importação sem Engajamento", async () => {
    const projection = await importContextService.resolveImportContext("", consultantA);
    expect(projection.canImport).toBe(false);
    expect(projection.blockingReasons[0]).toContain("Engajamento");
  });

  it("expõe somente a estrutura do Engajamento solicitado", async () => {
    const clientA = await clientService.createClient({ legalName: "Cliente A", document: "A" }, consultantA);
    const clientB = await clientService.createClient({ legalName: "Cliente B", document: "B" }, consultantA);
    const engagementA = await engagementService.createEngagement({ name: "Engajamento A", clientId: clientA.id }, consultantA);
    const engagementB = await engagementService.createEngagement({ name: "Engajamento B", clientId: clientB.id }, consultantA);
    const groupA = await organizationService.createGroup({ engagementId: engagementA.id, name: "Grupo A" }, consultantA);
    const groupB = await organizationService.createGroup({ engagementId: engagementB.id, name: "Grupo B" }, consultantA);
    const companyA = await organizationService.createCompany({ groupId: groupA.id, name: "Empresa A" }, consultantA);
    const unitA = await organizationService.createUnit({ companyId: companyA.id, name: "Unidade A" }, consultantA);

    const projection = await importContextService.resolveImportContext(engagementA.id, consultantA);
    const scopeIds = projection.availableOrganizationalScopes.map(scope => scope.id);

    expect(projection.canImport).toBe(true);
    expect(scopeIds).toEqual(expect.arrayContaining([groupA.id, companyA.id, unitA.id]));
    expect(scopeIds).not.toContain(groupB.id);
  });

  it("recusa o Engajamento de outro consultor e sinaliza legado sem vínculo", async () => {
    const client = await clientService.createClient({ legalName: "Cliente protegido", document: "C" }, consultantA);
    const engagement = await engagementService.createEngagement({ name: "Engajamento protegido", clientId: client.id }, consultantA);
    await enterpriseRepository.save({
      id: "legacy-unscoped-company",
      name: "Estrutura antiga",
      type: "Empresa",
      unitIds: [],
      archived: false,
    });

    const blocked = await importContextService.resolveImportContext(engagement.id, consultantB);
    expect(blocked.canImport).toBe(false);
    expect(blocked.engagement).toBeNull();
    expect(blocked.legacyMigrationStatus.status).toBe("LEGACY_DETECTED");
    expect(blocked.availableOrganizationalScopes).toHaveLength(0);
  });
});
