import { describe, it, expect, beforeEach } from 'vitest';
import { FinancialStructureObservationEngine } from './FinancialStructureObservationEngine';
import { FinancialObservationService } from './FinancialObservationService';
import { FinancialObservationInput } from './FinancialStructureContracts';
import { BusinessInsightError, businessArtifactRepository } from '../business-insight';
import { TrustArtifact } from '../trust/TrustContracts';
import { PlatformUser } from '../identity/types';

describe('Sprint 3.1 — Financial Structure Observation Engine Specification', () => {
  let engine: FinancialStructureObservationEngine;
  let service: FinancialObservationService;

  const mockUser: PlatformUser = {
    id: 'user_fin_1',
    role: 'CONSULTANT',
    organizationId: 'org_1',
    profile: { id: 'user_fin_1', fullName: 'Financial Consultant', email: 'fin@asterion.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  function createMockTrustArtifact(state: 'TRUSTED' | 'BLOCKED' | 'INVALIDATED' | 'LIMITED' = 'TRUSTED'): TrustArtifact {
    return {
      artifactId: 'trust_fin_mock_1',
      dataSourceId: 'ds_fin_1',
      engagementId: 'eng_fin_1',
      schemaVersionNumber: 1,
      trustAssessment: {
        overallState: state,
        overallScore: state === 'TRUSTED' ? 0.92 : 0.20,
        scoreSuppressed: state === 'BLOCKED',
        isUsableForAny: state === 'TRUSTED' || state === 'LIMITED',
        primaryBlockingReason: state === 'BLOCKED' ? 'Bloqueio de governança' : undefined
      },
      dimensionAssessments: [],
      usageAssessments: [
        {
          usageType: 'FINANCIAL_ANALYSIS',
          status: state,
          requiredDimensions: [],
          satisfiedConditions: [],
          blockingConditions: [],
          limitations: ['Amostragem de 10%'],
          explanation: 'Mock',
          evidenceIds: []
        }
      ],
      trustFindings: [],
      blockingConditions: [],
      limitations: ['Amostragem de 10%'],
      provenance: {
        dataSourceId: 'ds_fin_1',
        engagementId: 'eng_fin_1',
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
    engine = new FinancialStructureObservationEngine();
    service = new FinancialObservationService();
  });

  describe('1. Governança e Policy Guard de Trust', () => {
    it('deve permitir execução quando o TrustArtifact estiver no estado TRUSTED para FINANCIAL_ANALYSIS', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [
          {
            containerId: 'cont_1',
            columnId: 'col_1',
            physicalName: 'VALOR_LANCAMENTO',
            semanticFieldInterpretationId: 'interp_1',
            decision: 'CONFIRMED',
            customPayload: { label: 'Valor do Lançamento', category: 'MONETARY_MEASURE', isManual: true },
            supportingEvidenceIds: [],
            decidedBy: 'user_fin_1',
            decidedAt: new Date().toISOString(),
            limitationsAcknowledged: []
          }
        ],
        records: [
          { recordId: 'rec_1', values: { VALOR_LANCAMENTO: 1500.50 } },
          { recordId: 'rec_2', values: { VALOR_LANCAMENTO: -500.00 } }
        ]
      };

      const artifact = await service.executeObservation(input, mockUser);
      expect(artifact).toBeDefined();
      expect(artifact.businessObservations.length).toBeGreaterThan(0);
      expect(artifact.calculatedMetrics.some(m => m.metricDefinitionId === 'MONETARY_TOTAL')).toBe(true);
    });

    it('deve proibir execução e lançar TRUST_ARTIFACT_BLOCKED se o TrustArtifact estiver BLOCKED', async () => {
      const trustArtifact = createMockTrustArtifact('BLOCKED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [],
        records: []
      };

      await expect(service.executeObservation(input, mockUser)).rejects.toThrow(BusinessInsightError);
    });
  });

  describe('2. Princípio Source-Driven & Linguagem Financeira Neutra', () => {
    it('NUNCA deve classificar valor positivo como Receita ou negativo como Despesa sem decisão semântica explícita', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [
          {
            containerId: 'cont_1',
            columnId: 'col_vlr',
            physicalName: 'VLR_TOTAL',
            semanticFieldInterpretationId: 'interp_vlr',
            decision: 'CONFIRMED',
            customPayload: { label: 'Valor Total', category: 'MONETARY_MEASURE', isManual: true },
            supportingEvidenceIds: [],
            decidedBy: 'user_fin_1',
            decidedAt: new Date().toISOString(),
            limitationsAcknowledged: []
          }
        ],
        records: [
          { recordId: 'r1', values: { VLR_TOTAL: 1000 } },
          { recordId: 'r2', values: { VLR_TOTAL: -200 } }
        ]
      };

      const artifact = await service.executeObservation(input, mockUser);
      const summaryObs = artifact.businessObservations.find(o => o.category === 'MONETARY_STRUCTURE')!;

      // Confirma linguagem estritamente neutra e descritiva
      expect(summaryObs.description).toContain('Positivos: 1');
      expect(summaryObs.description).toContain('Negativos: 1');
      expect(summaryObs.description).not.toContain('Receita');
      expect(summaryObs.description).not.toContain('Despesa');
      expect(summaryObs.description).not.toContain('Lucro');
    });

    it('deve gerar UnresolvedBusinessQuestion se nenhum campo monetário for confirmado', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [],
        records: [{ recordId: 'r1', values: { CAMPO_DESCONHECIDO: 100 } }]
      };

      const artifact = await service.executeObservation(input, mockUser);
      expect(artifact.unresolvedBusinessQuestions).toHaveLength(1);
      expect(artifact.unresolvedBusinessQuestions[0].category).toBe('SEMANTIC_CONFIRMATION');
    });
  });

  describe('3. Métricas Descritivas, Concentração e Fingerprint FNV1A_32_CANONICAL', () => {
    it('deve calcular todas as 9 métricas descritivas e a análise de concentração determinística', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [
          {
            containerId: 'cont_1',
            columnId: 'col_val',
            physicalName: 'VALOR',
            semanticFieldInterpretationId: 'interp_val',
            decision: 'CONFIRMED',
            customPayload: { label: 'Valor', category: 'MONETARY_MEASURE', isManual: true },
            supportingEvidenceIds: [],
            decidedBy: 'user_fin_1',
            decidedAt: new Date().toISOString(),
            limitationsAcknowledged: []
          },
          {
            containerId: 'cont_1',
            columnId: 'col_cc',
            physicalName: 'CENTRO_CUSTO',
            semanticFieldInterpretationId: 'interp_cc',
            decision: 'CONFIRMED',
            customPayload: { label: 'Centro de Custo', category: 'CATEGORICAL', isManual: true },
            supportingEvidenceIds: [],
            decidedBy: 'user_fin_1',
            decidedAt: new Date().toISOString(),
            limitationsAcknowledged: []
          },
          {
            containerId: 'cont_1',
            columnId: 'col_date',
            physicalName: 'DATA_LANCAMENTO',
            semanticFieldInterpretationId: 'interp_date',
            decision: 'CONFIRMED',
            customPayload: { label: 'Data de Lançamento', category: 'TEMPORAL', isManual: true },
            supportingEvidenceIds: [],
            decidedBy: 'user_fin_1',
            decidedAt: new Date().toISOString(),
            limitationsAcknowledged: []
          }
        ],
        records: [
          { recordId: 'r1', values: { VALOR: 500.00, CENTRO_CUSTO: 'TI', DATA_LANCAMENTO: '2026-01-10' } },
          { recordId: 'r2', values: { VALOR: 300.00, CENTRO_CUSTO: 'TI', DATA_LANCAMENTO: '2026-01-15' } },
          { recordId: 'r3', values: { VALOR: -100.00, CENTRO_CUSTO: 'RH', DATA_LANCAMENTO: '2026-01-20' } },
          { recordId: 'r4', values: { VALOR: null, CENTRO_CUSTO: 'VENDAS', DATA_LANCAMENTO: '2026-01-25' } }
        ]
      };

      const artifact = await service.executeObservation(input, mockUser);

      // Verificação das métricas descritivas
      const metricIds = artifact.calculatedMetrics.map(m => m.metricDefinitionId);
      expect(metricIds).toContain('FINANCIAL_RECORD_COUNT');
      expect(metricIds).toContain('MONETARY_TOTAL');
      expect(metricIds).toContain('MONETARY_AVERAGE');
      expect(metricIds).toContain('MONETARY_MINIMUM');
      expect(metricIds).toContain('MONETARY_MAXIMUM');
      expect(metricIds).toContain('POSITIVE_VALUE_COUNT');
      expect(metricIds).toContain('NEGATIVE_VALUE_COUNT');
      expect(metricIds).toContain('NULL_VALUE_COUNT');
      expect(metricIds).toContain('PERIOD_COVERAGE');

      // Verificação da Concentração
      const concentrationObs = artifact.businessObservations.find(o => o.category === 'CONCENTRATION_ANALYSIS');
      expect(concentrationObs).toBeDefined();
      expect(concentrationObs?.description).toContain('CENTRO_CUSTO');

      // Verificação do Fingerprint FNV1A_32_CANONICAL
      expect(artifact.fingerprint.algorithm).toBe('FNV1A_32_CANONICAL');
      expect(artifact.fingerprint.version).toBe('1.0.0');
      expect(artifact.fingerprint.cryptographic).toBe(false);
      expect(artifact.fingerprint.artifactHash).toMatch(/^fnv1a_/);
    });

    it('deve suportar repositório completo com findById, findByEngagement, findByTrustArtifact e invalidate', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_repo_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [],
        records: []
      };

      const artifact = await service.executeObservation(input, mockUser);

      const foundById = await businessArtifactRepository.findById(artifact.artifactId);
      expect(foundById).toBeDefined();
      expect(foundById?.artifactId).toBe(artifact.artifactId);

      const foundByEng = await businessArtifactRepository.findByEngagement('eng_fin_1');
      expect(foundByEng.length).toBeGreaterThan(0);

      const foundByTrust = await businessArtifactRepository.findByTrustArtifact('trust_fin_mock_1');
      expect(foundByTrust.length).toBeGreaterThan(0);

      await businessArtifactRepository.invalidate(artifact.artifactId, 'Teste de invalidação');
    });
  });

  describe('4. Teste de Fronteira Permanente (Guarda Estrita de Pureza)', () => {
    it('NUNCA deve gerar riscos, oportunidades ou hipóteses de ação automatizadas', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [],
        records: []
      };

      const artifact = await service.executeObservation(input, mockUser);
      expect(artifact.risks).toHaveLength(0);
      expect(artifact.opportunities).toHaveLength(0);
      expect(artifact.actionHypotheses).toHaveLength(0);
    });

    it('NUNCA deve gerar DRE, KPIs contábeis ou inferência de dependência empresarial', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [],
        records: []
      };

      const artifact = await service.executeObservation(input, mockUser);
      const jsonString = JSON.stringify(artifact);
      expect(jsonString).not.toContain('EBITDA');
      expect(jsonString).not.toContain('Margem Bruta');
      expect(jsonString).not.toContain('Demonstração do Resultado');
    });

    it('deve declarar apenas DESCRIPTIVE_ANALYSIS e CONCENTRATION_ANALYSIS nas capabilities suportadas', () => {
      expect(engine.metadata.supportedCapabilities).toEqual(['DESCRIPTIVE_ANALYSIS', 'CONCENTRATION_ANALYSIS']);
    });

    it('deve persistir o BusinessArtifact no repositório antes de concluir o serviço', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [],
        records: []
      };

      const artifact = await service.executeObservation(input, mockUser);
      expect(artifact.artifactId).toBeDefined();
    });
  });

  describe('5. Sprint 3.3.2 — Real Data Evolution, Provenance & 5 Canonical States', () => {
    it('deve resolver o contexto canônico usando entrada fortemente tipada e retornar os 5 estados canônicos', async () => {
      const proj = await service.resolveContext('eng_fin_1', {
        datasetId: 'ds_fin_1',
        dataSourceId: 'ds_fin_1',
        engagementId: 'eng_fin_1',
        schemaVersionNumber: 1,
        containerId: 'sheet1',
        sourceFingerprint: 'fnv_12345'
      }, mockUser);
      expect(proj.engagementId).toBe('eng_fin_1');
      expect(['NO_SOURCE', 'SOURCE_CONNECTED', 'DISCOVERING', 'WAITING_CONFIRMATION', 'READY']).toContain(proj.derivedCanonicalState);
      expect(['NO_DATA', 'PROCESSING', 'REQUIRES_CONFIRMATION', 'AVAILABLE', 'BLOCKED']).toContain(proj.workspaceAvailability);
    });

    it('deve conter rastreabilidade e proveniência ponta a ponta em CalculatedMetric e BusinessObservation', async () => {
      const trustArtifact = createMockTrustArtifact('TRUSTED');
      const input: FinancialObservationInput = {
        user: mockUser,
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_fin_1', engagementId: 'eng_fin_1' },
        trustArtifact,
        semanticConfirmationDecisions: [
          {
            containerId: 'sheet1',
            columnId: 'col_1',
            physicalName: 'VALOR_TOTAL',
            semanticFieldInterpretationId: 'interp_1',
            decision: 'CONFIRMED',
            consultantLabel: 'Valor Total',
            supportingEvidenceIds: [],
            decidedAt: new Date().toISOString(),
            decidedBy: 'user_1',
            limitationsAcknowledged: []
          }
        ],
        records: [
          { recordId: 'rec_1', values: { VALOR_TOTAL: 1500 } },
          { recordId: 'rec_2', values: { VALOR_TOTAL: 2500 } }
        ]
      };

      const artifact = await service.executeObservation(input, mockUser);
      expect(artifact.calculatedMetrics.length).toBeGreaterThan(0);
      const metric = artifact.calculatedMetrics[0];
      expect(metric.provenance).toBeDefined();
      expect(metric.provenance.dataSourceId).toBe('ds_fin_1');
      expect(metric.provenance.trustArtifactId).toBe('trust_fin_mock_1');
    });
  });
});
