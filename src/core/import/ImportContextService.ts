import { ClientEntity, WorkspaceProject } from "../../modules/consultant-workspace/types";
import { ClientService } from "../../modules/consultant-workspace/ClientService";
import { EngagementService } from "../../modules/consultant-workspace/EngagementService";
import { OrganizationService } from "../../modules/consultant-workspace/OrganizationService";
import { WorkspaceRepository } from "../../modules/consultant-workspace/WorkspaceRepository";
import { DataSource } from "../datasource/DataSource";
import { DataSourceService } from "../datasource/DataSourceService";
import { ScopeType } from "../datasource/types";
import { Enterprise, BusinessGroup, Company, Unit } from "../persistence/EnterpriseRepository";
import { identityEngine } from "../identity/IdentityEngine";
import { PlatformUser } from "../identity/types";
import { LegacyEnterpriseMigrationService, LegacyMigrationStatus } from "../migrations/LegacyEnterpriseMigrationService";

export interface ImportOrganizationalScope {
  id: string;
  name: string;
  type: Enterprise["type"];
  scopeType: ScopeType;
  targetId: string;
  engagementId: string;
  parentId?: string;
  groupId?: string;
  companyId?: string;
  unitId?: string;
}

export interface ImportContextProjection {
  client: ClientEntity | null;
  engagement: WorkspaceProject | null;
  availableOrganizationalScopes: ImportOrganizationalScope[];
  selectedScope: ImportOrganizationalScope | null;
  availableDataSources: DataSource[];
  canImport: boolean;
  blockingReasons: string[];
  warnings: string[];
  legacyMigrationStatus: LegacyMigrationStatus;
}

export interface SelectedImportScope {
  groupId?: string;
  companyId?: string;
  unitId?: string;
}

export class ImportContextService {
  public readonly clientService: ClientService;
  public readonly engagementService: EngagementService;
  public readonly organizationService: OrganizationService;
  public readonly dataSourceService: DataSourceService;
  public readonly legacyMigrationService: LegacyEnterpriseMigrationService;

  constructor(
    workspaceRepository: WorkspaceRepository = new WorkspaceRepository(),
    organizationService: OrganizationService = new OrganizationService(undefined, workspaceRepository),
    dataSourceService?: DataSourceService,
    legacyMigrationService: LegacyEnterpriseMigrationService = new LegacyEnterpriseMigrationService()
  ) {
    this.clientService = new ClientService(workspaceRepository);
    this.engagementService = new EngagementService(workspaceRepository);
    this.organizationService = organizationService;
    this.dataSourceService = dataSourceService || new DataSourceService(undefined, workspaceRepository, organizationService);
    this.legacyMigrationService = legacyMigrationService;
  }

  async resolveImportContext(
    engagementId: string,
    currentUser: PlatformUser | null = identityEngine.getCurrentUser()
  ): Promise<ImportContextProjection> {
    const blockingReasons: string[] = [];
    const warnings: string[] = [];
    const legacyMigrationStatus = await this.legacyMigrationService.inspect();

    if (!engagementId?.trim()) {
      return {
        client: null,
        engagement: null,
        availableOrganizationalScopes: [],
        selectedScope: null,
        availableDataSources: [],
        canImport: false,
        blockingReasons: ["Selecione um Engajamento antes de importar."],
        warnings: legacyMigrationStatus.status === "LEGACY_DETECTED"
          ? ["Existem registros antigos aguardando associação explícita a um Engajamento."]
          : [],
        legacyMigrationStatus,
      };
    }

    let engagement: WorkspaceProject | null = null;
    try {
      engagement = await this.engagementService.getEngagementById(engagementId, currentUser);
    } catch (error) {
      blockingReasons.push(
        error instanceof Error && error.message.includes("Acesso negado")
          ? "O Engajamento selecionado não está disponível para este consultor."
          : "Não foi possível carregar o Engajamento selecionado."
      );
    }
    if (!engagement) {
      blockingReasons.push("O Engajamento selecionado não está disponível para este consultor.");
    }

    const client = engagement?.clientId
      ? await this.clientService.getClientById(engagement.clientId, currentUser)
      : null;
    if (!client) {
      blockingReasons.push("O Engajamento precisa estar associado a um Cliente disponível.");
    }

    const availableOrganizationalScopes = engagement
      ? await this.listScopes(engagement.id, currentUser)
      : [];
    if (availableOrganizationalScopes.length === 0) {
      blockingReasons.push("Crie um Grupo, Empresa ou Unidade neste Engajamento antes de importar.");
    }

    if (legacyMigrationStatus.status === "LEGACY_DETECTED") {
      warnings.push("Há registros antigos fora de um Engajamento. Eles não serão usados nesta importação.");
    }

    const availableDataSources = engagement
      ? await this.dataSourceService.listDataSourcesByEngagement(engagement.id, currentUser)
      : [];

    return {
      client,
      engagement,
      availableOrganizationalScopes,
      selectedScope: availableOrganizationalScopes[0] || null,
      availableDataSources,
      canImport: blockingReasons.length === 0,
      blockingReasons,
      warnings,
      legacyMigrationStatus,
    };
  }

  resolveSelectedScope(
    projection: ImportContextProjection,
    selected: SelectedImportScope
  ): ImportOrganizationalScope {
    const selectedId = selected.unitId || selected.companyId || selected.groupId;
    const scope = projection.availableOrganizationalScopes.find(item => item.id === selectedId);
    if (!scope) {
      throw new Error("Escolha um Grupo, Empresa ou Unidade pertencente ao Engajamento antes de importar.");
    }
    return scope;
  }

  private async listScopes(engagementId: string, currentUser: PlatformUser | null): Promise<ImportOrganizationalScope[]> {
    const groups = await this.organizationService.listGroupsByEngagement(engagementId, currentUser);
    const scopes: ImportOrganizationalScope[] = groups.map(group => this.groupScope(group, engagementId));

    for (const group of groups) {
      const companies = await this.organizationService.listCompaniesByGroup(group.id, currentUser);
      for (const company of companies) {
        scopes.push(this.companyScope(company, engagementId, group.id));
        const units = await this.organizationService.listUnitsByCompany(company.id, currentUser);
        scopes.push(...units.map(unit => this.unitScope(unit, engagementId, group.id, company.id)));
      }
    }

    return scopes;
  }

  private groupScope(group: BusinessGroup, engagementId: string): ImportOrganizationalScope {
    return {
      id: group.id,
      name: group.name,
      type: group.type,
      scopeType: "GROUP",
      targetId: group.id,
      engagementId,
      groupId: group.id,
    };
  }

  private companyScope(company: Company, engagementId: string, groupId: string): ImportOrganizationalScope {
    return {
      id: company.id,
      name: company.name,
      type: company.type,
      scopeType: "COMPANY",
      targetId: company.id,
      engagementId,
      parentId: groupId,
      groupId,
      companyId: company.id,
    };
  }

  private unitScope(unit: Unit, engagementId: string, groupId: string, companyId: string): ImportOrganizationalScope {
    return {
      id: unit.id,
      name: unit.name,
      type: unit.type,
      scopeType: "UNIT",
      targetId: unit.id,
      engagementId,
      parentId: companyId,
      groupId,
      companyId,
      unitId: unit.id,
    };
  }
}

export const importContextService = new ImportContextService();
