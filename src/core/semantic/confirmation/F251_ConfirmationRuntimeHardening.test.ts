import { describe, it, expect, beforeEach } from 'vitest';
import { LocalSemanticConfirmationRepository } from './LocalSemanticConfirmationRepository';
import { SemanticConfirmationService } from './SemanticConfirmationService';
import { SemanticMaterialityPolicy } from './SemanticMaterialityPolicy';
import { SemanticConfirmationArtifact } from './SemanticConfirmationContracts';
import { SourceDrivenSemanticEngine } from '../SourceDrivenSemanticEngine';
import { DiscoveryArtifact } from '../../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../../quality/QualityContracts';
import { EvidenceArtifact } from '../../evidence/EvidenceContracts';
import { PersistenceManager, MemoryProvider } from '../../persistence/PersistenceManager';
import { PlatformUser } from '../../identity/types';

describe('Sprint 2.5.1 — Confirmation Runtime & Persistence Hardening', () => {
  let repository: LocalSemanticConfirmationRepository;
  let service: SemanticConfirmationService;
  let engine: SourceDrivenSemanticEngine;
  let persistenceManager: PersistenceManager;

  const mockConsultant: PlatformUser = {
    id: 'consultant_251',
    role: 'CONSULTANT',
    organizationId: 'org_251',
    profile: { id: 'consultant_251', fullName: 'Consultor Hardening', email: 'consultant251@asterion.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    persistenceManager = new PersistenceManager(new MemoryProvider());
    await persistenceManager.clear();
    repository = new LocalSemanticConfirmationRepository(persistenceManager);
    service = new SemanticConfirmationService(repository);
    engine = new SourceDrivenSemanticEngine();
  });

  function createMockPipelineArtifacts(): {
    discovery: DiscoveryArtifact;
    quality: QualityArtifact;
    evidence: EvidenceArtifact;
  } {
    const discovery: DiscoveryArtifact = {
      artifactId: 'art_disc_251',
      dataSourceId: 'ds_251_hardened',
      engagementId: 'eng_251',
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
      fingerprint: { physicalFingerprint: 'phy_251', structuralFingerprint: 'str_251', generatedAt: '' },
      metadata: { engineId: 'mock-engine', engineVersion: '1.0', executionDurationMs: 10, executedAt: new Date().toISOString() }
    };

    const quality: QualityArtifact = {
      artifactId: 'art_qual_251',
      discoveryArtifactId: 'art_disc_251',
      dataSourceId: 'ds_251_hardened',
      engagementId: 'eng_251',
      metricsSummary: { overallQualityScore: 95, completenessScore: 95, consistencyScore: 95, uniquenessScore: 95, densityScore: 95, totalContainers: 1, totalColumns: 3, totalRowsEvaluated: 100, emptyColumnsCount: 0, constantColumnsCount: 0, mixedTypeColumnsCount: 0 },
      containerMetrics: [],
      alerts: [],
      recommendations: [],
      evaluatedAt: new Date().toISOString()
    };

    const evidence: EvidenceArtifact = {
      artifactId: 'art_evid_251',
      discoveryArtifactId: 'art_disc_251',
      qualityArtifactId: 'art_qual_251',
      dataSourceId: 'ds_251_hardened',
      engagementId: 'eng_251',
      evidences: [],
      fingerprint: { discoveryFingerprint: 'str_251', qualityArtifactId: 'art_qual_251', evidenceHash: 'ev_hash_251', generatedAt: '' },
      metadata: { totalEvidenceCount: 0, includedEvidenceCount: 0, truncated: false, maxEvidenceLimit: 1000 },
      totalEvidencesCount: 0,
      evaluatedAt: new Date().toISOString()
    };

    return { discovery, quality, evidence };
  }

  describe('1. Persistence Hardening', () => {
    it('deve persistir artefatos de confirmação sobrevivendo a novas instâncias do repositório', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      await service.recordFieldDecision(semanticArtifact, 'tbl_vendas.DT_EMISSAO', 'CONFIRMED', undefined, mockConsultant);

      // Re-instancia o repositório utilizando a mesma camada de persistência
      const newRepoInstance = new LocalSemanticConfirmationRepository(persistenceManager);
      const retrieved = await newRepoInstance.findLatestBySemanticArtifact(semanticArtifact.artifactId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.fieldDecisions.length).toBe(1);
      expect(retrieved?.fieldDecisions[0].physicalName).toBe('DT_EMISSAO');
    });
  });

  describe('2. Materiality Policy', () => {
    it('deve bloquear a confirmação do entendimento se houver campos materiais sem decisão ou adiados', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      await service.startReview(semanticArtifact, mockConsultant);

      const evaluation = SemanticMaterialityPolicy.evaluateArtifact(semanticArtifact, await repository.findLatestBySemanticArtifact(semanticArtifact.artifactId));
      expect(evaluation.canConfirm).toBe(false);
      expect(evaluation.pendingMaterialFields.length).toBeGreaterThan(0);
    });

    it('deve liberar a confirmação do entendimento após todas as decisões materiais serem registradas', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      await service.recordFieldDecision(semanticArtifact, 'tbl_vendas.DT_EMISSAO', 'CONFIRMED', undefined, mockConsultant);
      await service.recordFieldDecision(semanticArtifact, 'tbl_vendas.VLR_TOTAL', 'CONFIRMED', undefined, mockConsultant);
      await service.recordFieldDecision(semanticArtifact, 'tbl_vendas.CAMPO_OPCIONAL', 'KEEP_ORIGINAL', undefined, mockConsultant);

      const confirmation = await service.confirmSourceUnderstanding(semanticArtifact, mockConsultant);
      expect(confirmation.dataSourceReady).toBe(true);
      expect(confirmation.confirmationArtifact.overallStatus).toBe('CONFIRMED');
    });
  });

  describe('3. Invalidação por Novo Schema', () => {
    it('deve invalidar a confirmação vigente quando o DataSource registrar novo Schema V2', async () => {
      const { discovery, quality, evidence } = createMockPipelineArtifacts();
      const semanticArtifact = engine.interpret(discovery, quality, evidence);

      await service.recordFieldDecision(semanticArtifact, 'tbl_vendas.DT_EMISSAO', 'CONFIRMED', undefined, mockConsultant);
      await service.recordFieldDecision(semanticArtifact, 'tbl_vendas.VLR_TOTAL', 'CONFIRMED', undefined, mockConsultant);
      await service.recordFieldDecision(semanticArtifact, 'tbl_vendas.CAMPO_OPCIONAL', 'KEEP_ORIGINAL', undefined, mockConsultant);
      await service.confirmSourceUnderstanding(semanticArtifact, mockConsultant);

      // Invalidação por novo schema V2
      await service.invalidateForNewSchema(semanticArtifact.dataSourceId, 2);

      const history = await repository.findHistoryByDataSource(semanticArtifact.dataSourceId);
      expect(history[0].overallStatus).toBe('INVALIDATED');
    });
  });
});
