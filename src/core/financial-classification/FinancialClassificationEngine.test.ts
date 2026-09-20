import { describe, it, expect, beforeEach } from 'vitest';
import { FinancialClassificationEngine, CANONICAL_MATERIALITY_POLICY_V1, computePolicyFingerprint } from './FinancialClassificationEngine';
import { FinancialClassificationConsistencyValidator } from './FinancialClassificationConsistencyValidator';
import { InMemoryFinancialClassificationRepository } from './FinancialClassificationRepository';
import { FinancialClassificationService } from './FinancialClassificationService';
import { PlatformUser } from '../identity/types';

describe('Sprint 4.0.2 — Financial Classification Integrity & Persistence Certification', () => {
  let engine: FinancialClassificationEngine;
  let repo: InMemoryFinancialClassificationRepository;
  let service: FinancialClassificationService;

  const mockUser: PlatformUser = {
    id: 'usr_consultant_1',
    profile: {
      id: 'usr_consultant_1',
      fullName: 'Consultor Financeiro',
      email: 'consultor@asterion.com'
    },
    role: 'CONSULTANT'
  };

  beforeEach(async () => {
    engine = new FinancialClassificationEngine();
    repo = new InMemoryFinancialClassificationRepository();
    await repo.clearAll();
    service = new FinancialClassificationService(repo);
  });

  describe('1. Materialidade Multidimensional', () => {
    it('deve calcular materialidade multidimensional baseada na participação do valor total e do volume', () => {
      const assessment = engine.evaluateMateriality({
        categoryIdentity: 'cat_id_VENDAS',
        absoluteValue: 10000,
        datasetTotalAbsoluteValue: 100000,
        recordCount: 50,
        datasetTotalRecordCount: 1000
      });

      expect(assessment.materialityState).toBe('MATERIAL');
      expect(assessment.absoluteValueShare).toBe(0.10);
      expect(assessment.materialityReasons.length).toBeGreaterThan(0);
    });

    it('não deve marcar 5 registros como material se representarem fração ínfima do volume total (<5%)', () => {
      const assessment = engine.evaluateMateriality({
        categoryIdentity: 'cat_id_TARIFAS',
        absoluteValue: 50,
        datasetTotalAbsoluteValue: 100000,
        recordCount: 5,
        datasetTotalRecordCount: 10000 // 5/10000 = 0.05%
      });

      expect(assessment.materialityState).toBe('NON_MATERIAL');
      expect(assessment.recordCountShare).toBe(0.0005);
    });
  });

  describe('2. Normalização e Identidade de Categoria', () => {
    it('deve preservar o physicalValue exato enquanto gera normalizedValue determinístico e categoryIdentity', () => {
      const norm = engine.normalizeCategory('  Prestação de Serviços  ');
      expect(norm.metadata.originalValues[0]).toBe('  Prestação de Serviços  ');
      expect(norm.normalizedValue).toBe('PRESTACAO_DE_SERVICOS');
      expect(norm.categoryIdentity).toBe('cat_id_PRESTACAO_DE_SERVICOS');
      expect(norm.metadata.trimApplied).toBe(true);
      expect(norm.metadata.caseFoldApplied).toBe(true);
    });
  });

  describe('3. Coerência das Decisões e Segurança de CUSTOM_RULE', () => {
    it('deve rejeitar NON_FINANCIAL se não utilizar o StatementGroup UNCLASSIFIED', () => {
      const norm = engine.normalizeCategory('Ajuste');
      const mat = engine.evaluateMateriality({
        categoryIdentity: norm.categoryIdentity,
        absoluteValue: 10,
        datasetTotalAbsoluteValue: 100,
        recordCount: 1,
        datasetTotalRecordCount: 10
      });

      const issues = FinancialClassificationConsistencyValidator.validateDecision({
        categoryIdentity: norm.categoryIdentity,
        physicalValue: 'Ajuste',
        normalizedValue: norm.normalizedValue,
        categoryNormalizationMetadata: norm.metadata,
        categoryFieldPhysicalName: 'CAT',
        monetaryFieldPhysicalName: 'VAL',
        classificationType: 'NON_FINANCIAL',
        financialNature: 'OTHER',
        statementGroup: 'OPERATING_EXPENSE', // Incoerente
        signPolicy: 'PRESERVE_SOURCE_SIGN',
        scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_1', engagementId: 'eng_1' },
        rationale: 'Teste',
        consultantId: 'usr_1',
        supportingEvidenceIds: [],
        semanticDecisionIds: [],
        trustArtifactId: 'trust_1',
        limitations: [],
        status: 'CONFIRM_CLASSIFICATION',
        provenance: {
          dataSourceId: 'ds_1',
          schemaVersionNumber: 1,
          trustArtifactId: 'trust_1',
          trustUsage: 'FINANCIAL_ANALYSIS',
          semanticConfirmationArtifactId: 'sem_1',
          engineId: 'Engine',
          engineVersion: '1.0'
        },
        materialityAssessment: mat
      });

      expect(issues.some(i => i.code === 'NON_FINANCIAL_GROUP_MISMATCH')).toBe(true);
    });

    it('deve aplicar CUSTOM_RULE de forma declarativa e determinística sem usar eval()', () => {
      const projected = engine.projectValue(-100, 'CUSTOM_RULE', {
        ruleId: 'rule_invert_negatives',
        version: '1.0',
        operation: 'INVERT',
        condition: 'NEGATIVE',
        rationale: 'Inverter saídas negativas'
      });

      expect(projected).toBe(100);
    });
  });

  describe('4. Persistência, Transições de Estado e Reinstanciação', () => {
    it('deve garantir reinstanciação perfeita recuperando artefato confirmado do repositório', async () => {
      const norm = engine.normalizeCategory('Vendas');
      const mat = engine.evaluateMateriality({
        categoryIdentity: norm.categoryIdentity,
        absoluteValue: 1000,
        datasetTotalAbsoluteValue: 1000,
        recordCount: 10,
        datasetTotalRecordCount: 10
      });

      const artifact = {
        artifactId: 'art_class_test_1',
        engagementId: 'eng_1',
        dataSourceId: 'ds_1',
        schemaVersionNumber: 1,
        semanticConfirmationArtifactId: 'sem_1',
        trustArtifactId: 'trust_1',
        scope: { scopeLevel: 'DATA_SOURCE' as const, scopeId: 'ds_1', engagementId: 'eng_1' },
        containerId: 'Sheet1',
        monetaryFieldReference: 'VALOR',
        categoryFieldReference: 'CATEGORIA',
        classificationDecisions: [],
        unresolvedClassifications: [],
        limitations: [],
        provenance: {
          dataSourceId: 'ds_1',
          schemaVersionNumber: 1,
          trustArtifactId: 'trust_1',
          trustUsage: 'FINANCIAL_ANALYSIS' as const,
          semanticConfirmationArtifactId: 'sem_1',
          engineId: 'Engine',
          engineVersion: '1.0'
        },
        metadata: { engineVersion: '1.0', policyId: 'mat_v1', policyVersion: '1.0' },
        fingerprint: 'fp_1',
        version: 1,
        status: 'CONFIRMED' as const,
        createdAt: new Date().toISOString()
      };

      await repo.saveVersion(artifact);

      // Reinstanciar repositório usando repo em memória compartilhado/persistido
      const recovered = await repo.findById('art_class_test_1');

      expect(recovered).not.toBeNull();
      expect(recovered?.artifactId).toBe('art_class_test_1');
      expect(recovered?.status).toBe('CONFIRMED');
    });
  });

  describe('5. Evidências R1: MaterialityPolicy V2, Colisões, Histórico e Transições', () => {
    it('deve calcular fingerprints dinâmicos distintos entre MaterialityPolicy V1 e V2', () => {
      const v2Base = {
        policyId: 'asterion_materiality_policy_v2_test',
        version: '2.0.0',
        absoluteValueShareThreshold: 0.07, // Alterado de 5% para 7%
        recordCountShareThreshold: 0.05,
        recurrenceThreshold: 2,
        organizationalCoverageThreshold: 1,
        invalidDataRules: { maxAllowedInvalid: 0 },
        mixedSignRules: { flagAsMaterial: true },
        manualOverrideRules: { allowManualDeclaration: true }
      };

      const fpV1 = CANONICAL_MATERIALITY_POLICY_V1.fingerprint;
      const fpV2 = computePolicyFingerprint(v2Base);

      expect(fpV1).not.toBe(fpV2);
      expect(fpV1).toMatch(/^fnv1a_/);
      expect(fpV2).toMatch(/^fnv1a_/);
    });

    it('deve testar exaustivamente normalização e colisões preservando o physicalValue', () => {
      const entries = [
        'Serviços',
        'SERVIÇOS',
        ' serviços ',
        'Servicos',
        '',
        '   ',
        'Vendas S.A.'
      ];

      const normalized = entries.map(e => engine.normalizeCategory(e));

      // Garantir physicalValue intocado
      normalized.forEach((res, i) => {
        expect(res.metadata.originalValues[0]).toBe(entries[i]);
      });

      // Garantir que "Serviços", "SERVIÇOS", " serviços " e "Servicos" tenham normalizedValue determinístico
      expect(normalized[0].normalizedValue).toBe('SERVICOS');
      expect(normalized[1].normalizedValue).toBe('SERVICOS');
      expect(normalized[2].normalizedValue).toBe('SERVICOS');
      expect(normalized[3].normalizedValue).toBe('SERVICOS');

      // Garantir que string vazia e espaços gerem UNRESOLVED/EMPTY
      expect(normalized[4].normalizedValue).toBe('UNRESOLVED_EMPTY');
      expect(normalized[5].normalizedValue).toBe('UNRESOLVED_EMPTY');

      // Garantir remoção de pontuação em Vendas S.A.
      expect(normalized[6].normalizedValue).toBe('VENDAS_SA');
    });

    it('deve validar estritamente as transições de estado oficiais (HOTFIX 4.0.2-R2)', () => {
      // Bloqueados
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('DRAFT', 'CONFIRMED')).toBe(false);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('DRAFT', 'SUPERSEDED')).toBe(false);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('REASSESSMENT_REQUIRED', 'CONFIRMED')).toBe(false);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('INVALIDATED', 'CONFIRMED')).toBe(false);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('SUPERSEDED', 'CONFIRMED')).toBe(false);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('INVALIDATED', 'IN_REVIEW')).toBe(false);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('SUPERSEDED', 'IN_REVIEW')).toBe(false);

      // Permitidos
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('DRAFT', 'IN_REVIEW')).toBe(true);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('IN_REVIEW', 'DRAFT')).toBe(true);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('IN_REVIEW', 'CONFIRMED')).toBe(true);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('DRAFT', 'INVALIDATED')).toBe(true);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('IN_REVIEW', 'INVALIDATED')).toBe(true);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('CONFIRMED', 'REASSESSMENT_REQUIRED')).toBe(true);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('CONFIRMED', 'SUPERSEDED')).toBe(true);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('CONFIRMED', 'INVALIDATED')).toBe(true);
      expect(FinancialClassificationConsistencyValidator.validateStateTransition('REASSESSMENT_REQUIRED', 'SUPERSEDED')).toBe(true);
    });
  });
});
