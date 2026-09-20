import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataSource } from './DataSource';
import { DataSourceService } from './DataSourceService';
import { LocalDataSourceRepository } from './LocalDataSourceRepository';
import { WorkspaceRepository } from '../../modules/consultant-workspace/WorkspaceRepository';
import { OrganizationService } from '../../modules/consultant-workspace/OrganizationService';
import { EngagementService } from '../../modules/consultant-workspace/EngagementService';
import { ClientService } from '../../modules/consultant-workspace/ClientService';
import { EnterpriseRepository } from '../persistence/EnterpriseRepository';
import { consultantWorkspaceManager } from '../../modules/consultant-workspace/ConsultantWorkspaceManager';
import { PlatformUser } from '../identity/types';
import { auditEngine } from '../audit/AuditEngine';

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

describe('F1.4A — Core Governed DataSource Aggregate Specification', () => {
  let workspaceRepo: WorkspaceRepository;
  let enterpriseRepo: EnterpriseRepository;
  let dsRepo: LocalDataSourceRepository;
  let orgService: OrganizationService;
  let engService: EngagementService;
  let clientService: ClientService;
  let dsService: DataSourceService;

  const consultorA: PlatformUser = {
    id: 'user-consultant-a',
    profile: { id: 'user-consultant-a', fullName: 'Consultor Ana', email: 'ana@asterion.com' },
    role: 'CONSULTANT'
  };

  const consultorB: PlatformUser = {
    id: 'user-consultant-b',
    profile: { id: 'user-consultant-b', fullName: 'Consultor Bruno', email: 'bruno@asterion.com' },
    role: 'CONSULTANT'
  };

  beforeEach(() => {
    localStorage.clear();
    workspaceRepo = new WorkspaceRepository();
    enterpriseRepo = new EnterpriseRepository();
    dsRepo = new LocalDataSourceRepository();
    orgService = new OrganizationService(enterpriseRepo, workspaceRepo);
    engService = new EngagementService(workspaceRepo);
    clientService = new ClientService(workspaceRepo);
    dsService = new DataSourceService(dsRepo, workspaceRepo, orgService);
  });

  describe('1. Invariantes e Validações de Registro', () => {
    it('deve registrar com sucesso um DataSource ativo com escopo organizacional válido', async () => {
      const client = await clientService.createClient({ legalName: 'Cliente Fonte', document: '111' }, consultorA);
      const eng = await engService.createEngagement({ name: 'Engajamento Fonte', clientId: client.id }, consultorA);
      const group = await orgService.createGroup({ engagementId: eng.id, name: 'Grupo Fonte' }, consultorA);

      const ds = await dsService.registerDataSource({
        engagementId: eng.id,
        organizationalScope: { scopeType: 'GROUP', targetId: group.id },
        name: 'Faturamento ERP 2026',
        originType: 'POSTGRESQL'
      }, consultorA);

      expect(ds.id).toBeDefined();
      expect(ds.engagementId).toBe(eng.id);
      expect(ds.organizationalScope.targetId).toBe(group.id);
      expect(ds.derivedCanonicalState).toBe('NO_SOURCE');
      expect(ds.lifecycleStatus).toBe('ACTIVE');
      expect(ds.healthStatus).toBe('UNKNOWN');
    });

    it('deve recusar registro sem Engajamento ou com alvo organizacional inexistente', async () => {
      await expect(dsService.registerDataSource({
        engagementId: '',
        organizationalScope: { scopeType: 'GROUP', targetId: 'grp_invalid' },
        name: 'Sem Engajamento',
        originType: 'EXCEL'
      }, consultorA)).rejects.toThrow('EngagementId é obrigatório para o DataSource.');

      const client = await clientService.createClient({ legalName: 'Cliente Inexistente', document: '111' }, consultorA);
      const eng = await engService.createEngagement({ name: 'Eng Inexistente', clientId: client.id }, consultorA);

      await expect(dsService.registerDataSource({
        engagementId: eng.id,
        organizationalScope: { scopeType: 'COMPANY', targetId: 'cmp_inexistente' },
        name: 'Alvo Inexistente',
        originType: 'EXCEL'
      }, consultorA)).rejects.toThrow('Empresa ID cmp_inexistente não existe.');
    });

    it('deve recusar vínculo com alvo pertencente a outro Engajamento', async () => {
      const clientA = await clientService.createClient({ legalName: 'Cliente A', document: '111' }, consultorA);
      const engA = await engService.createEngagement({ name: 'Eng A', clientId: clientA.id }, consultorA);
      const groupA = await orgService.createGroup({ engagementId: engA.id, name: 'Grupo A' }, consultorA);

      const clientB = await clientService.createClient({ legalName: 'Cliente B', document: '222' }, consultorB);
      const engB = await engService.createEngagement({ name: 'Eng B', clientId: clientB.id }, consultorB);

      await expect(dsService.registerDataSource({
        engagementId: engB.id,
        organizationalScope: { scopeType: 'GROUP', targetId: groupA.id },
        name: 'Invasão de Escopo',
        originType: 'CSV'
      }, consultorB)).rejects.toThrow('O Grupo Econômico alvo pertence a outro Engajamento.');
    });
  });

  describe('2. Ciclo de Vida e Derivação do Estado Canônico', () => {
    it('deve transicionar rigorosamente pelos estados canônicos derivados conforme evidências', async () => {
      const client = await clientService.createClient({ legalName: 'Cliente Ciclo', document: '111' }, consultorA);
      const eng = await engService.createEngagement({ name: 'Engajamento Ciclo', clientId: client.id }, consultorA);
      const group = await orgService.createGroup({ engagementId: eng.id, name: 'Grupo Ciclo' }, consultorA);

      const ds = await dsService.registerDataSource({
        engagementId: eng.id,
        organizationalScope: { scopeType: 'GROUP', targetId: group.id },
        name: 'Vendas Loja 01',
        originType: 'EXCEL'
      }, consultorA);

      // Estado 1: NO_SOURCE (sem evidência de conexão)
      expect(ds.derivedCanonicalState).toBe('NO_SOURCE');

      // Estado 2: SOURCE_CONNECTED (evidência registrada)
      await dsService.registerConnectionEvidence(ds.id, 'Upload do arquivo vendas.xlsx recebido com sucesso', consultorA);
      let updatedDs = (await dsService.getDataSourceById(ds.id, consultorA))!;
      expect(updatedDs.derivedCanonicalState).toBe('SOURCE_CONNECTED');

      // Estado 3: DISCOVERING (discovery iniciado)
      await dsService.startDiscovery(ds.id, consultorA);
      updatedDs = (await dsService.getDataSourceById(ds.id, consultorA))!;
      expect(updatedDs.derivedCanonicalState).toBe('DISCOVERING');

      // Estado 4: WAITING_CONFIRMATION (discovery concluído, schema v1 gerado)
      await dsService.completeDiscovery(ds.id, {
        containerProfiles: [{ id: 'sheet1', name: 'Vendas 2026', type: 'sheet', rowCount: 1500 }]
      }, undefined, consultorA);
      updatedDs = (await dsService.getDataSourceById(ds.id, consultorA))!;
      expect(updatedDs.derivedCanonicalState).toBe('WAITING_CONFIRMATION');
      expect(updatedDs.currentSchemaVersion?.versionNumber).toBe(1);

      // Estado 5: READY (confirmação explícita do consultor para v1)
      await dsService.confirmSchema(ds.id, 'Entendimento de Vendas confirmado', consultorA);
      updatedDs = (await dsService.getDataSourceById(ds.id, consultorA))!;
      expect(updatedDs.derivedCanonicalState).toBe('READY');

      // Invalidação por nova versão de schema: novo discovery v2 volta para WAITING_CONFIRMATION
      await dsService.startDiscovery(ds.id, consultorA);
      await dsService.completeDiscovery(ds.id, {
        containerProfiles: [{ id: 'sheet1', name: 'Vendas 2026 v2', type: 'sheet', rowCount: 1800 }]
      }, undefined, consultorA);
      updatedDs = (await dsService.getDataSourceById(ds.id, consultorA))!;
      expect(updatedDs.currentSchemaVersion?.versionNumber).toBe(2);
      expect(updatedDs.derivedCanonicalState).toBe('WAITING_CONFIRMATION');
    });

    it('deve manter separação explícita entre LifecycleStatus, HealthStatus e CanonicalState', async () => {
      const client = await clientService.createClient({ legalName: 'Cliente Status', document: '111' }, consultorA);
      const eng = await engService.createEngagement({ name: 'Eng Status', clientId: client.id }, consultorA);
      const group = await orgService.createGroup({ engagementId: eng.id, name: 'Grupo Status' }, consultorA);

      const ds = await dsService.registerDataSource({
        engagementId: eng.id,
        organizationalScope: { scopeType: 'GROUP', targetId: group.id },
        name: 'Fonte SQL Servidor',
        originType: 'POSTGRESQL'
      }, consultorA);

      await dsService.disableDataSource(ds.id, consultorA);
      let updatedDs = (await dsService.getDataSourceById(ds.id, consultorA))!;
      expect(updatedDs.lifecycleStatus).toBe('DISABLED');

      await dsService.enableDataSource(ds.id, consultorA);
      updatedDs = (await dsService.getDataSourceById(ds.id, consultorA))!;
      expect(updatedDs.lifecycleStatus).toBe('ACTIVE');

      await dsService.archiveDataSource(ds.id, consultorA);
      updatedDs = (await dsService.getDataSourceById(ds.id, consultorA))!;
      expect(updatedDs.lifecycleStatus).toBe('ARCHIVED');
      expect(updatedDs.derivedCanonicalState).toBe('NO_SOURCE');
    });
  });

  describe('3. Autorização e Segurança do Ativo', () => {
    it('deve proibir acesso e alteração por consultores não autorizados', async () => {
      const clientA = await clientService.createClient({ legalName: 'Cliente Ana', document: '111' }, consultorA);
      const engA = await engService.createEngagement({ name: 'Eng Ana', clientId: clientA.id }, consultorA);
      const groupA = await orgService.createGroup({ engagementId: engA.id, name: 'Grupo Ana' }, consultorA);

      const ds = await dsService.registerDataSource({
        engagementId: engA.id,
        organizationalScope: { scopeType: 'GROUP', targetId: groupA.id },
        name: 'Fonte Privada Ana',
        originType: 'CSV'
      }, consultorA);

      await expect(dsService.getDataSourceById(ds.id, consultorB)).rejects.toThrow(`Acesso negado ao engajamento ID ${engA.id}.`);
    });

    it('deve assegurar que segredos técnicos não sejam expostos no modelo', async () => {
      const client = await clientService.createClient({ legalName: 'Cliente Segredo', document: '111' }, consultorA);
      const eng = await engService.createEngagement({ name: 'Eng Segredo', clientId: client.id }, consultorA);
      const group = await orgService.createGroup({ engagementId: eng.id, name: 'Grupo Segredo' }, consultorA);

      const ds = await dsService.registerDataSource({
        engagementId: eng.id,
        organizationalScope: { scopeType: 'GROUP', targetId: group.id },
        name: 'Banco SQL Seguro',
        originType: 'POSTGRESQL',
        credentialReferenceId: 'cred_ref_vault_99'
      }, consultorA);

      expect(ds.metadata.credentialReferenceId).toBe('cred_ref_vault_99');
      expect((ds.metadata as any).password).toBeUndefined();
      expect((ds.metadata as any).connectionString).toBeUndefined();
    });
  });

  describe('4. Auditoria e Regressão de Fachada', () => {
    it('deve emitir eventos de auditoria oficiais durante as transições de domínio', async () => {
      const spyAudit = vi.spyOn(auditEngine, 'logEvent');
      const client = await clientService.createClient({ legalName: 'Cliente Audit Fonte', document: '111' }, consultorA);
      const eng = await engService.createEngagement({ name: 'Eng Audit Fonte', clientId: client.id }, consultorA);
      const group = await orgService.createGroup({ engagementId: eng.id, name: 'Grupo Audit Fonte' }, consultorA);

      const ds = await dsService.registerDataSource({
        engagementId: eng.id,
        organizationalScope: { scopeType: 'GROUP', targetId: group.id },
        name: 'Fonte Auditada',
        originType: 'EXCEL'
      }, consultorA);

      expect(spyAudit).toHaveBeenCalledWith('DATA_SOURCE_REGISTERED', expect.anything(), 'INFO', expect.anything());

      await dsService.registerConnectionEvidence(ds.id, 'Arquivo recebido', consultorA);
      expect(spyAudit).toHaveBeenCalledWith('DATA_SOURCE_CONNECTED', expect.anything(), 'INFO', expect.anything());
    });

    it('deve garantir que a fachada ConsultantWorkspaceManager mantenha regressão limpa para F1.4A', async () => {
      const client = await consultantWorkspaceManager.createClient({ legalName: 'Cliente Facade DS', document: '111' });
      const eng = await consultantWorkspaceManager.createEngagement({ name: 'Eng Facade DS', clientId: client.id });
      const group = await consultantWorkspaceManager.createGroup({ engagementId: eng.id, name: 'Grupo Facade DS' });

      const ds = await consultantWorkspaceManager.dataSourceService.registerDataSource({
        engagementId: eng.id,
        organizationalScope: { scopeType: 'GROUP', targetId: group.id },
        name: 'Fonte via Facade',
        originType: 'CSV'
      });

      expect(ds.id).toBeDefined();
      expect(ds.metadata.name).toBe('Fonte via Facade');
    });
  });
});
