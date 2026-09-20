import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SourceDrivenSemanticEngine, IncompatibleSemanticArtifactsError, SemanticConfidenceCalculator } from './index';
import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../quality/QualityContracts';
import { EvidenceArtifact } from '../evidence/EvidenceContracts';

describe('F2.4.1 — Semantic Integrity Hardening Specification', () => {
  let engine: SourceDrivenSemanticEngine;

  beforeEach(() => {
    engine = new SourceDrivenSemanticEngine();
  });

  function createMockPipelineArtifacts(): {
    discovery: DiscoveryArtifact;
    quality: QualityArtifact;
    evidence: EvidenceArtifact;
  } {
    const discovery: DiscoveryArtifact = {
      artifactId: 'art_disc_sem_1',
      dataSourceId: 'ds_sem_test',
      engagementId: 'eng_sem_test',
      schemaVersionNumber: 1,
      containers: [
        {
          id: 'tbl_vendas',
          name: 'Vendas_2026',
          type: 'table',
          rowCountEstimate: 200,
          columns: [
            { name: 'DT_EMISSAO', originalName: 'DT_EMISSAO', index: 0, inferredType: 'DATE', nullable: false, sampleValues: ['2026-01-01'], nullsCount: 0, distinctValuesCount: 150 },
            { name: 'VLR_TOTAL', originalName: 'VLR_TOTAL', index: 1, inferredType: 'FLOAT', nullable: false, sampleValues: [150.50], nullsCount: 0, distinctValuesCount: 180 },
            { name: 'VALOR_TEXTO_INVALIDO', originalName: 'VALOR_TEXTO_INVALIDO', index: 2, inferredType: 'STRING', nullable: false, sampleValues: ['Custo alto'], nullsCount: 0, distinctValuesCount: 50 },
            { name: 'CAMPO_MISTO_X', originalName: 'CAMPO_MISTO_X', index: 3, inferredType: 'MIXED', nullable: true, sampleValues: ['A', 10], nullsCount: 10, distinctValuesCount: 20 },
            { name: 'COLUNA_DESCONHECIDA_99', originalName: 'COLUNA_DESCONHECIDA_99', index: 4, inferredType: 'STRING', nullable: true, sampleValues: ['XYZ'], nullsCount: 5, distinctValuesCount: 10 }
          ]
        }
      ],
      relationships: [],
      statistics: { totalContainersCount: 1, totalColumnsCount: 5, totalEstimatedRows: 200, nullPercentageOverall: 2, distinctValuesEstimate: 410, qualityScore: 92 },
      warnings: [],
      suggestions: [],
      fingerprint: { physicalFingerprint: 'phy_sem', structuralFingerprint: 'str_sem', generatedAt: '' },
      metadata: { engineId: 'mock-engine', engineVersion: '1.0', executionDurationMs: 10, executedAt: new Date().toISOString() }
    };

    const quality: QualityArtifact = {
      artifactId: 'art_qual_sem_1',
      discoveryArtifactId: 'art_disc_sem_1',
      dataSourceId: 'ds_sem_test',
      engagementId: 'eng_sem_test',
      metricsSummary: { overallQualityScore: 90, completenessScore: 95, consistencyScore: 85, uniquenessScore: 90, densityScore: 95, totalContainers: 1, totalColumns: 5, totalRowsEvaluated: 200, emptyColumnsCount: 0, constantColumnsCount: 0, mixedTypeColumnsCount: 1 },
      containerMetrics: [],
      alerts: [
        { id: 'alt_misto', code: 'COLUMN_MIXED_TYPES', severity: 'CRITICAL', message: 'Tipos misturados em CAMPO_MISTO_X', containerId: 'tbl_vendas', columnName: 'CAMPO_MISTO_X', detectedAt: new Date().toISOString() }
      ],
      recommendations: [],
      evaluatedAt: new Date().toISOString()
    };

    const evidence: EvidenceArtifact = {
      artifactId: 'art_evid_sem_1',
      discoveryArtifactId: 'art_disc_sem_1',
      qualityArtifactId: 'art_qual_sem_1',
      dataSourceId: 'ds_sem_test',
      engagementId: 'eng_sem_test',
      evidences: [
        {
          id: 'ev_struct_DT_EMISSAO',
          type: 'STRUCTURAL',
          severity: 'INFO',
          code: 'COLUMN_PHYSICAL_STRUCTURE',
          description: 'Coluna DT_EMISSAO com tipo DATE',
          provenance: { sourceArtifactType: 'DiscoveryArtifact', sourceArtifactId: 'art_disc_sem_1', dataSourceId: 'ds_sem_test', engagementId: 'eng_sem_test', schemaVersionNumber: 1, sourceEngine: 'mock', containerId: 'tbl_vendas', columnName: 'DT_EMISSAO', sourceFingerprint: 'str_sem', observedAt: '' },
          sampling: { isSampled: false },
          containerId: 'tbl_vendas',
          columnName: 'DT_EMISSAO',
          observedAt: ''
        }
      ],
      fingerprint: { discoveryFingerprint: 'str_sem', qualityArtifactId: 'art_qual_sem_1', evidenceHash: 'ev_hash_123', generatedAt: '' },
      metadata: { totalEvidenceCount: 1, includedEvidenceCount: 1, truncated: false, maxEvidenceLimit: 1000 },
      totalEvidencesCount: 1,
      evaluatedAt: new Date().toISOString()
    };

    return { discovery, quality, evidence };
  }

  describe('1. Estados Semânticos Restritos', () => {
    it('o motor deve produzir exclusivamente UNINTERPRETED, SUGGESTED ou NEEDS_REVIEW (nunca CONFIRMED ou REJECTED)', () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const artifact = engine.interpret(discovery, quality, evidence);

      const fieldStatuses = artifact.fieldInterpretations.map(f => f.interpretationStatus);
      for (const status of fieldStatuses) {
        expect(['UNINTERPRETED', 'SUGGESTED', 'NEEDS_REVIEW']).toContain(status);
        expect(status).not.toBe('CONFIRMED');
        expect(status).not.toBe('REJECTED');
      }

      for (const f of artifact.fieldInterpretations) {
        for (const sugg of f.suggestedInterpretations) {
          expect(['SUGGESTED', 'NEEDS_REVIEW']).toContain(sugg.status);
          expect(sugg.status).not.toBe('CONFIRMED');
          expect(sugg.status).not.toBe('REJECTED');
        }
      }
    });
  });

  describe('2. Contrato e Clamp da Confiança', () => {
    it('o score de confiança deve ficar estritamente entre 0.00 e 1.00 sem NaN ou Infinity', () => {
      const res1 = SemanticConfidenceCalculator.calculate({
        lexicalMatchScore: NaN,
        typeMatchScore: Infinity,
        evidenceCount: 10,
        coverageRatio: -0.5,
        hasContradiction: true,
        isEvidenceTruncated: true
      });

      expect(res1.score).toBeGreaterThanOrEqual(0.0);
      expect(res1.score).toBeLessThanOrEqual(1.0);
      expect(isNaN(res1.score)).toBe(false);
      expect(isFinite(res1.score)).toBe(true);
    });
  });

  describe('3. Regras de Bloqueio Semântico', () => {
    it('não deve permitir pontuação HIGH para MONETARY_MEASURE em campo com tipo texto ruidoso/incompatível', () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const artifact = engine.interpret(discovery, quality, evidence);

      const invalidoInterp = artifact.fieldInterpretations.find(f => f.physicalName === 'VALOR_TEXTO_INVALIDO');
      expect(invalidoInterp).toBeDefined();

      const topSugg = invalidoInterp?.suggestedInterpretations[0];
      expect(topSugg?.confidenceBand).not.toBe('HIGH');
    });
  });

  describe('4. Teste Crítico Source-Driven Permanente (Proteção contra Modelo Inverso)', () => {
    it('CRITÉRIO CRÍTICO: para toda coluna física recebida existe exatamente uma representação semântica mantendo physicalName soberano', () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const artifact = engine.interpret(discovery, quality, evidence);

      expect(artifact.fieldInterpretations.length).toBe(discovery.containers[0].columns.length);

      for (let i = 0; i < discovery.containers[0].columns.length; i++) {
        const colFisica = discovery.containers[0].columns[i];
        const colSemantica = artifact.fieldInterpretations[i];
        expect(colSemantica.physicalName).toBe(colFisica.name);
      }
    });

    it('fonte com nomes inteiramente desconhecidos ou numéricos deve preservar todas as colunas no artefato sem criar campos inventados', () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const discoveryDesconhecido = JSON.parse(JSON.stringify(discovery));
      discoveryDesconhecido.containers[0].columns = [
        { name: 'COL_991', originalName: 'COL_991', index: 0, inferredType: 'STRING', sampleValues: ['X'] },
        { name: 'COL_992', originalName: 'COL_992', index: 1, inferredType: 'INTEGER', sampleValues: [1] }
      ];

      const artifact = engine.interpret(discoveryDesconhecido, quality, evidence);
      expect(artifact.fieldInterpretations.length).toBe(2);
      expect(artifact.fieldInterpretations[0].physicalName).toBe('COL_991');
      expect(artifact.fieldInterpretations[1].physicalName).toBe('COL_992');
    });
  });

  describe('5. Imutabilidade Profunda & Pureza', () => {
    it('deve proteger o SemanticArtifact e todas as coleções internas com Object.freeze', () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const artifact = engine.interpret(discovery, quality, evidence);

      expect(() => { (artifact as any).dataSourceId = 'mutado'; }).toThrow();
      expect(() => { (artifact.fieldInterpretations as any).push({} as any); }).toThrow();
      expect(() => { (artifact.fieldInterpretations[0].suggestedInterpretations as any).push({} as any); }).toThrow();
    });

    it('deve utilizar dispatcher injetável mantendo a função pura sem emitir evento em falha', () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const customSpy = vi.fn();
      const invalidQuality = { ...quality, dataSourceId: 'ds_invalido' };

      expect(() => engine.interpret(discovery, invalidQuality, evidence, customSpy)).toThrow(IncompatibleSemanticArtifactsError);
      expect(customSpy).not.toHaveBeenCalled();
    });
  });
});
