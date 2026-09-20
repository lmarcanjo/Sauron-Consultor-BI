import { describe, it, expect, beforeEach, vi } from 'vitest';
import { consultantWorkspaceManager } from '../modules/consultant-workspace/ConsultantWorkspaceManager';
import { PortfolioService } from '../modules/consultant-workspace/PortfolioService';
import { WorkspaceRepository } from '../modules/consultant-workspace/WorkspaceRepository';
import { identityEngine } from '../core/identity/IdentityEngine';
import { PlatformUser } from '../core/identity/types';
import { auditEngine } from '../core/audit/AuditEngine';

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

describe('F1.1 Hardening — Autorização, Auditoria e Estados Canônicos', () => {
  let repository: WorkspaceRepository;
  let portfolioService: PortfolioService;

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

  const baseProject = {
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

  beforeEach(() => {
    localStorage.clear();
    repository = new WorkspaceRepository();
    portfolioService = new PortfolioService(repository);
  });

  describe('2. Autorização e Isolamento na Camada de Serviço', () => {
    it('Consultor A e Consultor B devem visualizar exclusivamente seus engajamentos atribuídos', async () => {
      const pA = await consultantWorkspaceManager.createProject({
        ...baseProject,
        client: 'Cliente Exclusivo Ana',
        assignedConsultantId: consultorA.id
      } as any);

      const pB = await consultantWorkspaceManager.createProject({
        ...baseProject,
        client: 'Cliente Exclusivo Bruno',
        assignedConsultantId: consultorB.id
      } as any);

      const listAna = await portfolioService.listProjects(consultorA);
      const listBruno = await portfolioService.listProjects(consultorB);

      expect(listAna.some(p => p.id === pA.id)).toBe(true);
      expect(listAna.some(p => p.id === pB.id)).toBe(false);

      expect(listBruno.some(p => p.id === pB.id)).toBe(true);
      expect(listBruno.some(p => p.id === pA.id)).toBe(false);
    });

    it('Consultor A deve ser bloqueado ao tentar selecionar engajamento não autorizado de B', async () => {
      const pB = await consultantWorkspaceManager.createProject({
        ...baseProject,
        client: 'Cliente Exclusivo Bruno',
        assignedConsultantId: consultorB.id
      } as any);

      await expect(portfolioService.setActiveProject(pB.id, consultorA)).rejects.toThrow(
        `Acesso negado ao engajamento ID: ${pB.id}`
      );
    });

    it('Deve tratar com segurança quando o usuário for nulo (não autenticado)', async () => {
      const projects = await portfolioService.listProjects(null);
      expect(projects).toEqual([]);
    });
  });

  describe('1. Emissão do Evento de Auditoria ENGAJAMENTO_SELECIONADO', () => {
    it('Deve emitir evento de auditoria oficial ao selecionar engajamento com sucesso', async () => {
      const spyAudit = vi.spyOn(auditEngine, 'logEvent');
      const pA = await consultantWorkspaceManager.createProject({
        ...baseProject,
        client: 'Cliente Ana',
        assignedConsultantId: consultorA.id
      } as any);

      await portfolioService.setActiveProject(pA.id, consultorA);

      expect(spyAudit).toHaveBeenCalledWith(
        'ENGAJAMENTO_SELECIONADO',
        expect.stringContaining(pA.id),
        'INFO',
        expect.objectContaining({ user: consultorA.profile.fullName })
      );
    });
  });
});
