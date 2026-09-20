import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EngagementService } from './EngagementService';
import { ClientService } from './ClientService';
import { WorkspaceRepository } from './WorkspaceRepository';
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

describe('F1.2B — Engajamento Service & Lifecycle Specification', () => {
  let repository: WorkspaceRepository;
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
    repository = new WorkspaceRepository();
    engagementService = new EngagementService(repository);
    clientService = new ClientService(repository);
  });

  it('deve criar engajamento válido associado a um cliente existente com estado inicial NO_SOURCE', async () => {
    const client = await clientService.createClient({
      legalName: 'Cliente Beta S.A.',
      document: '12.999.888/0001-77'
    }, consultorA);

    const eng = await engagementService.createEngagement({
      name: 'Reestruturação 2026',
      clientId: client.id,
      clientName: client.legalName,
      segment: 'Varejo'
    }, consultorA);

    expect(eng.id).toBeDefined();
    expect(eng.group).toBe('Reestruturação 2026');
    expect(eng.clientId).toBe(client.id);
    expect(eng.canonicalState).toBe('NO_SOURCE');
    expect(eng.isArchived).toBe(false);
    expect(eng.assignedConsultantId).toBe(consultorA.id);
  });

  it('deve rejeitar criação de engajamento sem Cliente', async () => {
    await expect(engagementService.createEngagement({
      name: 'Projeto Sem Cliente',
      clientId: ''
    }, consultorA)).rejects.toThrow('O Engajamento deve pertencer obrigatoriamente a um Cliente válido.');
  });

  it('deve rejeitar criação de engajamento com nome vazio', async () => {
    const client = await clientService.createClient({
      legalName: 'Cliente Teste',
      document: '111'
    }, consultorA);

    await expect(engagementService.createEngagement({
      name: '   ',
      clientId: client.id
    }, consultorA)).rejects.toThrow('O Nome do Engajamento é obrigatório.');
  });

  it('deve listar engajamentos por cliente', async () => {
    const client1 = await clientService.createClient({ legalName: 'Cliente 1', document: '111' }, consultorA);
    const client2 = await clientService.createClient({ legalName: 'Cliente 2', document: '222' }, consultorA);

    await engagementService.createEngagement({ name: 'Eng 1', clientId: client1.id }, consultorA);
    await engagementService.createEngagement({ name: 'Eng 2', clientId: client1.id }, consultorA);
    await engagementService.createEngagement({ name: 'Eng 3', clientId: client2.id }, consultorA);

    const list1 = await engagementService.listEngagementsByClient(client1.id, consultorA);
    const list2 = await engagementService.listEngagementsByClient(client2.id, consultorA);

    expect(list1.length).toBe(2);
    expect(list2.length).toBe(1);
  });

  it('deve arquivar e reativar engajamentos alterando disponibilidade', async () => {
    const client = await clientService.createClient({ legalName: 'Cliente Arquivo', document: '999' }, consultorA);
    const eng = await engagementService.createEngagement({ name: 'Engajamento Temporário', clientId: client.id }, consultorA);

    const archived = await engagementService.archiveEngagement(eng.id, true, consultorA);
    expect(archived.isArchived).toBe(true);

    const reactivated = await engagementService.archiveEngagement(eng.id, false, consultorA);
    expect(reactivated.isArchived).toBe(false);
  });

  it('deve garantir isolamento de autorização entre consultores distintos', async () => {
    const client = await clientService.createClient({ legalName: 'Cliente Ana', document: '111' }, consultorA);
    const engAna = await engagementService.createEngagement({ name: 'Projeto Ana', clientId: client.id }, consultorA);

    await expect(engagementService.getEngagementById(engAna.id, consultorB)).rejects.toThrow(`Acesso negado ao engajamento ID ${engAna.id}.`);
  });

  it('deve emitir eventos oficiais de auditoria durante o ciclo de vida', async () => {
    const spyAudit = vi.spyOn(auditEngine, 'logEvent');
    const client = await clientService.createClient({ legalName: 'Cliente Auditado', document: '555' }, consultorA);

    const eng = await engagementService.createEngagement({ name: 'Projeto Auditado', clientId: client.id }, consultorA);
    expect(spyAudit).toHaveBeenCalledWith('ENGAJAMENTO_CRIADO', expect.stringContaining('Projeto Auditado'), 'INFO', expect.anything());

    await engagementService.updateEngagement(eng.id, { name: 'Projeto Auditado Editado' }, consultorA);
    expect(spyAudit).toHaveBeenCalledWith('ENGAJAMENTO_ATUALIZADO', expect.stringContaining('Projeto Auditado Editado'), 'INFO', expect.anything());

    await engagementService.archiveEngagement(eng.id, true, consultorA);
    expect(spyAudit).toHaveBeenCalledWith('ENGAJAMENTO_ARQUIVADO', expect.anything(), 'INFO', expect.anything());
  });

  it('deve garantir que a fachada ConsultantWorkspaceManager mantenha regressão limpa', async () => {
    const client = await consultantWorkspaceManager.createClient({ legalName: 'Cliente Facade', document: '777' });
    const created = await consultantWorkspaceManager.createEngagement({ name: 'Projeto via Facade', clientId: client.id });

    expect(created.id).toBeDefined();
    expect(created.group).toBe('Projeto via Facade');

    const fetched = await consultantWorkspaceManager.getEngagementById(created.id);
    expect(fetched?.id).toBe(created.id);
  });
});
