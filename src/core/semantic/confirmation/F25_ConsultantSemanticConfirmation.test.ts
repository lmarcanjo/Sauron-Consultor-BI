import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SemanticConfirmationService, semanticConfirmationRepository } from './index';
import { SourceDrivenSemanticEngine } from '../SourceDrivenSemanticEngine';
import { DiscoveryArtifact } from '../../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../../quality/QualityContracts';
import { EvidenceArtifact } from '../../evidence/EvidenceContracts';
import { PlatformUser } from '../../identity/types';

import { PersistenceManager, MemoryProvider } from '../../persistence/PersistenceManager';
import { LocalSemanticConfirmationRepository } from './LocalSemanticConfirmationRepository';

describe('F2.5 — Consultant Semantic Confirmation Specification', () => {
  let engine: SourceDrivenSemanticEngine;
  let confirmationService: SemanticConfirmationService;
  let repo: LocalSemanticConfirmationRepository;

  const mockConsultant: PlatformUser = {
    id: 'consultant_test_1',
    role: 'CONSULTANT',
    organizationId: 'org_test_1',
    profile: { id: 'consultant_test_1', fullName: 'Consultor Teste', email: 'consultant@asterion.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    engine = new SourceDrivenSemanticEngine();
    const pm = new PersistenceManager(new MemoryProvider());
    repo = new LocalSemanticConfirmationRepository(pm);
    confirmationService = new SemanticConfirmationService(repo);
  });

  function createMockPipelineArtifacts(): {
    discovery: DiscoveryArtifact;
    quality: QualityArtifact;
    evidence: EvidenceArtifact;
  } {
    const discovery: DiscoveryArtifact = {
      artifactId: 'art_disc_conf_1',
      dataSourceId: 'ds_conf_test',
      engagementId: 'eng_conf_test',
      schemaVersionNumber: 1,
      containers: [
        {
          id: 'tbl_vendas',
          name: 'Vendas_2026',
          type: 'table',
          rowCountEstimate: 100,
          columns: [
            { name: 'DT_EMISSAO', originalName: 'DT_EMISSAO', index: 0, inferredType: 'DATE', nullable: false, sampleValues: ['2026-01-01'], nullsCount: 0, distinctValuesCount: 100 },
            { name: 'VLR_TOTAL', originalName: 'VLR_TOTAL', index: 1, inferredType: 'FLOAT', nullable: false, sampleValues: [150.0], nullsCount: 0, distinctValuesCount: 90 },
            { name: 'CAMPO_OPCIONAL', originalName: 'CAMPO_OPCIONAL', index: 2, inferredType: 'STRING', nullable: true, sampleValues: ['A'], nullsCount: 10, distinctValuesCount: 5 }
          ]
        }
      ],
      relationships: [],
      statistics: { totalContainersCount: 1, totalColumnsCount: 3, totalEstimatedRows: 100, nullPercentageOverall: 2, distinctValuesEstimate: 195, qualityScore: 95 },
      warnings: [],
      suggestions: [],
      fingerprint: { physicalFingerprint: 'phy_conf', structuralFingerprint: 'str_conf', generatedAt: '' },
      metadata: { engineId: 'mock-engine', engineVersion: '1.0', executionDurationMs: 10, executedAt: new Date().toISOString() }
    };

    const quality: QualityArtifact = {
      artifactId: 'art_qual_conf_1',
      discoveryArtifactId: 'art_disc_conf_1',
      dataSourceId: 'ds_conf_test',
      engagementId: 'eng_conf_test',
      metricsSummary: { overallQualityScore: 95, completenessScore: 95, consistencyScore: 95, uniquenessScore: 95, densityScore: 95, totalContainers: 1, totalColumns: 3, totalRowsEvaluated: 100, emptyColumnsCount: 0, constantColumnsCount: 0, mixedTypeColumnsCount: 0 },
      containerMetrics: [],
      alerts: [],
      recommendations: [],
      evaluatedAt: new Date().toISOString()
    };

    const evidence: EvidenceArtifact = {
      artifactId: 'art_evid_conf_1',
      discoveryArtifactId: 'art_disc_conf_1',
      qualityArtifactId: 'art_qual_conf_1',
      dataSourceId: 'ds_conf_test',
      engagementId: 'eng_conf_test',
      evidences: [],
      fingerprint: { discoveryFingerprint: 'str_conf', qualityArtifactId: 'art_qual_conf_1', evidenceHash: 'ev_hash_conf', generatedAt: '' },
      metadata: { totalEvidenceCount: 0, includedEvidenceCount: 0, truncated: false, maxEvidenceLimit: 1000 },
      totalEvidencesCount: 0,
      evaluatedAt: new Date().toISOString()
    };

    return { discovery, quality, evidence };
  }

  describe('1. Preservação da Fonte e Decisões do Consultor', () => {
    it('deve registrar decisão CONFIRMED preservando soberanamente o physicalName', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      const confirmationArtifact = async () => {
        await confirmationService.startReview(semanticArtifact, mockConsultant);
        return confirmationService.recordFieldDecision(semanticArtifact, 'tbl_vendas.DT_EMISSAO', 'CONFIRMED', undefined, mockConsultant);
      };

      const result = await confirmationArtifact();
      expect(result.fieldDecisions.length).toBe(1);

      const decision = result.fieldDecisions[0];
      expect(decision.physicalName).toBe('DT_EMISSAO');
      expect(decision.decision).toBe('CONFIRMED');
      expect(semanticArtifact.fieldInterpretations[0].physicalName).toBe('DT_EMISSAO'); // Intacto no SemanticArtifact original
    });

    it('deve permitir decisão REJECTED mantendo o campo disponível sem removê-lo da estrutura', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      const result = await confirmationService.recordFieldDecision(semanticArtifact, 'tbl_vendas.VLR_TOTAL', 'REJECTED', undefined, mockConsultant);
      expect(result.fieldDecisions[0].decision).toBe('REJECTED');
      expect(result.fieldDecisions[0].physicalName).toBe('VLR_TOTAL');
    });

    it('deve permitir KEEP_ORIGINAL e CUSTOM_INTERPRETATION explicitamente marcadas como ação humana', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      const resultCustom = await confirmationService.recordFieldDecision(
        semanticArtifact,
        'tbl_vendas.CAMPO_OPCIONAL',
        'CUSTOM_INTERPRETATION',
        {
          customPayload: {
            label: 'Observação Consultiva Customizada',
            category: 'TEXTUAL_DESCRIPTION',
            justification: 'Definido pelo consultor para o engajamento',
            isManual: true
          }
        },
        mockConsultant
      );

      const customDecision = resultCustom.fieldDecisions.find(d => d.columnId === 'tbl_vendas.CAMPO_OPCIONAL');
      expect(customDecision?.decision).toBe('CUSTOM_INTERPRETATION');
      expect(customDecision?.customPayload?.isManual).toBe(true);
      expect(customDecision?.consultantLabel).toBe('Observação Consultiva Customizada');
    });
  });

  describe('2. Orquestração e Operação confirmSourceUnderstanding', () => {
    it('deve bloquear confirmSourceUnderstanding se houver campos materiais pendentes', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      await confirmationService.startReview(semanticArtifact, mockConsultant);

      await expect(confirmationService.confirmSourceUnderstanding(semanticArtifact, mockConsultant)).rejects.toThrow('pendente(s)');
    });

    it('deve avançar o DataSource para o estado READY via método oficial após confirmação válida de todos os campos materiais', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      await confirmationService.recordFieldDecision(semanticArtifact, 'tbl_vendas.DT_EMISSAO', 'CONFIRMED', undefined, mockConsultant);
      await confirmationService.recordFieldDecision(semanticArtifact, 'tbl_vendas.VLR_TOTAL', 'CONFIRMED', undefined, mockConsultant);
      await confirmationService.recordFieldDecision(semanticArtifact, 'tbl_vendas.CAMPO_OPCIONAL', 'KEEP_ORIGINAL', undefined, mockConsultant);

      const res = await confirmationService.confirmSourceUnderstanding(semanticArtifact, mockConsultant);

      expect(res.dataSourceReady).toBe(true);
      expect(res.confirmationArtifact.overallStatus).toBe('CONFIRMED');
    });
  });

  describe('3. Versionamento Imutável e Invalidação por Novo Schema', () => {
    it('deve invalidar confirmações antigas quando uma nova versão de schema for detectada', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      await confirmationService.startReview(semanticArtifact, mockConsultant);
      await confirmationService.invalidateForNewSchema(semanticArtifact.dataSourceId, 2);

      const history = await repo.findHistoryByDataSource(semanticArtifact.dataSourceId);
      expect(history[0].overallStatus).toBe('INVALIDATED');
    });
  });
});
