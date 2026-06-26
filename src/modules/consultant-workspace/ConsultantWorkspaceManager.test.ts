import { describe, it, expect, beforeEach, vi } from 'vitest';
import { consultantWorkspaceManager } from './ConsultantWorkspaceManager';
import { WorkspaceProject, ActionPlan } from './types';

describe('ConsultantWorkspaceManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve criar um projeto', async () => {
    const project = await consultantWorkspaceManager.createProject({
      client: 'Cliente Teste',
      group: 'Grupo',
      segment: 'Segmento',
      companies: [],
      brands: [],
      cnpjs: [],
      dbConnections: [],
      spreadsheets: [],
      importProfile: {},
      filters: [],
      kpis: [],
      dashboards: [],
      presentations: [],
      actionPlans: [],
      observations: '',
      history: [],
      auditLog: []
    });
    expect(project.id).toBeDefined();
    expect(project.client).toBe('Cliente Teste');
  });

  it('deve definir projeto ativo', async () => {
    const project = await consultantWorkspaceManager.createProject({
      client: 'Cliente Teste',
      group: 'Grupo',
      segment: 'Segmento',
      companies: [],
      brands: [],
      cnpjs: [],
      dbConnections: [],
      spreadsheets: [],
      importProfile: {},
      filters: [],
      kpis: [],
      dashboards: [],
      presentations: [],
      actionPlans: [],
      observations: '',
      history: [],
      auditLog: []
    });
    await consultantWorkspaceManager.setActiveProject(project.id);
    const active = await consultantWorkspaceManager.getActiveProject();
    expect(active?.id).toBe(project.id);
  });
});
