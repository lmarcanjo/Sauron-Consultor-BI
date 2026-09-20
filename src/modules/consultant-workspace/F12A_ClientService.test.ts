import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientService } from './ClientService';
import { WorkspaceRepository } from './WorkspaceRepository';
import { PlatformUser } from '../../core/identity/types';

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

describe('F1.2A — Cliente Service & Entity Specification', () => {
  let repository: WorkspaceRepository;
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
    clientService = new ClientService(repository);
  });

  it('deve realizar cadastro válido de cliente', async () => {
    const created = await clientService.createClient({
      legalName: 'Empresa Alfa Ltda',
      tradeName: 'Alfa Tech',
      document: '12.345.678/0001-99',
      segment: 'Tecnologia'
    }, consultorA);

    expect(created.id).toBeDefined();
    expect(created.legalName).toBe('Empresa Alfa Ltda');
    expect(created.status).toBe('ACTIVE');
    expect(created.assignedConsultantId).toBe(consultorA.id);
  });

  it('deve rejeitar cadastro com Razão Social vazia', async () => {
    await expect(clientService.createClient({
      legalName: '   ',
      document: '12345'
    }, consultorA)).rejects.toThrow('A Razão Social do cliente é obrigatória.');
  });

  it('deve rejeitar cadastro com Documento vazio', async () => {
    await expect(clientService.createClient({
      legalName: 'Cliente Teste',
      document: ''
    }, consultorA)).rejects.toThrow('O Documento (CNPJ ou código único) do cliente é obrigatório.');
  });

  it('deve rejeitar cliente duplicado na mesma carteira', async () => {
    await clientService.createClient({
      legalName: 'Cliente Repetido Ltda',
      document: '99.888.777/0001-00'
    }, consultorA);

    await expect(clientService.createClient({
      legalName: 'Cliente Repetido Ltda',
      document: '00.000.000/0001-00'
    }, consultorA)).rejects.toThrow('Já existe um cliente cadastrado com a Razão Social "Cliente Repetido Ltda"');
  });

  it('deve permitir atualização dos dados do cliente', async () => {
    const created = await clientService.createClient({
      legalName: 'Nome Antigo',
      document: '11111'
    }, consultorA);

    const updated = await clientService.updateClient(created.id, {
      legalName: 'Nome Atualizado',
      tradeName: 'Fantasia Novo'
    }, consultorA);

    expect(updated.legalName).toBe('Nome Atualizado');
    expect(updated.tradeName).toBe('Fantasia Novo');
  });

  it('deve listar e consultar clientes com isolamento de autorização', async () => {
    const cA = await clientService.createClient({
      legalName: 'Cliente da Ana',
      document: '111'
    }, consultorA);

    const cB = await clientService.createClient({
      legalName: 'Cliente do Bruno',
      document: '222'
    }, consultorB);

    const listAna = await clientService.listClientEntities(consultorA);
    const listBruno = await clientService.listClientEntities(consultorB);

    expect(listAna.some(c => c.id === cA.id)).toBe(true);
    expect(listAna.some(c => c.id === cB.id)).toBe(false);

    expect(listBruno.some(c => c.id === cB.id)).toBe(true);

    const getForAna = await clientService.getClientById(cB.id, consultorA);
    expect(getForAna).toBeNull();
  });
});
