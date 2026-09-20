import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as XLSX from 'xlsx';
import {
  SpreadsheetConnector,
  SpreadsheetConnectorFactory,
  SpreadsheetParser,
  SpreadsheetError
} from './index';
import { connectorRegistry, connectorFactory, ConnectorExecutionContext } from '../../core/datasource/sdk';
import { DataSourceService } from '../../core/datasource/DataSourceService';
import { LocalDataSourceRepository } from '../../core/datasource/LocalDataSourceRepository';
import { WorkspaceRepository } from '../../modules/consultant-workspace/WorkspaceRepository';
import { OrganizationService } from '../../modules/consultant-workspace/OrganizationService';
import { EngagementService } from '../../modules/consultant-workspace/EngagementService';
import { ClientService } from '../../modules/consultant-workspace/ClientService';
import { EnterpriseRepository } from '../../core/persistence/EnterpriseRepository';
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

describe('F1.4C — SpreadsheetConnector Specification', () => {
  let dsService: DataSourceService;
  let workspaceRepo: WorkspaceRepository;
  let enterpriseRepo: EnterpriseRepository;
  let orgService: OrganizationService;
  let engService: EngagementService;
  let clientService: ClientService;

  const consultorA: PlatformUser = {
    id: 'user-consultant-a',
    profile: { id: 'user-consultant-a', fullName: 'Consultor Ana', email: 'ana@asterion.com' },
    role: 'CONSULTANT'
  };

  function createMockXlsxBuffer(sheetData: Record<string, any[][]>): Uint8Array {
    const wb = XLSX.utils.book_new();
    for (const sheetName in sheetData) {
      const ws = XLSX.utils.aoa_to_sheet(sheetData[sheetName]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Uint8Array(buf);
  }

  function createMockCsvBuffer(csvText: string): Uint8Array {
    return new TextEncoder().encode(csvText);
  }

  beforeEach(() => {
    connectorRegistry.clear();
    workspaceRepo = new WorkspaceRepository();
    enterpriseRepo = new EnterpriseRepository();
    orgService = new OrganizationService(enterpriseRepo, workspaceRepo);
    engService = new EngagementService(workspaceRepo);
    clientService = new ClientService(workspaceRepo);
    dsService = new DataSourceService(new LocalDataSourceRepository(), workspaceRepo, orgService);

    SpreadsheetConnectorFactory.registerFactory();
  });

  describe('1. Validação e Identificação de Formatos', () => {
    it('deve identificar e processar arquivo XLSX válido com múltiplas abas', () => {
      const buffer = createMockXlsxBuffer({
        Vendas: [
          ['Data', 'Valor', 'Status'],
          ['2026-01-01', 1500, 'Aprovado'],
          ['2026-01-02', 2300, 'Pendente']
        ],
        Custos: [
          ['CentroCusto', 'Valor'],
          ['TI', 5000]
        ]
      });

      const parsed = SpreadsheetParser.parse(buffer, 'vendas_2026.xlsx');
      expect(parsed.format).toBe('XLSX');
      expect(parsed.sheets.length).toBe(2);
      expect(parsed.sheets[0].columns.length).toBe(3);
      expect(parsed.sheets[0].columns[0].inferredType).toBe('DATE');
      expect(parsed.sheets[0].columns[1].inferredType).toBe('INTEGER');
    });

    it('deve identificar e processar arquivo CSV válido com delimitador detectado', () => {
      const csvContent = "Data;Valor;Categoria\n01/01/2026;150.50;Alimentacao\n02/01/2026;89.90;Transporte";
      const buffer = createMockCsvBuffer(csvContent);

      const parsed = SpreadsheetParser.parse(buffer, 'extrato.csv');
      expect(parsed.format).toBe('CSV');
      expect(parsed.sheets.length).toBe(1);
      expect(parsed.sheets[0].rowCount).toBe(2);
    });

    it('deve rejeitar arquivo com extensão .xlsx mas assinatura incompatível (não ZIP)', () => {
      const fakeXlsx = new TextEncoder().encode("Isso e texto puro, nao um zip xlsx");
      expect(() => SpreadsheetParser.parse(fakeXlsx, 'fake.xlsx')).toThrow(SpreadsheetError);
    });

    it('deve rejeitar arquivos vazios com erro tipado FILE_EMPTY', () => {
      const emptyBuffer = new Uint8Array(0);
      expect(() => SpreadsheetParser.parse(emptyBuffer, 'empty.xlsx')).toThrow(SpreadsheetError);
    });
  });

  describe('2. Inferência de Tipos Conservadora', () => {
    it('deve inferir MIXED quando houver conflitos relevantes de tipos na mesma coluna', () => {
      const buffer = createMockXlsxBuffer({
        Dados: [
          ['Valor'],
          [100],
          [200],
          ['A Combinar']
        ]
      });

      const parsed = SpreadsheetParser.parse(buffer, 'mixed.xlsx');
      expect(parsed.sheets[0].columns[0].inferredType).toBe('MIXED');
    });

    it('deve promover INTEGER e DECIMAL para DECIMAL sem corromper a leitura', () => {
      const buffer = createMockXlsxBuffer({
        Dados: [
          ['Valor'],
          [100],
          [250.75]
        ]
      });

      const parsed = SpreadsheetParser.parse(buffer, 'decimal.xlsx');
      expect(parsed.sheets[0].columns[0].inferredType).toBe('DECIMAL');
    });
  });

  describe('3. Integração com Connector SDK e Fluxo de DataSource', () => {
    it('deve cumprir os contratos de Discovery, Sample e Synchronize via Connector SDK', async () => {
      const buffer = createMockXlsxBuffer({
        Faturamento: [
          ['Cliente', 'Total'],
          ['Empresa A', 10000],
          ['Empresa B', 20000]
        ]
      });

      const connector = connectorFactory.createConnector('asterion-spreadsheet-connector') as SpreadsheetConnector;
      const ctx: ConnectorExecutionContext = {
        engagementId: 'eng_test_123',
        dataSourceId: 'ds_test_456',
        parameters: { fileBuffer: buffer, filename: 'faturamento.xlsx' }
      };

      await connector.connect(ctx);

      const discovery = await connector.discover(ctx);
      expect(discovery.containers.length).toBe(1);
      expect(discovery.containers[0].name).toBe('Faturamento');

      const sample = await connector.sample(ctx, 10);
      expect(sample.length).toBe(2);
      expect(sample[0].Cliente).toBe('Empresa A');

      // Sincronização por lotes
      const syncBatches: any[] = [];
      for await (const batch of connector.synchronize(ctx, { mode: 'FULL', batchSize: 1 })) {
        syncBatches.push(batch);
      }

      expect(syncBatches.length).toBe(2);
      expect(syncBatches[0].recordsCount).toBe(1);
      expect(syncBatches[0].hasMore).toBe(true);
      expect(syncBatches[1].hasMore).toBe(false);
    });

    it('deve integrar a descoberta do conector com o ciclo de vida oficial do DataSource mantendo o estado WAITING_CONFIRMATION', async () => {
      const client = await clientService.createClient({ legalName: 'Cliente Conector', document: '111' }, consultorA);
      const eng = await engService.createEngagement({ name: 'Eng Conector', clientId: client.id }, consultorA);
      const group = await orgService.createGroup({ engagementId: eng.id, name: 'Grupo Conector' }, consultorA);

      // 1. Registro
      const ds = await dsService.registerDataSource({
        engagementId: eng.id,
        organizationalScope: { scopeType: 'GROUP', targetId: group.id },
        name: 'Vendas Importadas',
        originType: 'EXCEL'
      }, consultorA);

      // 2. Conector recebe arquivo e gera evidência
      const buffer = createMockXlsxBuffer({
        Vendas: [
          ['Produto', 'Preco'],
          ['Item 1', 99.90]
        ]
      });

      const connector = connectorFactory.createConnector('asterion-spreadsheet-connector') as SpreadsheetConnector;
      const ctx: ConnectorExecutionContext = {
        engagementId: eng.id,
        dataSourceId: ds.id,
        parameters: { fileBuffer: buffer, filename: 'vendas.xlsx' }
      };

      await connector.connect(ctx);
      const discoveryResult = await connector.discover(ctx);

      await dsService.registerConnectionEvidence(ds.id, `Arquivo vendas.xlsx conectado. Fingerprint: ${connector.getPhysicalFingerprint()}`, consultorA);

      // 3. Discovery oficial do DataSource utilizando os dados do conector
      await dsService.startDiscovery(ds.id, consultorA);
      const updatedDs = await dsService.completeDiscovery(ds.id, {
        containerProfiles: discoveryResult.containers.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          rowCount: c.rowCountEstimate
        }))
      }, undefined, consultorA);

      // O conector NÃO marca a fonte como READY automaticamente
      expect(updatedDs.derivedCanonicalState).toBe('WAITING_CONFIRMATION');
    });
  });
});
