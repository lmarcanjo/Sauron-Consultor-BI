import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvidenceEngine, IncompatibleArtifactsError, EvidenceFingerprintBuilder } from './index';
import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../quality/QualityContracts';

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

describe('F2.3.1 — Evidence Integrity Hardening Specification', () => {
  let engine: EvidenceEngine;

  beforeEach(() => {
    engine = new EvidenceEngine();
  });

  function createMockArtifacts(): { discovery: DiscoveryArtifact; quality: QualityArtifact } {
    const discovery: DiscoveryArtifact = {
      artifactId: 'art_disc_evid_1',
      dataSourceId: 'ds_evid_test',
      engagementId: 'eng_evid_test',
      schemaVersionNumber: 1,
      containers: [
        {
          id: 'c1',
          name: 'Vendas',
          type: 'table',
          rowCountEstimate: 100,
          columns: [
            { name: 'id', originalName: 'id', index: 0, inferredType: 'INTEGER', nullable: false, sampleValues: [1, 2, 3, 4, 5], nullsCount: 0, distinctValuesCount: 100 },
            { name: 'colMista', originalName: 'colMista', index: 1, inferredType: 'MIXED', nullable: true, sampleValues: ['a', 1], nullsCount: 5, distinctValuesCount: 10 }
          ]
        }
      ],
      relationships: [
        {
          id: 'rel_1',
          sourceContainerId: 'c1',
          sourceColumnName: 'id',
          targetContainerId: 'c2',
          targetColumnName: 'venda_id',
          relationshipType: 'ONE_TO_MANY',
          confidenceScore: 0.9
        }
      ],
      statistics: {
        totalContainersCount: 1,
        totalColumnsCount: 2,
        totalEstimatedRows: 100,
        nullPercentageOverall: 5,
        distinctValuesEstimate: 110,
        qualityScore: 90
      },
      warnings: [],
      suggestions: [],
      fingerprint: { physicalFingerprint: 'phy_1', structuralFingerprint: 'str_1', generatedAt: '' },
      metadata: { engineId: 'mock-engine', engineVersion: '1.0', executionDurationMs: 10, executedAt: new Date().toISOString() }
    };

    const quality: QualityArtifact = {
      artifactId: 'art_qual_evid_1',
      discoveryArtifactId: 'art_disc_evid_1',
      dataSourceId: 'ds_evid_test',
      engagementId: 'eng_evid_test',
      metricsSummary: {
        overallQualityScore: 85,
        completenessScore: 90,
        consistencyScore: 80,
        uniquenessScore: 85,
        densityScore: 90,
        totalContainers: 1,
        totalColumns: 2,
        totalRowsEvaluated: 100,
        emptyColumnsCount: 0,
        constantColumnsCount: 0,
        mixedTypeColumnsCount: 1
      },
      containerMetrics: [],
      alerts: [
        {
          id: 'alt_1',
          code: 'COLUMN_MIXED_TYPES',
          severity: 'CRITICAL',
          message: 'Coluna colMista contém tipos misturados.',
          containerId: 'c1',
          columnName: 'colMista',
          detectedAt: new Date().toISOString()
        }
      ],
      recommendations: [],
      evaluatedAt: new Date().toISOString()
    };

    return { discovery, quality };
  }

  describe('1. Validação de Consistência Entre Artefatos', () => {
    it('deve rejeitar consolidação se dataSourceId for incompatível', () => {
      const { discovery, quality } = createMockArtifacts();
      const invalidQuality = { ...quality, dataSourceId: 'ds_invalido' };
      expect(() => engine.consolidate(discovery, invalidQuality)).toThrow(IncompatibleArtifactsError);
    });

    it('deve rejeitar consolidação se engagementId for incompatível', () => {
      const { discovery, quality } = createMockArtifacts();
      const invalidQuality = { ...quality, engagementId: 'eng_invalido' };
      expect(() => engine.consolidate(discovery, invalidQuality)).toThrow(IncompatibleArtifactsError);
    });

    it('deve rejeitar consolidação se qualityArtifact.discoveryArtifactId não corresponder ao discoveryArtifact.artifactId', () => {
      const { discovery, quality } = createMockArtifacts();
      const invalidQuality = { ...quality, discoveryArtifactId: 'art_disc_outra' };
      expect(() => engine.consolidate(discovery, invalidQuality)).toThrow(IncompatibleArtifactsError);
    });
  });

  describe('2. Evento Factual Próprio (EVIDENCE_ARTIFACT_GENERATED)', () => {
    it('deve emitir exclusivamente EVIDENCE_ARTIFACT_GENERATED no navegador', () => {
      const { discovery, quality } = createMockArtifacts();
      const dispatchSpy = vi.fn();
      vi.stubGlobal('window', { dispatchEvent: dispatchSpy });

      engine.consolidate(discovery, quality);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const eventCall = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(eventCall.type).toBe('EVIDENCE_ARTIFACT_GENERATED');
      expect(eventCall.detail.dataSourceId).toBe('ds_evid_test');

      vi.unstubAllGlobals();
    });
  });

  describe('3. Proveniência Granular e Amostragem Objetiva', () => {
    it('deve incluir proveniência detalhada por container, coluna e alerta', () => {
      const { discovery, quality } = createMockArtifacts();
      const artifact = engine.consolidate(discovery, quality);

      const colItem = artifact.evidences.find(e => e.type === 'STRUCTURAL' && e.provenance.columnName === 'id');
      expect(colItem).toBeDefined();
      expect(colItem?.provenance.sourceArtifactType).toBe('DiscoveryArtifact');
      expect(colItem?.provenance.containerId).toBe('c1');
      expect(colItem?.provenance.columnName).toBe('id');

      const alertItem = artifact.evidences.find(e => e.type === 'QUALITY_ANOMALY');
      expect(alertItem).toBeDefined();
      expect(alertItem?.provenance.sourceArtifactType).toBe('QualityArtifact');
      expect(alertItem?.provenance.alertId).toBe('alt_1');
    });

    it('deve registrar metadados de amostragem (sampleSize, populationSize, coverageRatio)', () => {
      const { discovery, quality } = createMockArtifacts();
      const artifact = engine.consolidate(discovery, quality);

      const colItem = artifact.evidences.find(e => e.type === 'STRUCTURAL' && e.provenance.columnName === 'id');
      expect(colItem?.sampling.isSampled).toBe(true);
      expect(colItem?.sampling.sampleSize).toBe(5);
      expect(colItem?.sampling.populationSize).toBe(100);
      expect(colItem?.sampling.coverageRatio).toBe(0.05);
    });
  });

  describe('4. Fingerprint Determinístico e Deduplicação', () => {
    it('deve produzir o mesmo hash para evidências apresentadas em ordens diferentes', () => {
      const { discovery, quality } = createMockArtifacts();
      const art1 = engine.consolidate(discovery, quality);

      // Inverte a ordem das colunas no mock de entrada
      const discoveryReordered = JSON.parse(JSON.stringify(discovery));
      discoveryReordered.containers[0].columns.reverse();

      const art2 = engine.consolidate(discoveryReordered, quality);
      expect(art1.fingerprint.evidenceHash).toBe(art2.fingerprint.evidenceHash);
    });

    it('deve alterar o hash se houver mudança factual nos dados', () => {
      const { discovery, quality } = createMockArtifacts();
      const art1 = engine.consolidate(discovery, quality);

      const discoveryModificado = JSON.parse(JSON.stringify(discovery));
      discoveryModificado.containers[0].columns[0].inferredType = 'FLOAT';

      const art2 = engine.consolidate(discoveryModificado, quality);
      expect(art1.fingerprint.evidenceHash).not.toBe(art2.fingerprint.evidenceHash);
    });

    it('deve mesclar provenientes de fatos idênticos sem duplicar o item no array de evidências', () => {
      const { discovery, quality } = createMockArtifacts();
      const art = engine.consolidate(discovery, quality);

      // Garante que não haja itens idênticos com a mesma chave no array final
      const keys = art.evidences.map(e => `${e.type}:${e.code}:${e.provenance.containerId}:${e.provenance.columnName || ''}:${e.provenance.alertId || ''}`);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  describe('5. Limites e Imutabilidade', () => {
    it('deve truncar explicitamente e registrar metadata se o limite for atingido', () => {
      const { discovery, quality } = createMockArtifacts();
      // Executa com limite máximo de 2 evidências
      const art = engine.consolidate(discovery, quality, 2);

      expect(art.metadata.truncated).toBe(true);
      expect(art.metadata.includedEvidenceCount).toBe(2);
      expect(art.evidences.length).toBe(2);
      expect(art.metadata.totalEvidenceCount).toBeGreaterThan(2);
    });

    it('deve proteger o EvidenceArtifact contra mutação direta (Object.freeze)', () => {
      const { discovery, quality } = createMockArtifacts();
      const art = engine.consolidate(discovery, quality);

      expect(() => {
        (art as any).dataSourceId = 'mutado';
      }).toThrow();
    });

    it('deve garantir cópia defensiva sem alterar os artefatos de entrada', () => {
      const { discovery, quality } = createMockArtifacts();
      const origDiscoveryStr = JSON.stringify(discovery);

      engine.consolidate(discovery, quality);
      expect(JSON.stringify(discovery)).toBe(origDiscoveryStr);
    });
  });
});
