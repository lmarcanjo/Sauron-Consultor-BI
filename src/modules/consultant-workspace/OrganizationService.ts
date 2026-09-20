import { EnterpriseRepository, BusinessGroup, Company, Unit, Enterprise } from '../../core/persistence/EnterpriseRepository';
import { WorkspaceRepository } from './WorkspaceRepository';
import { identityEngine } from '../../core/identity/IdentityEngine';
import { PlatformUser } from '../../core/identity/types';
import { auditEngine } from '../../core/audit/AuditEngine';
import { dispatchPlatformEvent } from '../../core/events/PlatformEvents';

export interface CreateGroupDTO {
  engagementId: string;
  name: string;
  segment?: string;
  cnpj?: string;
  notes?: string;
}

export interface CreateCompanyDTO {
  groupId: string;
  name: string;
  type?: "Empresa" | "Fazenda" | "Loja" | "Filial" | "Unidade" | "Outro";
  segment?: string;
  cnpj?: string;
  notes?: string;
}

export interface CreateUnitDTO {
  companyId: string;
  name: string;
  type?: "Unidade" | "Fazenda" | "Loja" | "Filial" | "Outro";
  segment?: string;
  cnpj?: string;
  notes?: string;
}

export class OrganizationService {
  private workspaceRepository: WorkspaceRepository;

  constructor(
    private enterpriseRepository: EnterpriseRepository = new EnterpriseRepository(),
    workspaceRepository?: WorkspaceRepository
  ) {
    this.workspaceRepository = workspaceRepository || new WorkspaceRepository();
  }

  /**
   * Valida autorização: garante que o consultor ativo possui acesso ao Engajamento fornecido
   */
  private async validateEngagementAccess(engagementId: string, user: PlatformUser | null): Promise<void> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    if (!currentUser) return; // Ambiente de teste legado sem usuário logado

    const project = await this.workspaceRepository.getProject(engagementId);
    if (!project) {
      throw new Error(`Engajamento ID ${engagementId} não encontrado.`);
    }

    if (project.assignedConsultantId && project.assignedConsultantId !== currentUser.id && currentUser.role !== 'SUPER_ADMIN') {
      throw new Error(`Acesso negado ao engajamento ID ${engagementId}.`);
    }
  }

  async getAllEnterprises(): Promise<Enterprise[]> {
    return await this.enterpriseRepository.getAll();
  }

  async getEnterpriseById(id: string): Promise<Enterprise | null> {
    return await this.enterpriseRepository.getById(id);
  }

  // --- 1. GRUPO ECONÔMICO ---

  async createGroup(dto: CreateGroupDTO, user?: PlatformUser | null): Promise<BusinessGroup> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    await this.validateEngagementAccess(dto.engagementId, currentUser);

    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('O Nome do Grupo Econômico é obrigatório.');
    }

    const group: BusinessGroup = {
      id: `grp_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      name: dto.name.trim(),
      type: "Grupo",
      engagementId: dto.engagementId,
      segment: dto.segment?.trim(),
      cnpj: dto.cnpj?.trim(),
      notes: dto.notes?.trim(),
      companyIds: [],
      archived: false
    };

    await this.enterpriseRepository.save(group);

    auditEngine.logEvent("GRUPO_CRIADO", `Grupo Econômico "${group.name}" criado no Engajamento ${dto.engagementId}`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id,
      count: 1
    });
    dispatchPlatformEvent("ENTERPRISE_CONTEXT_CHANGED", { groupId: group.id, action: "GRUPO_CRIADO" });

    return group;
  }

  async updateGroup(id: string, dto: Partial<CreateGroupDTO>, user?: PlatformUser | null): Promise<BusinessGroup> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const group = (await this.enterpriseRepository.getById(id)) as BusinessGroup;

    if (!group || group.type !== "Grupo") {
      throw new Error(`Grupo Econômico ID ${id} não encontrado.`);
    }

    if (group.engagementId) {
      await this.validateEngagementAccess(group.engagementId, currentUser);
    }

    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new Error('O Nome do Grupo Econômico não pode ser vazio.');
      }
      group.name = dto.name.trim();
    }
    if (dto.segment !== undefined) group.segment = dto.segment.trim();
    if (dto.cnpj !== undefined) group.cnpj = dto.cnpj.trim();
    if (dto.notes !== undefined) group.notes = dto.notes.trim();

    await this.enterpriseRepository.save(group);

    auditEngine.logEvent("GRUPO_ATUALIZADO", `Grupo Econômico "${group.name}" atualizado`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("ENTERPRISE_CONTEXT_CHANGED", { groupId: group.id, action: "GRUPO_ATUALIZADO" });

    return group;
  }

  async listGroupsByEngagement(engagementId: string, user?: PlatformUser | null): Promise<BusinessGroup[]> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    await this.validateEngagementAccess(engagementId, currentUser);

    const all = await this.enterpriseRepository.getAll();
    return all.filter((e): e is BusinessGroup => e.type === "Grupo" && e.engagementId === engagementId && !e.archived);
  }

  // --- 2. EMPRESA ---

  async createCompany(dto: CreateCompanyDTO, user?: PlatformUser | null): Promise<Company> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const group = (await this.enterpriseRepository.getById(dto.groupId)) as BusinessGroup;

    if (!group || group.type !== "Grupo") {
      throw new Error(`Grupo Econômico ancestral ID ${dto.groupId} não encontrado.`);
    }

    if (group.engagementId) {
      await this.validateEngagementAccess(group.engagementId, currentUser);
    }

    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('O Nome da Empresa é obrigatório.');
    }

    const company: Company = {
      id: `cmp_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      name: dto.name.trim(),
      type: dto.type || "Empresa",
      parentId: group.id,
      engagementId: group.engagementId,
      segment: dto.segment?.trim() || group.segment,
      cnpj: dto.cnpj?.trim(),
      notes: dto.notes?.trim(),
      unitIds: [],
      archived: false
    };

    await this.enterpriseRepository.save(company);

    // Atualiza lista de empresas no Grupo ancestral
    group.companyIds.push(company.id);
    await this.enterpriseRepository.save(group);

    auditEngine.logEvent("EMPRESA_CRIADA", `Empresa "${company.name}" criada no Grupo "${group.name}"`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id,
      count: 1
    });
    dispatchPlatformEvent("ENTERPRISE_CONTEXT_CHANGED", { companyId: company.id, action: "EMPRESA_CRIADA" });

    return company;
  }

  async updateCompany(id: string, dto: Partial<CreateCompanyDTO>, user?: PlatformUser | null): Promise<Company> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const company = (await this.enterpriseRepository.getById(id)) as Company;

    if (!company || (company as any).type === "Grupo") {
      throw new Error(`Empresa ID ${id} não encontrada.`);
    }

    if (company.engagementId) {
      await this.validateEngagementAccess(company.engagementId, currentUser);
    }

    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new Error('O Nome da Empresa não pode ser vazio.');
      }
      company.name = dto.name.trim();
    }
    if (dto.type !== undefined) company.type = dto.type;
    if (dto.segment !== undefined) company.segment = dto.segment.trim();
    if (dto.cnpj !== undefined) company.cnpj = dto.cnpj.trim();
    if (dto.notes !== undefined) company.notes = dto.notes.trim();

    await this.enterpriseRepository.save(company);

    auditEngine.logEvent("EMPRESA_ATUALIZADA", `Empresa "${company.name}" atualizada`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("ENTERPRISE_CONTEXT_CHANGED", { companyId: company.id, action: "EMPRESA_ATUALIZADA" });

    return company;
  }

  async listCompaniesByGroup(groupId: string, user?: PlatformUser | null): Promise<Company[]> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const group = (await this.enterpriseRepository.getById(groupId)) as BusinessGroup;

    if (group && group.engagementId) {
      await this.validateEngagementAccess(group.engagementId, currentUser);
    }

    const all = await this.enterpriseRepository.getAll();
    return all.filter((e): e is Company =>
      e.type !== "Grupo" &&
      e.parentId === groupId &&
      !e.archived &&
      (!group?.engagementId || e.engagementId === group.engagementId)
    );
  }

  // --- 3. UNIDADE OPERACIONAL ---

  async createUnit(dto: CreateUnitDTO, user?: PlatformUser | null): Promise<Unit> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const company = (await this.enterpriseRepository.getById(dto.companyId)) as Company;

    if (!company) {
      throw new Error(`Empresa ancestral ID ${dto.companyId} não encontrada.`);
    }

    if (company.engagementId) {
      await this.validateEngagementAccess(company.engagementId, currentUser);
    }

    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('O Nome da Unidade Operacional é obrigatório.');
    }

    const unit: Unit = {
      id: `unt_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      name: dto.name.trim(),
      type: dto.type || "Unidade",
      parentId: company.id,
      engagementId: company.engagementId,
      segment: dto.segment?.trim() || company.segment,
      cnpj: dto.cnpj?.trim(),
      notes: dto.notes?.trim(),
      archived: false
    };

    await this.enterpriseRepository.save(unit);

    // Atualiza lista de unidades na Empresa ancestral
    if (!company.unitIds) company.unitIds = [];
    company.unitIds.push(unit.id);
    await this.enterpriseRepository.save(company);

    auditEngine.logEvent("UNIDADE_CRIADA", `Unidade "${unit.name}" criada na Empresa "${company.name}"`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id,
      count: 1
    });
    dispatchPlatformEvent("ENTERPRISE_CONTEXT_CHANGED", { unitId: unit.id, action: "UNIDADE_CRIADA" });

    return unit;
  }

  async updateUnit(id: string, dto: Partial<CreateUnitDTO>, user?: PlatformUser | null): Promise<Unit> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const unit = (await this.enterpriseRepository.getById(id)) as Unit;

    if (!unit) {
      throw new Error(`Unidade ID ${id} não encontrada.`);
    }

    if (unit.engagementId) {
      await this.validateEngagementAccess(unit.engagementId, currentUser);
    }

    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new Error('O Nome da Unidade Operacional não pode ser vazio.');
      }
      unit.name = dto.name.trim();
    }
    if (dto.type !== undefined) unit.type = dto.type;
    if (dto.segment !== undefined) unit.segment = dto.segment.trim();
    if (dto.cnpj !== undefined) unit.cnpj = dto.cnpj.trim();
    if (dto.notes !== undefined) unit.notes = dto.notes.trim();

    await this.enterpriseRepository.save(unit);

    auditEngine.logEvent("UNIDADE_ATUALIZADA", `Unidade "${unit.name}" atualizada`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("ENTERPRISE_CONTEXT_CHANGED", { unitId: unit.id, action: "UNIDADE_ATUALIZADA" });

    return unit;
  }

  async listUnitsByCompany(companyId: string, user?: PlatformUser | null): Promise<Unit[]> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const company = (await this.enterpriseRepository.getById(companyId)) as Company;

    if (company && company.engagementId) {
      await this.validateEngagementAccess(company.engagementId, currentUser);
    }

    const all = await this.enterpriseRepository.getAll();
    return all.filter((e): e is Unit =>
      'parentId' in e &&
      e.parentId === companyId &&
      !e.archived &&
      (!company?.engagementId || e.engagementId === company.engagementId)
    );
  }

  // --- REGRAS DE EXCLUSÃO PROTEGIDA E ARQUIVAMENTO ---

  /**
   * Exclui um Grupo Econômico somente se não houver Empresas ativas vinculadas.
   */
  async deleteGroup(id: string, user?: PlatformUser | null): Promise<void> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const group = (await this.enterpriseRepository.getById(id)) as BusinessGroup;
    if (!group) return;

    if (group.engagementId) {
      await this.validateEngagementAccess(group.engagementId, currentUser);
    }

    const activeCompanies = await this.listCompaniesByGroup(id, currentUser);
    if (activeCompanies.length > 0) {
      throw new Error(`Não é possível excluir o Grupo Econômico "${group.name}" pois existem ${activeCompanies.length} empresas vinculadas ativas. Arquive ou remova as empresas primeiro.`);
    }

    await this.enterpriseRepository.delete(id);
  }

  /**
   * Exclui uma Empresa somente se não houver Unidades Operacionais ativas vinculadas.
   */
  async deleteCompany(id: string, user?: PlatformUser | null): Promise<void> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const company = (await this.enterpriseRepository.getById(id)) as Company;
    if (!company) return;

    if (company.engagementId) {
      await this.validateEngagementAccess(company.engagementId, currentUser);
    }

    const activeUnits = await this.listUnitsByCompany(id, currentUser);
    if (activeUnits.length > 0) {
      throw new Error(`Não é possível excluir a Empresa "${company.name}" pois existem ${activeUnits.length} unidades operacionais vinculadas ativas. Arquive ou remova as unidades primeiro.`);
    }

    // Remove referência no Grupo ancestral
    if (company.parentId) {
      const group = (await this.enterpriseRepository.getById(company.parentId)) as BusinessGroup;
      if (group && group.companyIds) {
        group.companyIds = group.companyIds.filter(cId => cId !== id);
        await this.enterpriseRepository.save(group);
      }
    }

    await this.enterpriseRepository.delete(id);
  }

  /**
   * Exclui uma Unidade Operacional.
   */
  async deleteUnit(id: string, user?: PlatformUser | null): Promise<void> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const unit = (await this.enterpriseRepository.getById(id)) as Unit;
    if (!unit) return;

    if (unit.engagementId) {
      await this.validateEngagementAccess(unit.engagementId, currentUser);
    }

    // Remove referência na Empresa ancestral
    if (unit.parentId) {
      const company = (await this.enterpriseRepository.getById(unit.parentId)) as Company;
      if (company && company.unitIds) {
        company.unitIds = company.unitIds.filter(uId => uId !== id);
        await this.enterpriseRepository.save(company);
      }
    }

    await this.enterpriseRepository.delete(id);
  }

  async archiveGroup(id: string, user?: PlatformUser | null): Promise<void> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const group = (await this.enterpriseRepository.getById(id)) as BusinessGroup;
    if (!group) return;

    if (group.engagementId) {
      await this.validateEngagementAccess(group.engagementId, currentUser);
    }

    group.archived = true;
    await this.enterpriseRepository.save(group);
  }

  async archiveCompany(id: string, user?: PlatformUser | null): Promise<void> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const company = (await this.enterpriseRepository.getById(id)) as Company;
    if (!company) return;

    if (company.engagementId) {
      await this.validateEngagementAccess(company.engagementId, currentUser);
    }

    company.archived = true;
    await this.enterpriseRepository.save(company);
  }

  async archiveUnit(id: string, user?: PlatformUser | null): Promise<void> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const unit = (await this.enterpriseRepository.getById(id)) as Unit;
    if (!unit) return;

    if (unit.engagementId) {
      await this.validateEngagementAccess(unit.engagementId, currentUser);
    }

    unit.archived = true;
    await this.enterpriseRepository.save(unit);
  }

  // --- MÉTODOS DE COMPATIBILIDADE LEGADA ---

  async saveGroup(group: BusinessGroup): Promise<void> {
    await this.enterpriseRepository.save(group);
  }

  async saveCompany(company: Company): Promise<void> {
    await this.enterpriseRepository.save(company);
  }

  async saveUnit(unit: Unit): Promise<void> {
    await this.enterpriseRepository.save(unit);
  }

  async archiveEnterprise(id: string): Promise<void> {
    await this.enterpriseRepository.archiveEnterprise(id);
  }
}
