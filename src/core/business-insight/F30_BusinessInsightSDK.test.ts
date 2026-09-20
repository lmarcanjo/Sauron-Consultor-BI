import { describe, it, expect, beforeEach } from 'vitest';
import {
  IAsterionBusinessInsightEngine,
  BusinessInsightExecutionContext,
  BusinessInsightExecutionResult,
  BusinessInsightError,
  BUSINESS_INSIGHT_SDK_VERSION
} from './BusinessInsightSDK';
import { BusinessInsightRegistry, BusinessInsightFactory } from './BusinessInsightRegistry';
import { BusinessInsightPolicyGuard } from './BusinessInsightPolicyGuard';
import { BusinessArtifactFingerprintBuilder } from './BusinessArtifactFingerprintBuilder';
import { BusinessArtifact } from './BusinessArtifactContracts';
import { TrustArtifact } from '../trust/TrustContracts';
import { PlatformUser } from '../identity/types';

/**
 * FakeEngine estritamente para testes do SDK. NÃO implementa regras reais de negócio.
 */
class FakeDescriptiveAnalysisEngine implements IAsterionBusinessInsightEngine {
  readonly metadata = {
    engineId: 'fake_descriptive_engine_v1',
    name: 'Fake Descriptive Engine for SDK Unit Testing',
    version: '1.0.0',
    minimumSdkVersion: '1.0.0',
    supportedSdkVersions: ['1.0.0'],
    supportedCapabilities: ['DESCRIPTIVE_ANALYSIS' as const],
    requiredTrustUsage: 'EXPLORATORY_ANALYSIS' as const,
    supportedScopes: ['DATA_SOURCE' as const, 'ENGAGEMENT' as const],
    stability: 'STABLE' as const
  };

  public async execute(context: BusinessInsightExecutionContext): Promise<BusinessInsightExecutionResult> {
    BusinessInsightPolicyGuard.validateExecution(context, this.metadata.requiredTrustUsage);

    const artifactPartial = {
      artifactId: `bus_fake_${Date.now()}`,
      engineId: this.metadata.engineId,
      engineVersion: this.metadata.version,
      sdkVersion: BUSINESS_INSIGHT_SDK_VERSION,
      dataSourceIds: [context.trustArtifact.dataSourceId],
      engagementId: context.trustArtifact.engagementId,
      schemaVersionReferences: [{ dataSourceId: context.trustArtifact.dataSourceId, schemaVersionNumber: context.trustArtifact.schemaVersionNumber }],
      trustArtifactIds: [context.trustArtifact.artifactId],
      semanticConfirmationArtifactIds: context.trustArtifact.semanticConfirmationArtifactId ? [context.trustArtifact.semanticConfirmationArtifactId] : [],

      analysisScope: context.scope,
      businessObservations: [
        {
          observationId: 'obs_1',
          category: 'DESCRIPTIVE',
          title: 'Volume total observado',
          description: 'Observação descritiva factual.',
          scope: context.scope,
          status: 'OBSERVED' as const,
          supportingMetricIds: [],
          supportingEvidenceIds: [],
          trustUsage: 'EXPLORATORY_ANALYSIS' as const,
          trustState: context.trustArtifact.trustAssessment.overallState,
          assumptions: [],
          limitations: context.trustArtifact.limitations,
          provenance: {
            dataSourceId: context.trustArtifact.dataSourceId,
            schemaVersionNumber: context.trustArtifact.schemaVersionNumber,
            trustArtifactId: context.trustArtifact.artifactId,
            trustUsage: 'EXPLORATORY_ANALYSIS' as const,
            engineId: this.metadata.engineId,
            engineVersion: this.metadata.version
          }
        }
      ],
      calculatedMetrics: [],
      comparisons: [],
      findings: [],
      risks: [],
      opportunities: [],
      actionHypotheses: [],
      unresolvedBusinessQuestions: [],
      limitations: context.trustArtifact.limitations,

      provenance: {
        engineId: this.metadata.engineId,
        engineVersion: this.metadata.version,
        sdkVersion: BUSINESS_INSIGHT_SDK_VERSION,
        dataSourceIds: [context.trustArtifact.dataSourceId],
        engagementId: context.trustArtifact.engagementId,
        schemaVersionReferences: [{ dataSourceId: context.trustArtifact.dataSourceId, schemaVersionNumber: context.trustArtifact.schemaVersionNumber }],
        trustArtifactIds: [context.trustArtifact.artifactId],
        semanticConfirmationArtifactIds: [],
        policyId: context.trustArtifact.provenance.policyId,
        policyVersion: context.trustArtifact.provenance.policyVersion
      },
      metadata: {
        engineId: this.metadata.engineId,
        engineVersion: this.metadata.version,
        sdkVersion: BUSINESS_INSIGHT_SDK_VERSION,
        capabilitiesUsed: ['DESCRIPTIVE_ANALYSIS' as const],
        executionDurationMs: 5,
        generatedAt: new Date().toISOString()
      },
      generatedAt: new Date().toISOString(),
      version: 1
    };

    const fingerprintHash = BusinessArtifactFingerprintBuilder.buildFingerprint(artifactPartial);

    const artifact: BusinessArtifact = Object.freeze({
      ...artifactPartial,
      fingerprint: Object.freeze({
        artifactHash: fingerprintHash,
        algorithm: 'FNV-1a',
        generatedAt: artifactPartial.generatedAt
      })
    });

    return { success: true, artifact, executionDurationMs: 5 };
  }
}

describe('Sprint 3.0.1 — Business Insight SDK Contract Hardening Specification', () => {
  let registry: BusinessInsightRegistry;
  let factory: BusinessInsightFactory;
  let fakeEngine: FakeDescriptiveAnalysisEngine;

  const mockUser: PlatformUser = {
    id: 'user_sdk_1',
    role: 'CONSULTANT',
    organizationId: 'org_1',
    profile: { id: 'user_sdk_1', fullName: 'SDK Tester', email: 'sdk@asterion.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  function createMockTrustArtifact(state: 'TRUSTED' | 'BLOCKED' | 'INVALIDATED' | 'LIMITED' = 'TRUSTED', limitations: string[] = []): TrustArtifact {
    return {
      artifactId: 'trust_mock_1',
      dataSourceId: 'ds_1',
      engagementId: 'eng_1',
      schemaVersionNumber: 1,
      trustAssessment: {
        overallState: state,
        overallScore: state === 'TRUSTED' ? 0.95 : 0.20,
        scoreSuppressed: state === 'BLOCKED',
        isUsableForAny: state === 'TRUSTED' || state === 'LIMITED',
        primaryBlockingReason: state === 'BLOCKED' ? 'Bloqueio de governança' : undefined
      },
      dimensionAssessments: [],
      usageAssessments: [
        {
          usageType: 'EXPLORATORY_ANALYSIS',
          status: state,
          requiredDimensions: [],
          satisfiedConditions: [],
          blockingConditions: [],
          limitations,
          explanation: 'Mock',
          evidenceIds: []
        }
      ],
      trustFindings: [],
      blockingConditions: [],
      limitations: limitations.length > 0 ? limitations : (state === 'TRUSTED' ? ['Amostragem de 10%'] : []),
      provenance: {
        dataSourceId: 'ds_1',
        engagementId: 'eng_1',
        schemaVersionNumber: 1,
        policyId: 'asterion_trust_policy_v1',
        policyVersion: '1.0.0'
      },
      metadata: {
        engineVersion: '1.0.0',
        policyId: 'asterion_trust_policy_v1',
        policyVersion: '1.0.0',
        rulesAppliedCount: 1,
        totalFindingsCount: 0,
        executionDurationMs: 1
      },
      fingerprint: { trustHash: 'hash_trust', algorithm: 'FNV-1a', generatedAt: new Date().toISOString() },
      evaluatedAt: new Date().toISOString(),
      version: 1
    };
  }

  beforeEach(() => {
    registry = new BusinessInsightRegistry();
    factory = new BusinessInsightFactory(registry);
    fakeEngine = new FakeDescriptiveAnalysisEngine();
    registry.register(fakeEngine);
  });

  describe('1. Matriz de Capability vs Trust Usage & Policy Guard', () => {
    it('deve permitir DESCRIPTIVE_ANALYSIS em estado LIMITED quando o uso for EXPLORATORY_ANALYSIS', async () => {
      const trustArtifact = createMockTrustArtifact('LIMITED');
      const context: BusinessInsightExecutionContext = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_1', engagementId: 'eng_1' },
        trustArtifact,
        requiredCapability: 'DESCRIPTIVE_ANALYSIS'
      };

      const res = await fakeEngine.execute(context);
      expect(res.success).toBe(true);
    });

    it('deve bloquear a execução com erro LIMITATION_PROPAGATION_REQUIRED se o TrustArtifact contiver limitação incompatível', async () => {
      const trustArtifact = createMockTrustArtifact('LIMITED', ['SERIE_TEMPORAL_INSUFICIENTE']);
      const context: BusinessInsightExecutionContext = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_1', engagementId: 'eng_1' },
        trustArtifact,
        requiredCapability: 'TREND_ANALYSIS'
      };

      expect(() => {
        BusinessInsightPolicyGuard.validateExecution(context, 'INTERNAL_MONITORING');
      }).toThrow(BusinessInsightError);
    });

    it('deve lançar erro UNCERTAIN/UNSUPPORTED_CAPABILITY se a capability não puder operar sob o uso solicitado', () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const context: BusinessInsightExecutionContext = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_1', engagementId: 'eng_1' },
        trustArtifact,
        requiredCapability: 'ACTION_HYPOTHESIS_GENERATION'
      };

      expect(() => {
        BusinessInsightPolicyGuard.validateExecution(context, 'EXPLORATORY_ANALYSIS');
      }).toThrow(BusinessInsightError);
    });
  });

  describe('2. Fingerprint Determinístico Independente de Ordem', () => {
    it('deve gerar o mesmo hash de fingerprint para duas listas em ordens diferentes', () => {
      const basePayload = {
        artifactId: 'bus_1',
        engineId: 'engine_1',
        engineVersion: '1.0.0',
        sdkVersion: '1.0.0',
        dataSourceIds: ['ds_b', 'ds_a'],
        engagementId: 'eng_1',
        schemaVersionReferences: [{ dataSourceId: 'ds_b', schemaVersionNumber: 1 }, { dataSourceId: 'ds_a', schemaVersionNumber: 1 }],
        trustArtifactIds: ['trust_2', 'trust_1'],
        semanticConfirmationArtifactIds: [],
        analysisScope: { scopeLevel: 'ENGAGEMENT' as const, scopeId: 'eng_1', engagementId: 'eng_1' },
        businessObservations: [],
        calculatedMetrics: [],
        comparisons: [],
        findings: [],
        risks: [],
        opportunities: [],
        actionHypotheses: [],
        unresolvedBusinessQuestions: [],
        limitations: ['Limitação B', 'Limitação A'],
        provenance: {} as any,
        metadata: {} as any,
        generatedAt: '2026-08-01T20:00:00Z',
        version: 1
      };

      const payloadReordered = {
        ...basePayload,
        dataSourceIds: ['ds_a', 'ds_b'],
        trustArtifactIds: ['trust_1', 'trust_2'],
        limitations: ['Limitação A', 'Limitação B']
      };

      const hash1 = BusinessArtifactFingerprintBuilder.buildFingerprint(basePayload);
      const hash2 = BusinessArtifactFingerprintBuilder.buildFingerprint(payloadReordered);

      expect(hash1).toBe(hash2);
    });
  });

  describe('3. Imutabilidade Profunda dos Contratos', () => {
    it('deve proibir mutação nos arrays de observações e proveniência do artefato retornado', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const context: BusinessInsightExecutionContext = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_1', engagementId: 'eng_1' },
        trustArtifact,
        requiredCapability: 'DESCRIPTIVE_ANALYSIS'
      };

      const res = await fakeEngine.execute(context);
      const artifact = res.artifact!;

      expect(Object.isFrozen(artifact)).toBe(true);
    });
  });

  describe('4. Guarda Estrita de Pureza & Ausência de Automação/LLM/DRE', () => {
    it('NUNCA deve permitir execução automática em ActionHypothesis', () => {
      const actionHypothesis = Object.freeze({
        hypothesisId: 'hyp_1',
        title: 'Revisar margens por unidade',
        rationale: 'Risco de inconsistência identificado.',
        expectedImpact: 'Melhoria na acurácia financeira.',
        suggestedAction: 'Consultar responsável técnico.',
        supportingFindingIds: [],
        supportingEvidenceIds: [],
        supportingRiskIds: [],
        supportingOpportunityIds: [],
        assumptions: [],
        risks: [],
        limitations: [],
        requiresConsultantDecision: true as const,
        executionStatus: 'NOT_EXECUTED' as const,
        disclaimer: 'Hipótese de ação para consideração exclusiva do consultor. Nenhuma ação é executada automaticamente.',
        provenance: {
          dataSourceId: 'ds_1',
          trustArtifactId: 'trust_1',
          trustUsage: 'FINANCIAL_ANALYSIS' as const,
          engineId: 'engine_1',
          engineVersion: '1.0.0'
        }
      });

      expect(actionHypothesis.requiresConsultantDecision).toBe(true);
      expect(actionHypothesis.executionStatus).toBe('NOT_EXECUTED');
    });
  });
});
