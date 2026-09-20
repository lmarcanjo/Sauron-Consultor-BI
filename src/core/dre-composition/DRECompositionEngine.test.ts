import { describe, it, expect, beforeEach } from 'vitest';
import { DRECompositionEngine } from './DRECompositionEngine';
import { InMemoryDREArtifactRepository } from './DREArtifactRepository';
import { DRECompositionService } from './DRECompositionService';
import { DRECompositionRegistry, DRECompositionFactory, DRE_COMPOSITION_SDK_VERSION } from './DRECompositionRegistry';
import { DREProvenanceValidator } from './DREProvenanceValidator';
import { ContributionIdentityBuilder } from './ContributionIdentityBuilder';
import { CANONICAL_DRE_COMPOSITION_POLICY_V1, CANONICAL_DRE_COMPOSITION_POLICY_V2, CANONICAL_DRE_COMPOSITION_POLICY_V3, computeDREPolicyFingerprint } from './DRECompositionPolicy';
import { DRESubtotalProvenanceValidator } from './DRESubtotalProvenanceValidator';
import { PlatformUser } from '../identity/types';

describe('HOTFIX 4.1.3-R1 — Contribution Identity Runtime & Period Status Certification', () => {
  let engine: DRECompositionEngine;
  let repo: InMemoryDREArtifactRepository;
  let service: DRECompositionService;

  const mockUser: PlatformUser = {
    id: 'usr_consultant_1',
    profile: { id: 'usr_consultant_1', fullName: 'Consultor Financeiro', email: 'consultor@asterion.com' },
    role: 'CONSULTANT'
  };

  const validContext = {
    engagementId: 'eng_1',
    dataSourceId: 'ds_1',
    schemaVersionNumber: 1,
    currencyContext: {
      currencyCode: 'BRL',
      currencySource: 'CONSULTANT_DECLARATION' as const,
      configuredBy: 'usr_consultant_1',
      limitations: []
    },
    financialClassificationArtifact: {
      artifactId: 'art_class_1',
      status: 'CONFIRMED',
      scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_1', engagementId: 'eng_1' },
      unresolvedClassifications: [],
      limitations: [],
      classificationDecisions: [
        {
          decisionId: 'dec_1',
          sourceRecordIdentity: 'row_001',
          containerId: 'cont_1',
          monetaryFieldPhysicalName: 'VALOR',
          categoryFieldPhysicalName: 'CATEGORIA',
          periodId: 'per_total_aggregated',
          physicalValue: 'Vendas de Mercadorias',
          normalizedValue: 'VENDAS_DE_MERCADORIAS',
          categoryIdentity: 'cat_id_VENDAS_DE_MERCADORIAS',
          statementGroup: 'GROSS_INFLOW',
          classificationType: 'INFLOW',
          financialNature: 'OPERATING',
          signPolicy: 'PRESERVE_SOURCE_SIGN',
          materialityAssessment: { absoluteValue: 100000, materialityState: 'MATERIAL' }
        },
        {
          decisionId: 'dec_2',
          sourceRecordIdentity: 'row_002',
          containerId: 'cont_1',
          monetaryFieldPhysicalName: 'VALOR',
          categoryFieldPhysicalName: 'CATEGORIA',
          periodId: 'per_total_aggregated',
          physicalValue: 'Devoluções de Vendas',
          normalizedValue: 'DEVOLUCOES_DE_VENDAS',
          categoryIdentity: 'cat_id_DEVOLUCOES_DE_VENDAS',
          statementGroup: 'DEDUCTION',
          classificationType: 'OUTFLOW',
          financialNature: 'OPERATING',
          signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
          materialityAssessment: { absoluteValue: 5000, materialityState: 'MATERIAL' }
        }
      ]
    },
    trustArtifact: {
      artifactId: 'trust_1',
      overallState: 'TRUSTED',
      usageAssessments: [{ usageType: 'FINANCIAL_ANALYSIS', status: 'ALLOWED' }]
    },
    semanticConfirmationArtifact: {
      artifactId: 'sem_1',
      overallStatus: 'CONFIRMED'
    }
  };

  beforeEach(async () => {
    engine = new DRECompositionEngine();
    repo = new InMemoryDREArtifactRepository();
    await repo.clearAll();
    service = new DRECompositionService(repo);
  });

  describe('1. ContributionIdentityBuilder Canônico', () => {
    it('deve gerar a serialização canônica determinística usando todos os 9 campos obrigatórios', () => {
      const built = ContributionIdentityBuilder.build({
        dataSourceId: 'ds_1',
        schemaVersionNumber: 1,
        containerId: 'cont_1',
        sourceRecordIdentity: 'row_001',
        monetaryFieldPhysicalName: 'VALOR',
        categoryFieldPhysicalName: 'CATEGORIA',
        classificationDecisionId: 'dec_1',
        periodId: 'per_total_aggregated',
        currencyCode: 'BRL'
      });

      expect(built.canonicalSerialization).toBe(
        'dataSourceId:ds_1::schemaVersionNumber:1::containerId:cont_1::sourceRecordIdentity:row_001::monetaryFieldPhysicalName:VALOR::categoryFieldPhysicalName:CATEGORIA::classificationDecisionId:dec_1::periodId:per_total_aggregated::currencyCode:BRL'
      );
      expect(built.canonicalKey).toMatch(/^fnv1a_contrib_/);
    });

    it('deve rejeitar registros duplicados com a mesma ContributionIdentity integral', () => {
      const duplicateCtx = {
        ...validContext,
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            validContext.financialClassificationArtifact.classificationDecisions[0],
            validContext.financialClassificationArtifact.classificationDecisions[0] // Mesma contribuição
          ]
        }
      };

      expect(() => engine.composeDRE(duplicateCtx as any)).toThrowError(/DUPLICATE_PHYSICAL_RECORD|DUPLICATE_CONTRIBUTION_IDENTITY/);
    });

    it('deve aceitar dois registros FISICAMENTE DIFERENTES da mesma categoria', () => {
      const multiRecordCtx = {
        ...validContext,
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            {
              ...validContext.financialClassificationArtifact.classificationDecisions[0],
              decisionId: 'dec_1_row1',
              sourceRecordIdentity: 'row_001',
              categoryIdentity: 'cat_id_VENDAS'
            },
            {
              ...validContext.financialClassificationArtifact.classificationDecisions[0],
              decisionId: 'dec_1_row2',
              sourceRecordIdentity: 'row_002', // Registro diferente
              categoryIdentity: 'cat_id_VENDAS_2'
            }
          ]
        }
      };

      const res = engine.composeDRE(multiRecordCtx as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.lines.length).toBe(2);
    });
  });

  describe('2. Periodização Determinística (MONTH, QUARTER, YEAR, CUSTOM_PERIOD)', () => {
    it('deve compor período mensal MONTH quando campo temporal está confirmado', () => {
      const monthCtx = {
        ...validContext,
        confirmedTemporalFieldName: 'DATA_LANCAMENTO',
        requestedPeriodType: 'MONTH' as const,
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            {
              ...validContext.financialClassificationArtifact.classificationDecisions[0],
              physicalDateValue: '2026-01-15'
            }
          ]
        }
      };

      const res = engine.composeDRE(monthCtx as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.periods.some(p => p.periodType === 'MONTH')).toBe(true);
      expect(res.artifact?.lines[0].periodValues['per_m_2026_01']).toBe(100000);
    });

    it('deve compor período trimestral QUARTER para Q1/2026', () => {
      const qtrCtx = {
        ...validContext,
        confirmedTemporalFieldName: 'DATA_LANCAMENTO',
        requestedPeriodType: 'QUARTER' as const,
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            {
              ...validContext.financialClassificationArtifact.classificationDecisions[0],
              physicalDateValue: '15/02/2026'
            }
          ]
        }
      };

      const res = engine.composeDRE(qtrCtx as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.periods[0].periodType).toBe('QUARTER');
      expect(res.artifact?.lines[0].periodValues['per_q_2026_q1']).toBe(100000);
    });

    it('deve compor período anual YEAR para 2026', () => {
      const yrCtx = {
        ...validContext,
        confirmedTemporalFieldName: 'DATA_LANCAMENTO',
        requestedPeriodType: 'YEAR' as const,
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            {
              ...validContext.financialClassificationArtifact.classificationDecisions[0],
              physicalDateValue: '2026-06-20'
            }
          ]
        }
      };

      const res = engine.composeDRE(yrCtx as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.periods[0].periodType).toBe('YEAR');
      expect(res.artifact?.lines[0].periodValues['per_y_2026']).toBe(100000);
    });

    it('deve compor CUSTOM_PERIOD configurado explicitamente', () => {
      const customCtx = {
        ...validContext,
        confirmedTemporalFieldName: 'DATA_LANCAMENTO',
        requestedPeriodType: 'CUSTOM_PERIOD' as const,
        customPeriod: {
          customPeriodId: 'per_custom_h1_2026',
          label: '1º Semestre 2026',
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          createdBy: 'usr_1',
          createdAt: '2026-08-03T10:00:00Z',
          rationale: 'Análise semestral'
        },
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            {
              ...validContext.financialClassificationArtifact.classificationDecisions[0],
              physicalDateValue: '2026-03-10'
            }
          ]
        }
      };

      const res = engine.composeDRE(customCtx as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.periods[0].periodType).toBe('CUSTOM_PERIOD');
      expect(res.artifact?.lines[0].periodValues['per_custom_h1_2026']).toBe(100000);
    });
  });

  describe('3. Política V2 — Cálculo Factual de Subtotais Financeiros Iniciais', () => {
    it('deve calcular exatamente os 6 subtotais governados da V2 com valores independentes esperados', () => {
      const v2Ctx = {
        ...validContext,
        policy: CANONICAL_DRE_COMPOSITION_POLICY_V2,
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            {
              decisionId: 'dec_gross_1',
              sourceRecordIdentity: 'row_101',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Vendas de Mercadorias',
              normalizedValue: 'VENDAS_DE_MERCADORIAS',
              categoryIdentity: 'cat_id_VENDAS_DE_MERCADORIAS',
              statementGroup: 'GROSS_INFLOW',
              classificationType: 'INFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'PRESERVE_SOURCE_SIGN',
              materialityAssessment: { absoluteValue: 150000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_ded_1',
              sourceRecordIdentity: 'row_102',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Impostos sobre Vendas',
              normalizedValue: 'IMPOSTOS_SOBRE_VENDAS',
              categoryIdentity: 'cat_id_IMPOSTOS_SOBRE_VENDAS',
              statementGroup: 'DEDUCTION',
              classificationType: 'OUTFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 15000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_cost_1',
              sourceRecordIdentity: 'row_103',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Custo das Mercadorias Vendidas',
              normalizedValue: 'CUSTO_DAS_MERCADORIAS_VENDIDAS',
              categoryIdentity: 'cat_id_CMV',
              statementGroup: 'DIRECT_COST',
              classificationType: 'OUTFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 60000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_exp_1',
              sourceRecordIdentity: 'row_104',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Despesas Administrativas',
              normalizedValue: 'DESPESAS_ADMINISTRATIVAS',
              categoryIdentity: 'cat_id_DESPESAS_ADM',
              statementGroup: 'OPERATING_EXPENSE',
              classificationType: 'OUTFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 20000, materialityState: 'MATERIAL' }
            }
          ]
        }
      };

      const res = engine.composeDRE(v2Ctx as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.subtotals.length).toBe(6);

      const findSub = (code: string) => res.artifact?.subtotals.find(s => s.subtotalCode === code);

      // Oracle Independente
      expect(findSub('TOTAL_GROSS_INFLOW')?.roundedValue).toBe(150000);
      expect(findSub('TOTAL_DEDUCTIONS')?.roundedValue).toBe(-15000);
      expect(findSub('NET_INFLOW')?.roundedValue).toBe(135000); // 150000 + (-15000) = 135000
      expect(findSub('TOTAL_DIRECT_COST')?.roundedValue).toBe(-60000);
      expect(findSub('GROSS_RESULT')?.roundedValue).toBe(75000); // 135000 + (-60000) = 75000
      expect(findSub('TOTAL_OPERATING_EXPENSE')?.roundedValue).toBe(-20000);

      // Verificação da expressão auditável na proveniência
      const netInflowSub = findSub('NET_INFLOW');
      expect(netInflowSub?.provenance.expression).toBe('150000 + (-15000) = 135000');
      expect(netInflowSub?.provenance.signSemantics).toBe('SIGNED_VALUE_MODEL');

      const grossResultSub = findSub('GROSS_RESULT');
      expect(grossResultSub?.provenance.expression).toBe('135000 + (-60000) = 75000');
      expect(grossResultSub?.provenance.signSemantics).toBe('SIGNED_VALUE_MODEL');

      // Validar proveniência de subtotal
      const valSub = DRESubtotalProvenanceValidator.validate(res.artifact!);
      expect(valSub.isValid).toBe(true);
      expect(valSub.errors.length).toBe(0);
    });
  });

  describe('4. Política V3 — Estrutura Operacional Estendida com Todos os Grupos Financeiros', () => {
    it('deve calcular os 13 subtotais governados da V3 com oracle independente auditável', () => {
      const v3Ctx = {
        ...validContext,
        policy: CANONICAL_DRE_COMPOSITION_POLICY_V3,
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            {
              decisionId: 'dec_gross_1',
              sourceRecordIdentity: 'row_101',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Vendas de Produtos A',
              normalizedValue: 'VENDAS_A',
              categoryIdentity: 'cat_id_VENDAS_A',
              statementGroup: 'GROSS_INFLOW',
              classificationType: 'INFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'PRESERVE_SOURCE_SIGN',
              materialityAssessment: { absoluteValue: 100000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_gross_2',
              sourceRecordIdentity: 'row_102',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Vendas de Serviços B',
              normalizedValue: 'VENDAS_B',
              categoryIdentity: 'cat_id_VENDAS_B',
              statementGroup: 'GROSS_INFLOW',
              classificationType: 'INFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'PRESERVE_SOURCE_SIGN',
              materialityAssessment: { absoluteValue: 50000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_ded_1',
              sourceRecordIdentity: 'row_103',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Imposto C',
              normalizedValue: 'IMPOSTO_C',
              categoryIdentity: 'cat_id_IMPOSTO_C',
              statementGroup: 'DEDUCTION',
              classificationType: 'OUTFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 10000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_ded_2',
              sourceRecordIdentity: 'row_104',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Devoluções D',
              normalizedValue: 'DEVOLUCOES_D',
              categoryIdentity: 'cat_id_DEVOLUCOES_D',
              statementGroup: 'DEDUCTION',
              classificationType: 'OUTFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 5000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_cost_1',
              sourceRecordIdentity: 'row_105',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Custo E',
              normalizedValue: 'CUSTO_E',
              categoryIdentity: 'cat_id_CUSTO_E',
              statementGroup: 'DIRECT_COST',
              classificationType: 'OUTFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 60000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_exp_1',
              sourceRecordIdentity: 'row_106',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Despesa F',
              normalizedValue: 'DESPESA_F',
              categoryIdentity: 'cat_id_DESPESA_F',
              statementGroup: 'OPERATING_EXPENSE',
              classificationType: 'OUTFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 20000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_fin_1',
              sourceRecordIdentity: 'row_107',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Juros Passivos G',
              normalizedValue: 'JUROS_PASSIVOS_G',
              categoryIdentity: 'cat_id_JUROS_G',
              statementGroup: 'FINANCIAL_RESULT',
              classificationType: 'OUTFLOW',
              financialNature: 'FINANCIAL',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 3000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_fin_2',
              sourceRecordIdentity: 'row_108',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Rendimento de Aplicações H',
              normalizedValue: 'RENDIMENTO_H',
              categoryIdentity: 'cat_id_RENDIMENTO_H',
              statementGroup: 'FINANCIAL_RESULT',
              classificationType: 'INFLOW',
              financialNature: 'FINANCIAL',
              signPolicy: 'PRESERVE_SOURCE_SIGN',
              materialityAssessment: { absoluteValue: 1000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_tax_1',
              sourceRecordIdentity: 'row_109',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Imposto de Renda / CSLL I',
              normalizedValue: 'IRPJ_CSLL_I',
              categoryIdentity: 'cat_id_IRPJ_I',
              statementGroup: 'TAX_RESULT',
              classificationType: 'OUTFLOW',
              financialNature: 'TAX',
              signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
              materialityAssessment: { absoluteValue: 8000, materialityState: 'MATERIAL' }
            },
            {
              decisionId: 'dec_non_op_1',
              sourceRecordIdentity: 'row_110',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Venda de Ativo Imobilizado J',
              normalizedValue: 'VENDA_ATIVO_J',
              categoryIdentity: 'cat_id_VENDA_ATIVO_J',
              statementGroup: 'NON_OPERATING',
              classificationType: 'INFLOW',
              financialNature: 'NON_OPERATING',
              signPolicy: 'PRESERVE_SOURCE_SIGN',
              materialityAssessment: { absoluteValue: 2000, materialityState: 'MATERIAL' }
            }
          ]
        }
      };

      const res = engine.composeDRE(v3Ctx as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.subtotals.length).toBe(13);

      const findSub = (code: string) => res.artifact?.subtotals.find(s => s.subtotalCode === code);

      // Oracle Independente da Fixture V3
      expect(findSub('TOTAL_GROSS_INFLOW')?.roundedValue).toBe(150000);
      expect(findSub('TOTAL_DEDUCTIONS')?.roundedValue).toBe(-15000);
      expect(findSub('NET_INFLOW')?.roundedValue).toBe(135000);
      expect(findSub('TOTAL_DIRECT_COST')?.roundedValue).toBe(-60000);
      expect(findSub('GROSS_RESULT')?.roundedValue).toBe(75000);
      expect(findSub('TOTAL_OPERATING_EXPENSE')?.roundedValue).toBe(-20000);

      // Novos Subtotais V3
      expect(findSub('OPERATING_RESULT')?.roundedValue).toBe(55000); // 75000 + (-20000)
      expect(findSub('TOTAL_FINANCIAL_RESULT')?.roundedValue).toBe(-2000); // -3000 + 1000
      expect(findSub('RESULT_AFTER_FINANCIAL')?.roundedValue).toBe(53000); // 55000 + (-2000)
      expect(findSub('TOTAL_TAX_RESULT')?.roundedValue).toBe(-8000);
      expect(findSub('RESULT_AFTER_TAX_ITEMS')?.roundedValue).toBe(45000); // 53000 + (-8000)
      expect(findSub('TOTAL_NON_OPERATING')?.roundedValue).toBe(2000);
      expect(findSub('RESULT_AFTER_NON_OPERATING')?.roundedValue).toBe(47000); // 45000 + 2000
      expect(findSub('RESULT_AFTER_NON_OPERATING')?.label).toBe('Resultado Estrutural Após Itens Não Operacionais');

      // Validação do validador de proveniência
      const valSub = DRESubtotalProvenanceValidator.validate(res.artifact!);
      expect(valSub.isValid).toBe(true);
      expect(valSub.errors.length).toBe(0);
    });

    it('RECOVERY GATE 4.4.1: deve tratar ausência de grupos e registrar ZERO_BY_POLICY com proveniência explícita', () => {
      const v3CtxNoGroups = {
        ...validContext,
        policy: CANONICAL_DRE_COMPOSITION_POLICY_V3,
        financialClassificationArtifact: {
          ...validContext.financialClassificationArtifact,
          classificationDecisions: [
            {
              decisionId: 'dec_gross_only',
              sourceRecordIdentity: 'row_1',
              containerId: 'cont_1',
              monetaryFieldPhysicalName: 'VALOR',
              categoryFieldPhysicalName: 'CATEGORIA',
              periodId: 'per_total_aggregated',
              physicalValue: 'Vendas Únicas',
              normalizedValue: 'VENDAS_UNICAS',
              categoryIdentity: 'cat_id_VENDAS_UNICAS',
              statementGroup: 'GROSS_INFLOW',
              classificationType: 'INFLOW',
              financialNature: 'OPERATING',
              signPolicy: 'PRESERVE_SOURCE_SIGN',
              materialityAssessment: { absoluteValue: 100000, materialityState: 'MATERIAL' }
            }
          ]
        }
      };

      const res = engine.composeDRE(v3CtxNoGroups as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.subtotals.length).toBe(13);

      const findSub = (code: string) => res.artifact?.subtotals.find(s => s.subtotalCode === code);

      expect(findSub('TOTAL_GROSS_INFLOW')?.roundedValue).toBe(100000);
      expect(findSub('TOTAL_DEDUCTIONS')?.roundedValue).toBe(0);
      expect(findSub('NET_INFLOW')?.roundedValue).toBe(100000);
      expect(findSub('TOTAL_DIRECT_COST')?.roundedValue).toBe(0);
      expect(findSub('GROSS_RESULT')?.roundedValue).toBe(100000);
      expect(findSub('TOTAL_OPERATING_EXPENSE')?.roundedValue).toBe(0);
      expect(findSub('OPERATING_RESULT')?.roundedValue).toBe(100000);
      expect(findSub('TOTAL_FINANCIAL_RESULT')?.roundedValue).toBe(0);
      expect(findSub('RESULT_AFTER_FINANCIAL')?.roundedValue).toBe(100000);
      expect(findSub('TOTAL_TAX_RESULT')?.roundedValue).toBe(0);
      expect(findSub('RESULT_AFTER_TAX_ITEMS')?.roundedValue).toBe(100000);
      expect(findSub('TOTAL_NON_OPERATING')?.roundedValue).toBe(0);
      expect(findSub('RESULT_AFTER_NON_OPERATING')?.roundedValue).toBe(100000);
    });

    it('RECOVERY GATE 4.4.1: Moeda UNKNOWN gera artefato LIMITED e bloqueia moedas misturadas', () => {
      const unknownCtx = {
        ...validContext,
        policy: CANONICAL_DRE_COMPOSITION_POLICY_V3,
        currencyContext: { currencyCode: 'UNKNOWN', currencySource: 'UNKNOWN', limitations: ['CURRENCY_NOT_DEFINED'] }
      };

      const res = engine.composeDRE(unknownCtx as any);
      expect(res.success).toBe(true);
      expect(res.artifact?.status).toBe('LIMITED');
      expect(res.artifact?.limitations).toContain('CURRENCY_NOT_DEFINED: Composição realizada sob limitação por ausência de declaração explícita de moeda.');
    });

    it('RECOVERY GATE 4.4.1: Validador topológico deve detectar ciclos e dependências inexistentes ou duplicadas', () => {
      const mockArtifactWithCycle: any = {
        subtotals: [
          {
            subtotalId: 'sub_a',
            subtotalCode: 'TOTAL_GROSS_INFLOW',
            periodId: 'per_total_aggregated',
            currencyCode: 'BRL',
            formulaId: 'f1',
            formulaVersion: '3.0.0',
            inputLineIds: [],
            inputSubtotalIds: ['sub_b'],
            provenance: { signSemantics: 'SIGNED_VALUE_MODEL', expression: 'sub_b' }
          },
          {
            subtotalId: 'sub_b',
            subtotalCode: 'NET_INFLOW',
            periodId: 'per_total_aggregated',
            currencyCode: 'BRL',
            formulaId: 'f2',
            formulaVersion: '3.0.0',
            inputLineIds: [],
            inputSubtotalIds: ['sub_a'],
            provenance: { signSemantics: 'SIGNED_VALUE_MODEL', expression: 'sub_a' }
          }
        ],
        lines: []
      };

      const valRes = DRESubtotalProvenanceValidator.validate(mockArtifactWithCycle);
      expect(valRes.isValid).toBe(false);
      expect(valRes.errors.some(e => e.includes('CIRCULAR_SUBTOTAL_DEPENDENCY'))).toBe(true);

      const mockArtifactDuplicateOutput: any = {
        subtotals: [
          {
            subtotalId: 'sub_1',
            subtotalCode: 'TOTAL_GROSS_INFLOW',
            periodId: 'per_total_aggregated',
            currencyCode: 'BRL',
            formulaId: 'f1',
            formulaVersion: '3.0.0',
            inputLineIds: [],
            inputSubtotalIds: [],
            provenance: { signSemantics: 'SIGNED_VALUE_MODEL', expression: '0' }
          },
          {
            subtotalId: 'sub_2',
            subtotalCode: 'TOTAL_GROSS_INFLOW',
            periodId: 'per_total_aggregated',
            currencyCode: 'BRL',
            formulaId: 'f2',
            formulaVersion: '3.0.0',
            inputLineIds: [],
            inputSubtotalIds: [],
            provenance: { signSemantics: 'SIGNED_VALUE_MODEL', expression: '0' }
          }
        ],
        lines: []
      };

      const valDup = DRESubtotalProvenanceValidator.validate(mockArtifactDuplicateOutput);
      expect(valDup.isValid).toBe(false);
      expect(valDup.errors.some(e => e.includes('DUPLICATE_SUBTOTAL_OUTPUT'))).toBe(true);
    });
  });
});
