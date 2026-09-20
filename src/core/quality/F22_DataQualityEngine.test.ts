import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataQualityEngine } from './index';
import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';

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

describe('F2.2 — DataQualityEngine Specification', () => {
  let engine: DataQualityEngine;

  beforeEach(() => {
    engine = new DataQualityEngine();
  });

  function createMockDiscoveryArtifact(overrides?: Partial<DiscoveryArtifact>): DiscoveryArtifact {
    return {
      artifactId: 'art_disc_mock_1',
      dataSourceId: 'ds_test_quality',
      engagementId: 'eng_test_quality',
      schemaVersionNumber: 1,
      containers: [
        {
          id: 'c1',
          name: 'Tabela Teste',
          type: 'table',
          rowCountEstimate: 100,
          columns: [
            { name: 'id', originalName: 'id', index: 0, inferredType: 'INTEGER', nullable: false, sampleValues: [1, 2], nullsCount: 0, distinctValuesCount: 100 },
            { name: 'campoNulo', originalName: 'campoNulo', index: 1, inferredType: 'EMPTY', nullable: true, sampleValues: [], nullsCount: 100, distinctValuesCount: 0 },
            { name: 'campoMisto', originalName: 'campoMisto', index: 2, inferredType: 'MIXED', nullable: true, sampleValues: [1, 'Ruido'], nullsCount: 10, distinctValuesCount: 20 },
            { name: 'campoConstante', originalName: 'campoConstante', index: 3, inferredType: 'STRING', nullable: false, sampleValues: ['FIXO'], nullsCount: 0, distinctValuesCount: 1 }
          ]
        }
      ],
      relationships: [],
      statistics: {
        totalContainersCount: 1,
        totalColumnsCount: 4,
        totalEstimatedRows: 100,
        nullPercentageOverall: 25,
        distinctValuesEstimate: 121,
        qualityScore: 75
      },
      warnings: [],
      suggestions: [],
      fingerprint: { physicalFingerprint: 'phy_1', structuralFingerprint: 'str_1', generatedAt: '' },
      metadata: { engineId: 'mock', engineVersion: '1.0', executionDurationMs: 10, executedAt: '' },
      ...overrides
    };
  }

  describe('1. Cálculo de Métricas Matemáticas Puras', () => {
    it('deve calcular métricas completas por coluna (completude, unicidade, densidade e duplicidade)', () => {
      const artifact = createMockDiscoveryArtifact();
      const qualityArtifact = engine.evaluateQuality(artifact);

      expect(qualityArtifact.artifactId).toBeDefined();
      expect(qualityArtifact.containerMetrics.length).toBe(1);

      const colMetrics = qualityArtifact.containerMetrics[0].columnMetrics;
      expect(colMetrics.length).toBe(4);

      // Coluna 'id' (100% integra)
      const idCol = colMetrics.find(c => c.columnName === 'id')!;
      expect(idCol.nullsPercentage).toBe(0);
      expect(idCol.uniquenessPercentage).toBe(100);
      expect(idCol.qualityScore).toBe(100);

      // Coluna 'campoNulo' (100% nula)
      const nullCol = colMetrics.find(c => c.columnName === 'campoNulo')!;
      expect(nullCol.isEmpty).toBe(true);
      expect(nullCol.qualityScore).toBe(0);

      // Coluna 'campoMisto' (dados com tipos misturados)
      const mixedCol = colMetrics.find(c => c.columnName === 'campoMisto')!;
      expect(mixedCol.hasMixedTypes).toBe(true);
      expect(mixedCol.qualityScore).toBeLessThan(100);

      // Coluna 'campoConstante' (apenas 1 valor distinto)
      const constCol = colMetrics.find(c => c.columnName === 'campoConstante')!;
      expect(constCol.isConstant).toBe(true);
    });

    it('deve consolidar o resumo global de qualidade (overallQualityScore)', () => {
      const artifact = createMockDiscoveryArtifact();
      const qualityArtifact = engine.evaluateQuality(artifact);

      const summary = qualityArtifact.metricsSummary;
      expect(summary.totalContainers).toBe(1);
      expect(summary.totalColumns).toBe(4);
      expect(summary.emptyColumnsCount).toBe(1);
      expect(summary.constantColumnsCount).toBe(1);
      expect(summary.mixedTypeColumnsCount).toBe(1);
      expect(summary.overallQualityScore).toBeGreaterThan(0);
    });
  });

  describe('2. Geração de Alertas Técnicos e Recomendações', () => {
    it('deve gerar alertas para colunas 100% nulas, tipos mistos e valores constantes', () => {
      const artifact = createMockDiscoveryArtifact();
      const qualityArtifact = engine.evaluateQuality(artifact);

      expect(qualityArtifact.alerts.length).toBeGreaterThan(0);
      expect(qualityArtifact.alerts.some(a => a.code === 'COLUMN_FULLY_NULL')).toBe(true);
      expect(qualityArtifact.alerts.some(a => a.code === 'COLUMN_MIXED_TYPES')).toBe(true);
      expect(qualityArtifact.alerts.some(a => a.code === 'COLUMN_CONSTANT_VALUE')).toBe(true);
    });

    it('deve gerar recomendações técnicas de conversão/sanitização sem inferir regras de negócio', () => {
      const artifact = createMockDiscoveryArtifact();
      const qualityArtifact = engine.evaluateQuality(artifact);

      expect(qualityArtifact.recommendations.length).toBeGreaterThan(0);
      const typeRec = qualityArtifact.recommendations.find(r => r.type === 'TYPE_SANITIZATION');
      expect(typeRec).toBeDefined();
      expect(typeRec?.suggestedAction).toBe('CAST_OR_CONVERT_NOISE');
    });
  });

  describe('3. Ausência Absoluta de Inferência Semântica', () => {
    it('deve confirmar que nenhuma regra de negócio ou significado (DRE, Cliente, Venda) é gerado no QualityArtifact', () => {
      const artifact = createMockDiscoveryArtifact();
      const qualityArtifact = engine.evaluateQuality(artifact);

      const jsonStr = JSON.stringify(qualityArtifact);
      expect(jsonStr).not.toContain('"DRE"');
      expect(jsonStr).not.toContain('"REVENUE"');
      expect(jsonStr).not.toContain('"CLIENT"');
      expect(jsonStr).not.toContain('"domainRole"');
    });
  });
});
