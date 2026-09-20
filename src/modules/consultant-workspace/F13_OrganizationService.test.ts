import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationService } from './OrganizationService';
import { EngagementService } from './EngagementService';
import { ClientService } from './ClientService';
import { WorkspaceRepository } from './WorkspaceRepository';
import { EnterpriseRepository } from '../../core/persistence/EnterpriseRepository';
import { consultantWorkspaceManager } from './ConsultantWorkspaceManager';
import { PlatformUser } from '../../core/identity/types';
import { auditEngine } from '../../core/audit/AuditEngine';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

describe('F1.3 — Estrutura Organizacional Specification & Hierarchy Test', () => {
  let workspaceRepo: WorkspaceRepository;
  let enterpriseRepo: EnterpriseRepository;
  let organizationService: OrganizationService;
  let engagementService: EngagementService;
  let clientService: ClientService;

  const consultorA: PlatformUser = {
    id: 'user-consultant-a',
    profile: {
      id: 'user-consultant-a',
      fullName: 'Consultor Ana',
      email: 'ana@asterion.com'
    },
    role: 'CONSULTANT'
  };

  const consultorB: PlatformUser = {
    id: 'user-consultant-b',
    profile: {
      id: 'user-consultant-b',
      fullName: 'Consultor Bruno',
      email: 'bruno@asterion.com'
    },
    role: 'CONSULTANT'
  };

  beforeEach(() => {
    localStorage.clear();
    workspaceRepo = new WorkspaceRepository();
    enterpriseRepo = new EnterpriseRepository();
    organizationService = new OrganizationService(enterpriseRepo, workspaceRepo);
    engagementService = new EngagementService(workspaceRepo);
    clientService = new ClientService(workspaceRepo);
  });

  it('deve criar Grupo Econômico vinculado a um Engajamento com hierarquia válida', async () => {
    const client = await clientService.createClient({ legalName: 'Cliente Holding', document: '111' }, consultorA);
    const eng = await engagementService.createEngagement({ name: 'Engajamento Global', clientId: client.id }, consultorA);

    const group = await organizationService.createGroup({
      engagementId: eng.id,
      name: 'Grupo Alfa'
    }, consultorA);

    expect(group.id).toBeDefined();
    expect(group.type).toBe('Grupo');
    expect(group.engagementId).toBe(eng.id);
  });

  it('deve criar Empresa vinculada a um Grupo Econômico ancestral', async () => {
    const client = await clientService.createClient({ legalName: 'Cliente Holding', document: '111' }, consultorA);
    const eng = await engagementService.createEngagement({ name: 'Engajamento Global', clientId: client.id }, consultorA);
    const group = await organizationService.createGroup({ engagementId: eng.id, name: 'Grupo Alfa' }, consultorA);

    const company = await organizationService.createCompany({
      groupId: group.id,
      name: 'Empresa Matriz Ltda',
      cnpj: '12.345.678/0001-90'
    }, consultorA);

    expect(company.id).toBeDefined();
    expect(company.parentId).toBe(group.id);
    expect(company.engagementId).toBe(eng.id);

    const updatedGroup = (await organizationService.getEnterpriseById(group.id)) as any;
    expect(updatedGroup.companyIds).toContain(company.id);
  });

  it('deve criar Unidade Operacional vinculada a uma Empresa ancestral', async () => {
    const client = await clientService.createClient({ legalName: 'Cliente Holding', document: '111' }, consultorA);
    const eng = await engagementService.createEngagement({ name: 'Engajamento Global', clientId: client.id }, consultorA);
    const group = await organizationService.createGroup({ engagementId: eng.id, name: 'Grupo Alfa' }, consultorA);
    const company = await organizationService.createCompany({ groupId: group.id, name: 'Empresa Matriz' }, consultorA);

    const unit = await organizationService.createUnit({
      companyId: company.id,
      name: 'Unidade Filial SP',
      type: 'Filial'
    }, consultorA);

    expect(unit.id).toBeDefined();
    expect(unit.parentId).toBe(company.id);
    expect(unit.engagementId).toBe(eng.id);

    const updatedCompany = (await organizationService.getEnterpriseById(company.id)) as any;
    expect(updatedCompany.unitIds).toContain(unit.id);
  });

  it('deve validar autorização por engajamento ao gerenciar a estrutura organizacional', async () => {
    const clientAna = await clientService.createClient({ legalName: 'Cliente Ana', document: '111' }, consultorA);
    const engAna = await engagementService.createEngagement({ name: 'Engajamento Ana', clientId: clientAna.id }, consultorA);

    await expect(organizationService.createGroup({
      engagementId: engAna.id,
      name: 'Grupo Proibido'
    }, consultorB)).rejects.toThrow(`Acesso negado ao engajamento ID ${engAna.id}.`);
  });

  it('deve realizar arquivamento das entidades sem perda de integridade relacional', async () => {
    const client = await clientService.createClient({ legalName: 'Cliente Arquivo', document: '111' }, consultorA);
    const eng = await engagementService.createEngagement({ name: 'Engajamento Arquivo', clientId: client.id }, consultorA);
    const group = await organizationService.createGroup({ engagementId: eng.id, name: 'Grupo Arquivo' }, consultorA);

    await organizationService.archiveGroup(group.id, consultorA);

    const activeGroups = await organizationService.listGroupsByEngagement(eng.id, consultorA);
    expect(activeGroups.length).toBe(0);

    const archivedGroup = (await organizationService.getEnterpriseById(group.id)) as any;
    expect(archivedGroup.archived).toBe(true);
  });

  it('deve recusar exclusão direta de Grupo quando houver Empresas vinculadas ativas', async () => {
    const client = await clientService.createClient({ legalName: 'Cliente Protegido', document: '111' }, consultorA);
    const eng = await engagementService.createEngagement({ name: 'Engajamento Protegido', clientId: client.id }, consultorA);
    const group = await organizationService.createGroup({ engagementId: eng.id, name: 'Grupo Com Empresa' }, consultorA);
    await organizationService.createCompany({ groupId: group.id, name: 'Empresa Ativa' }, consultorA);

    await expect(organizationService.deleteGroup(group.id, consultorA)).rejects.toThrow(
      `Não é possível excluir o Grupo Econômico "${group.name}" pois existem 1 empresas vinculadas ativas.`
    );
  });

  it('deve emitir eventos de auditoria oficiais para cada alteração na estrutura organizacional', async () => {
    const spyAudit = vi.spyOn(auditEngine, 'logEvent');
    const client = await clientService.createClient({ legalName: 'Cliente Auditado', document: '111' }, consultorA);
    const eng = await engagementService.createEngagement({ name: 'Engajamento Auditado', clientId: client.id }, consultorA);

    const group = await organizationService.createGroup({ engagementId: eng.id, name: 'Grupo Audit' }, consultorA);
    expect(spyAudit).toHaveBeenCalledWith('GRUPO_CRIADO', expect.anything(), 'INFO', expect.anything());

    const company = await organizationService.createCompany({ groupId: group.id, name: 'Empresa Audit' }, consultorA);
    expect(spyAudit).toHaveBeenCalledWith('EMPRESA_CRIADA', expect.anything(), 'INFO', expect.anything());

    await organizationService.createUnit({ companyId: company.id, name: 'Unidade Audit' }, consultorA);
    expect(spyAudit).toHaveBeenCalledWith('UNIDADE_CRIADA', expect.anything(), 'INFO', expect.anything());
  });

  it('deve garantir que a fachada ConsultantWorkspaceManager mantenha regressão limpa para F1.3', async () => {
    const client = await consultantWorkspaceManager.createClient({ legalName: 'Cliente Facade Org', document: '111' });
    const eng = await consultantWorkspaceManager.createEngagement({ name: 'Engajamento Facade Org', clientId: client.id });

    const group = await consultantWorkspaceManager.createGroup({ engagementId: eng.id, name: 'Grupo Facade' });
    expect(group.id).toBeDefined();

    const company = await consultantWorkspaceManager.createCompany({ groupId: group.id, name: 'Empresa Facade' });
    expect(company.id).toBeDefined();

    const unit = await consultantWorkspaceManager.createUnit({ companyId: company.id, name: 'Unidade Facade' });
    expect(unit.id).toBeDefined();
  });
});
