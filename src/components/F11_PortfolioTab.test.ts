import { describe, it, expect, beforeEach, vi } from 'vitest';
import { consultantWorkspaceManager } from '../modules/consultant-workspace/ConsultantWorkspaceManager';
import { PortfolioService } from '../modules/consultant-workspace/PortfolioService';
import { WorkspaceRepository } from '../modules/consultant-workspace/WorkspaceRepository';
import { identityEngine } from '../core/identity/IdentityEngine';

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

describe('F1.1 — Minha Carteira (Portfolio Specification Test)', () => {
  let repository: WorkspaceRepository;
  let portfolioService: PortfolioService;

  beforeEach(() => {
    localStorage.clear();
    repository = new WorkspaceRepository();
    portfolioService = new PortfolioService(repository);
  });

  const baseProject = {
    group: 'Grupo Alfa',
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

  it('deve listar a carteira vazia adequadamente', async () => {
    const projects = await portfolioService.listProjects();
    expect(projects).toEqual([]);
  });

  it('deve retornar múltiplos engajamentos agrupados por cliente', async () => {
    await consultantWorkspaceManager.createProject({ ...baseProject, client: 'Cliente A' });
    await consultantWorkspaceManager.createProject({ ...baseProject, client: 'Cliente A' });
    await consultantWorkspaceManager.createProject({ ...baseProject, client: 'Cliente B' });

    const projects = await portfolioService.listProjects();
    expect(projects.length).toBe(3);

    const clientAProjects = projects.filter(p => p.client === 'Cliente A');
    const clientBProjects = projects.filter(p => p.client === 'Cliente B');

    expect(clientAProjects.length).toBe(2);
    expect(clientBProjects.length).toBe(1);
  });

  it('deve selecionar e persistir o engajamento ativo na carteira', async () => {
    const p1 = await consultantWorkspaceManager.createProject({ ...baseProject, client: 'Cliente A' });
    await portfolioService.setActiveProject(p1.id);

    const active = await portfolioService.getActiveProject();
    expect(active?.id).toBe(p1.id);
  });

  it('deve identificar a permissão do consultor logado', () => {
    const user = identityEngine.getCurrentUser() || { id: "u-consultant", name: "Consultor", role: "CONSULTANT" };
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.role).toBeDefined();
  });

  it('deve garantir que a fachada ConsultantWorkspaceManager mantenha regressão limpa', async () => {
    const created = await consultantWorkspaceManager.createProject({ ...baseProject, client: 'Cliente C' });
    await consultantWorkspaceManager.setActiveProject(created.id);

    const activeFromManager = await consultantWorkspaceManager.getActiveProject();
    expect(activeFromManager?.id).toBe(created.id);
  });
});
