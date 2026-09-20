import { describe, it, expect, beforeEach } from 'vitest';
import { TrustEngine } from './TrustEngine';
import { TrustAssessmentService } from './TrustAssessmentService';
import { LocalTrustArtifactRepository } from './TrustArtifactRepository';
import { PersistenceManager, MemoryProvider } from '../persistence/PersistenceManager';
import { DataSource } from '../datasource/DataSource';
import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../quality/QualityContracts';
import { EvidenceArtifact } from '../evidence/EvidenceContracts';
import { SemanticArtifact } from '../semantic/SemanticContracts';
import { SemanticConfirmationArtifact } from '../semantic/confirmation/SemanticConfirmationContracts';
import { PlatformUser } from '../identity/types';
import { IncompatibleTrustArtifactsError } from './TrustContracts';

describe('Sprint 2.6 — Trust Engine & Trust Artifact Specification', () => {
  let engine: TrustEngine;
  let repository: LocalTrustArtifactRepository;
  let service: TrustAssessmentService;

  const mockUser: PlatformUser = {
    id: 'consultant_trust_1',
    role: 'CONSULTANT',
    organizationId: 'org_trust_1',
    profile: { id: 'consultant_trust_1', fullName: 'Trust Architect', email: 'trust@asterion.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  function createMockDataSource(state: 'WAITING_CONFIRMATION' | 'READY' = 'READY'): DataSource {
    const ds = new DataSource({
      id: 'ds_trust_test_1',
      engagementId: 'eng_trust_1',
      organizationalScope: { scopeType: 'COMPANY', targetId: 'c1' },
      name: 'Vendas_2026.xlsx',
      originType: 'EXCEL',
      createdByUserId: 'user_1'
    });
    ds.registerConnectionEvidence({
      connectedAt: new Date().toISOString(),
      connectedByUserId: 'user_1',
      summary: 'Upload de arquivo Excel'
    });
    ds.startDiscovery();
    ds.completeDiscovery({
      containerProfiles: [{ id: 'c1', name: 'Planilha1', type: 'sheet', rowCount: 100, columnNames: ['a', 'b'] }]
    });

    if (state === 'READY') {
      ds.confirmCurrentSchema('consultant_trust_1', 'Trust Architect', 'Homologado');
    }
    return ds;
  }

  function createMockDiscovery(): DiscoveryArtifact {
    return {
      artifactId: 'disc_trust_1',
      dataSourceId: 'ds_trust_test_1',
      engagementId: 'eng_trust_1',
      schemaVersionNumber: 1,
      containers: [],
      relationships: [],
      statistics: { totalContainersCount: 1, totalColumnsCount: 5, totalEstimatedRows: 100, nullPercentageOverall: 0, distinctValuesEstimate: 5, qualityScore: 90 },
      warnings: [],
      suggestions: [],
      fingerprint: { physicalFingerprint: 'hash_disc', structuralFingerprint: 'hash_struct', generatedAt: new Date().toISOString() },
      metadata: { engineId: 'discovery', engineVersion: '1.0.0', executionDurationMs: 10, executedAt: new Date().toISOString() }
    };
  }

  function createMockQuality(): QualityArtifact {
    return {
      artifactId: 'qual_trust_1',
      discoveryArtifactId: 'disc_trust_1',
      dataSourceId: 'ds_trust_test_1',
      engagementId: 'eng_trust_1',
      schemaVersionNumber: 1,
      overallQualityScore: 0.92,
      alerts: [],
      recommendations: [],
      evaluatedAt: new Date().toISOString(),
      fingerprint: { artifactHash: 'hash_qual', algorithm: 'FNV1A_32_CANONICAL', generatedAt: new Date().toISOString() },
      metadata: { totalEvaluatedContainers: 1, totalEvaluatedColumns: 5, totalAlertsCount: 0, executionDurationMs: 10 }
    };
  }

  function createMockEvidence(): EvidenceArtifact {
    return {
      artifactId: 'ev_trust_1',
      discoveryArtifactId: 'disc_trust_1',
      qualityArtifactId: 'qual_trust_1',
      dataSourceId: 'ds_trust_test_1',
      engagementId: 'eng_trust_1',
      evidences: [],
      totalEvidencesCount: 5,
      evaluatedAt: new Date().toISOString(),
      fingerprint: { discoveryFingerprint: 'disc_fp', qualityArtifactId: 'qual_trust_1', evidenceHash: 'hash_ev', generatedAt: new Date().toISOString() },
      metadata: { totalEvidenceCount: 5, includedEvidenceCount: 5, truncated: false, maxEvidenceLimit: 100 }
    };
  }

  function createMockSemantic(): SemanticArtifact {
    return {
      artifactId: 'sem_trust_1',
      discoveryArtifactId: 'disc_trust_1',
      qualityArtifactId: 'qual_trust_1',
      evidenceArtifactId: 'ev_trust_1',
      dataSourceId: 'ds_trust_test_1',
      engagementId: 'eng_trust_1',
      schemaVersionNumber: 1,
      fieldInterpretations: [],
      containerInterpretations: [],
      relationshipInterpretations: [],
      unresolvedQuestions: [],
      groupedUnresolvedQuestions: [],
      generatedAt: new Date().toISOString(),
      fingerprint: { discoveryFingerprint: 'disc_fp', evidenceHash: 'ev_hash', semanticHash: 'sem_hash', algorithm: 'FNV1A_32_CANONICAL', generatedAt: new Date().toISOString() },
      metadata: { engineId: 'semantic', engineVersion: '1.0.0', executionDurationMs: 10, isEvidenceTruncated: false, totalFieldsInterpreted: 5, totalSuggestionsGenerated: 5, totalQuestionsGenerated: 0, generatedAt: new Date().toISOString() }
    };
  }

  function createMockConfirmation(status: 'CONFIRMED' | 'INVALIDATED' | 'IN_REVIEW' = 'CONFIRMED'): SemanticConfirmationArtifact {
    return {
      artifactId: 'conf_trust_1',
      semanticArtifactId: 'sem_trust_1',
      discoveryArtifactId: 'disc_trust_1',
      evidenceArtifactId: 'ev_trust_1',
      dataSourceId: 'ds_trust_test_1',
      engagementId: 'eng_trust_1',
      schemaVersionNumber: 1,
      consultantId: 'consultant_trust_1',
      version: 1,
      fieldDecisions: [],
      containerDecisions: [],
      relationshipDecisions: [],
      overallStatus: status as any,
      createdAt: new Date().toISOString(),
      fingerprint: { semanticArtifactId: 'sem_trust_1', confirmationHash: 'hash_conf', algorithm: 'FNV1A_32_CANONICAL', generatedAt: new Date().toISOString() },
      metadata: { engineVersion: '1.0.0', schemaVersionNumber: 1, totalFieldsCount: 5, confirmedFieldsCount: 5, rejectedFieldsCount: 0, keptOriginalFieldsCount: 0, customFieldsCount: 0, deferredFieldsCount: 0, materialFieldsPendingCount: 0 }
    };
  }

  beforeEach(() => {
    engine = new TrustEngine();
    const memoryProvider = new MemoryProvider();
    repository = new LocalTrustArtifactRepository(memoryProvider);
    service = new TrustAssessmentService(repository);
  });

  describe('1. Regras Determinísticas e Estados de Confiança', () => {
    it('deve marcar overallState como BLOCKED quando o DataSource não estiver no estado READY', () => {
      const dataSource = createMockDataSource('WAITING_CONFIRMATION');
      const artifact = engine.evaluate({
        dataSource,
        discoveryArtifact: createMockDiscovery(),
        qualityArtifact: createMockQuality(),
        evidenceArtifact: createMockEvidence(),
        semanticArtifact: createMockSemantic(),
        semanticConfirmationArtifact: createMockConfirmation()
      });

      expect(artifact.trustAssessment.overallState).toBe('BLOCKED');
      expect(artifact.blockingConditions.some(b => b.code === 'SOURCE_NOT_READY')).toBe(true);
      expect(artifact.usageAssessments.find(u => u.usageType === 'EXECUTIVE_PRESENTATION')?.status).toBe('BLOCKED');
    });

    it('deve marcar overallState como TRUSTED quando DataSource for READY e confirmação estiver CONFIRMED sem anomalias', () => {
      const dataSource = createMockDataSource('READY');
      const artifact = engine.evaluate({
        dataSource,
        discoveryArtifact: createMockDiscovery(),
        qualityArtifact: createMockQuality(),
        evidenceArtifact: createMockEvidence(),
        semanticArtifact: createMockSemantic(),
        semanticConfirmationArtifact: createMockConfirmation('CONFIRMED')
      });

      expect(artifact.trustAssessment.overallState).toBe('TRUSTED');
      expect(artifact.trustAssessment.overallScore).toBeGreaterThanOrEqual(0.8);
      expect(artifact.usageAssessments.find(u => u.usageType === 'EXPLORATORY_ANALYSIS')?.status).toBe('TRUSTED');
    });

    it('deve bloquear a confiança quando o SemanticConfirmationArtifact for INVALIDATED por novo schema', () => {
      const dataSource = createMockDataSource('READY');
      const artifact = engine.evaluate({
        dataSource,
        discoveryArtifact: createMockDiscovery(),
        qualityArtifact: createMockQuality(),
        evidenceArtifact: createMockEvidence(),
        semanticArtifact: createMockSemantic(),
        semanticConfirmationArtifact: createMockConfirmation('INVALIDATED')
      });

      expect(artifact.blockingConditions.some(b => b.code === 'CONFIRMATION_INVALIDATED')).toBe(true);
      expect(artifact.trustAssessment.overallState).toBe('BLOCKED');
    });

    it('deve garantir prevalência estrita do bloqueio crítico sobre o score numérico clampado [0, 1]', () => {
      const dataSource = createMockDataSource('WAITING_CONFIRMATION');
      const artifact = engine.evaluate({
        dataSource,
        discoveryArtifact: createMockDiscovery(),
        qualityArtifact: createMockQuality(),
        evidenceArtifact: createMockEvidence(),
        semanticArtifact: createMockSemantic(),
        semanticConfirmationArtifact: createMockConfirmation()
      });

      expect(artifact.trustAssessment.overallState).toBe('BLOCKED');
      expect(artifact.trustAssessment.overallScore).toBeLessThanOrEqual(0.3);
      expect(artifact.trustAssessment.overallScore).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(artifact.trustAssessment.overallScore)).toBe(false);
    });
  });

  describe('2. Validação de Compatibilidade e Invalidação de Artefatos', () => {
    it('deve rejeitar avaliação com erro tipado se os artefatos pertencerem a dataSources diferentes', () => {
      const dataSource = createMockDataSource('READY');
      const badDiscovery: DiscoveryArtifact = {
        ...createMockDiscovery(),
        dataSourceId: 'ds_outro_diferente'
      };

      expect(() => {
        engine.evaluate({
          dataSource,
          discoveryArtifact: badDiscovery
        });
      }).toThrow(IncompatibleTrustArtifactsError);
    });

    it('deve invalidar a avaliação de confiança para schemas antigos via serviço e repositório', async () => {
      const dataSource = createMockDataSource('READY');
      const artifact = await service.evaluateAndPersist({
        dataSource,
        discoveryArtifact: createMockDiscovery(),
        qualityArtifact: createMockQuality(),
        evidenceArtifact: createMockEvidence(),
        semanticArtifact: createMockSemantic(),
        semanticConfirmationArtifact: createMockConfirmation()
      }, mockUser);

      await service.invalidateForNewSchema(dataSource.id, 2);

      const latest = await repository.findLatestByDataSource(dataSource.id);
      expect(latest?.trustAssessment.overallState).toBe('INVALIDATED');
    });
  });

  describe('3. Teste de Fronteira Permanente (Guarda Estrita de Pureza)', () => {
    it('NUNCA deve alterar o estado canônico do DataSource, calcular KPIs ou alterar decisões semânticas', () => {
      const dataSource = createMockDataSource('READY');
      const initialState = dataSource.derivedCanonicalState;
      const initialSchemaVersion = dataSource.currentSchemaVersion?.versionNumber;

      const artifact = engine.evaluate({
        dataSource,
        discoveryArtifact: createMockDiscovery(),
        qualityArtifact: createMockQuality(),
        evidenceArtifact: createMockEvidence(),
        semanticArtifact: createMockSemantic(),
        semanticConfirmationArtifact: createMockConfirmation()
      });

      // Confirma que o DataSource permaneceu 100% intocado
      expect(dataSource.derivedCanonicalState).toBe(initialState);
      expect(dataSource.currentSchemaVersion?.versionNumber).toBe(initialSchemaVersion);

      // Confirma ausência de KPIs de negócio nos findings
      const hasBusinessKpi = artifact.trustFindings.some(f =>
        f.message.toLowerCase().includes('receita') ||
        f.message.toLowerCase().includes('lucratividade') ||
        f.message.toLowerCase().includes('vendas')
      );
      expect(hasBusinessKpi).toBe(false);
    });
  });
});
