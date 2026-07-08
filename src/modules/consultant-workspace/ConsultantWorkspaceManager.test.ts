import { describe, it, expect, beforeEach, vi } from 'vitest';
import { consultantWorkspaceManager } from './ConsultantWorkspaceManager';

// Mock localStorage
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

describe('ConsultantWorkspaceManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const baseProject = {
    client: 'Cliente Teste',
    group: 'Grupo',
    segment: 'Segmento',
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

  it('deve criar um projeto', async () => {
    const project = await consultantWorkspaceManager.createProject(baseProject);
    expect(project.id).toBeDefined();
    expect(project.client).toBe('Cliente Teste');
  });

  it('deve persistir projeto ativo', async () => {
    const project = await consultantWorkspaceManager.createProject(baseProject);
    await consultantWorkspaceManager.setActiveProject(project.id);
    const active = await consultantWorkspaceManager.getActiveProject();
    expect(active?.id).toBe(project.id);
  });

  it('deve salvar reunião', async () => {
      const project = await consultantWorkspaceManager.createProject(baseProject);
      const meeting = { id: 'm1', presentationId: 'p1', selectedCharts: [], observations: '', decisions: '', actionPlans: [], responsible: 'Consultor', pendingItems: [] };
      await consultantWorkspaceManager.saveMeeting(project.id, meeting);
      const meetings = await consultantWorkspaceManager.getMeetings(project.id);
      expect(meetings.length).toBe(1);
      expect(meetings[0].id).toBe('m1');
  });
});
