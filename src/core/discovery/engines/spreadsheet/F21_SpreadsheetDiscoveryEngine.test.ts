import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { SpreadsheetDiscoveryEngine, DiscoveryReportGenerator } from './index';
import { SpreadsheetConnector } from '../../../../connectors/spreadsheet/SpreadsheetConnector';
import { discoveryRegistry, discoveryFactory, DiscoveryExecutionContext } from '../../sdk';

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

describe('F2.1 — SpreadsheetDiscoveryEngine Specification', () => {
  let engine: SpreadsheetDiscoveryEngine;

  function createMockXlsxBuffer(sheetData: Record<string, any[][]>): Uint8Array {
    const wb = XLSX.utils.book_new();
    for (const sheetName in sheetData) {
      const ws = XLSX.utils.aoa_to_sheet(sheetData[sheetName]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Uint8Array(buf);
  }

  beforeEach(() => {
    discoveryRegistry.clear();
    engine = new SpreadsheetDiscoveryEngine();
    discoveryRegistry.register(() => new SpreadsheetDiscoveryEngine());
  });

  describe('1. Registro e Resolução via Factory', () => {
    it('deve registrar e instanciar o SpreadsheetDiscoveryEngine no DiscoveryRegistry', () => {
      expect(discoveryRegistry.has('asterion-spreadsheet-discovery-engine')).toBe(true);
      const createdEngine = discoveryFactory.createEngine('asterion-spreadsheet-discovery-engine');
      expect(createdEngine.metadata.name).toBe('ASTERION Official Spreadsheet Discovery Engine');
    });
  });

  describe('2. Execução Observacional Sem Inferência Semântica', () => {
    it('deve observar uma planilha e construir um DiscoveryArtifact completo com estatísticas, relacionamentos e warnings', async () => {
      const buffer = createMockXlsxBuffer({
        Vendas: [
          ['CodigoVenda', 'Data', 'ValorTotal', 'Status'],
          [101, '2026-01-01', 1500, 'Ok'],
          [102, '2026-01-02', 2300, 'Ok']
        ],
        ItensVenda: [
          ['CodigoItem', 'CodigoVenda', 'Quantidade'],
          [1, 101, 2],
          [2, 101, 5],
          [3, 102, 1]
        ]
      });

      const connector = new SpreadsheetConnector({
        fileBuffer: buffer,
        filename: 'vendas_multitab.xlsx'
      });

      const ctx: DiscoveryExecutionContext = {
        dataSourceId: 'ds_test_777',
        engagementId: 'eng_test_888'
      };

      await connector.connect(ctx);
      const artifact = await engine.runDiscovery(ctx, connector);

      // Verificação dos contratos
      expect(artifact.artifactId).toBeDefined();
      expect(artifact.dataSourceId).toBe('ds_test_777');
      expect(artifact.engagementId).toBe('eng_test_888');
      expect(artifact.containers.length).toBe(2);

      // Estatísticas observacionais
      expect(artifact.statistics.totalContainersCount).toBe(2);
      expect(artifact.statistics.totalColumnsCount).toBe(7);
      expect(artifact.statistics.qualityScore).toBeGreaterThan(0);

      // Relacionamento físico detectado entre Vendas.CodigoVenda e ItensVenda.CodigoVenda (sem inferir DRE/Negócio)
      expect(artifact.relationships.length).toBe(1);
      expect(artifact.relationships[0].sourceColumnName.toLowerCase()).toBe('codigovenda');
      expect(artifact.relationships[0].relationshipType).toBe('ONE_TO_MANY');

      // Sugestão de chave primária para CodigoVenda (100% única em Vendas)
      const pkSuggestion = artifact.suggestions.find(s => s.type === 'PRIMARY_KEY_CANDIDATE' && s.targetRef.includes('CodigoVenda'));
      expect(pkSuggestion).toBeDefined();

      // Relatório de Execução
      const report = DiscoveryReportGenerator.generate(artifact);
      expect(report.containersFoundCount).toBe(2);
      expect(report.columnsFoundCount).toBe(7);
      expect(report.relationshipsDetectedCount).toBe(1);
    });

    it('deve gerar warnings para colunas vazias ou de tipos misturados', async () => {
      const buffer = createMockXlsxBuffer({
        DadosComRuido: [
          ['CampoVazio', 'CampoMisto'],
          [null, 100],
          [null, 'TextoRuido']
        ]
      });

      const connector = new SpreadsheetConnector({
        fileBuffer: buffer,
        filename: 'ruido.xlsx'
      });

      const ctx: DiscoveryExecutionContext = {
        dataSourceId: 'ds_ruido',
        engagementId: 'eng_ruido'
      };

      await connector.connect(ctx);
      const artifact = await engine.runDiscovery(ctx, connector);

      expect(artifact.warnings.length).toBeGreaterThan(0);
      const emptyColWarning = artifact.warnings.find(w => w.code === 'EMPTY_COLUMN');
      const mixedColWarning = artifact.warnings.find(w => w.code === 'MIXED_DATA_TYPES');

      expect(emptyColWarning).toBeDefined();
      expect(mixedColWarning).toBeDefined();
    });

    it('deve confirmar estritamente que nenhuma inferência de negócio (DRE, Cliente, Venda) é exposta no artefato', async () => {
      const buffer = createMockXlsxBuffer({
        Financeiro: [
          ['ReceitaBruta', 'CustoMercadoria', 'Margem'],
          [10000, 4000, 6000]
        ]
      });

      const connector = new SpreadsheetConnector({
        fileBuffer: buffer,
        filename: 'financeiro.xlsx'
      });

      const ctx: DiscoveryExecutionContext = {
        dataSourceId: 'ds_fin',
        engagementId: 'eng_fin'
      };

      await connector.connect(ctx);
      const artifact = await engine.runDiscovery(ctx, connector);

      const artifactString = JSON.stringify(artifact);
      expect(artifactString).not.toContain('"probableRole"');
      expect(artifactString).not.toContain('"DRE"');
      expect(artifactString).not.toContain('"REVENUE"');
    });
  });
});
