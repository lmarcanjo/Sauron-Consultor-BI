import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceRepository } from './WorkspaceRepository';
import { ClientService } from './ClientService';
import { EngagementService } from './EngagementService';
import { PortfolioService } from './PortfolioService';
import { OrganizationService } from './OrganizationService';
import { ConsultantWorkspaceManager } from './ConsultantWorkspaceManager';

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

describe('Sprint 0 — Consultant Workspace Services Extraction', () => {
  let repository: WorkspaceRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new WorkspaceRepository();
  });

  const baseProject = {
    client: 'Empresa Exemplo',
    group: 'Grupo Exemplo',
    segment: 'Serviços',
    companies: [],
    brands: [],
    cnpjs: [],
    dbConnections: [],
    spreadsheets: [],
    importProfile: null,
    filters: [],
    kpis: [],
    dashboards: [],
    presentations: [],
    actionPlans: [],
    observations: '',
    history: [],
    auditLog: []
  };

  describe('ClientService', () => {
    it('deve listar clientes únicos a partir dos engajamentos existentes', async () => {
      const engagementService = new EngagementService(repository);
      const clientService = new ClientService(repository);

      await engagementService.createProject({ ...baseProject, client: 'Cliente Alfa' });
      await engagementService.createProject({ ...baseProject, client: 'Cliente Alfa' });
      await engagementService.createProject({ ...baseProject, client: 'Cliente Beta' });

      const clients = await clientService.listClients();
      expect(clients).toEqual(['Cliente Alfa', 'Cliente Beta']);
    });
  });

  describe('EngagementService', () => {
    it('deve criar, atualizar, duplicar e arquivar engajamentos', async () => {
      const engagementService = new EngagementService(repository);

      const created = await engagementService.createProject(baseProject);
      expect(created.id).toBeDefined();
      expect(created.isArchived).toBe(false);

      await engagementService.archiveProject(created.id, true);
      const updated = await repository.getProject(created.id);
      expect(updated?.isArchived).toBe(true);

      const duplicated = await engagementService.duplicateProject(created.id);
      expect(duplicated.client).toBe('Empresa Exemplo (Cópia)');
    });
  });

  describe('PortfolioService', () => {
    it('deve gerenciar o engajamento ativo na carteira', async () => {
      const engagementService = new EngagementService(repository);
      const portfolioService = new PortfolioService(repository);

      const p1 = await engagementService.createProject(baseProject);
      await portfolioService.setActiveProject(p1.id);

      const active = await portfolioService.getActiveProject();
      expect(active?.id).toBe(p1.id);

      await portfolioService.setActiveProject(null);
      const activeNull = await portfolioService.getActiveProject();
      expect(activeNull).toBeNull();
    });
  });

  describe('OrganizationService', () => {
    it('deve interagir com a persistência de organizações', async () => {
      const organizationService = new OrganizationService();
      const all = await organizationService.getAllEnterprises();
      expect(Array.isArray(all)).toBe(true);
    });
  });

  describe('ConsultantWorkspaceManager (Fachada de Compatibilidade)', () => {
    it('deve delegar chamadas corretamente sem quebrar consumidores', async () => {
      const manager = new ConsultantWorkspaceManager(repository);

      const project = await manager.createProject(baseProject);
      expect(project.id).toBeDefined();

      await manager.setActiveProject(project.id);
      const active = await manager.getActiveProject();
      expect(active?.id).toBe(project.id);

      const meeting = { id: 'm100', presentationId: 'p1', selectedCharts: [], observations: '', decisions: '', actionPlans: [], responsible: 'Consultor', pendingItems: [] };
      await manager.saveMeeting(project.id, meeting);
      const meetings = await manager.getMeetings(project.id);
      expect(meetings.length).toBe(1);
    });
  });
});
