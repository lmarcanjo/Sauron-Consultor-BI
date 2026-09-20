import { describe, it, expect, beforeEach } from 'vitest';
import { DREReconciliationEngine, DREReconciliationExecutionContext } from './DREReconciliationEngine';
import { InMemoryDREReconciliationArtifactRepository } from './DREReconciliationArtifactRepository';
import { DREReconciliationService } from './DREReconciliationService';
import { DREReconciliationProvenanceValidator } from './DREReconciliationProvenanceValidator';
import { CANONICAL_DRE_COMPOSITION_POLICY_V3 } from '../dre-composition/DRECompositionPolicy';
import { PlatformUser } from '../identity/types';

describe('Sprint 4.5 — DREReconciliationEngine & Structural Integrity Certification', () => {
  let engine: DREReconciliationEngine;
  let repo: InMemoryDREReconciliationArtifactRepository;
  let service: DREReconciliationService;

  const currentUser: PlatformUser = {
    id: 'usr_consultant_1',
    profile: {
      id: 'usr_consultant_1',
      fullName: 'Consultor BI Sênior',
      email: 'consultor@asterion.com'
    },
    role: 'CONSULTANT'
  };

  const validTrustArtifact: any = {
    artifactId: 'trust_123',
    trustAssessment: { overallState: 'TRUSTED' },
    usageAssessments: [{ usageType: 'FINANCIAL_ANALYSIS', status: 'TRUSTED' }]
  };

  const validClassificationArtifact: any = {
    artifactId: 'class_art_1',
    status: 'CONFIRMED',
    scope: { scopeLevel: 'DATA_SOURCE', scopeId: 'ds_1', engagementId: 'eng_1' },
    limitations: [],
    unresolvedClassifications: [],
    classificationDecisions: [
      {
        decisionId: 'dec_1',
        sourceRecordIdentity: 'row_1',
        containerId: 'cont_1',
        monetaryFieldPhysicalName: 'VALOR',
        categoryFieldPhysicalName: 'CATEGORIA',
        periodId: 'per_total_aggregated',
        physicalValue: 'Vendas A',
        normalizedValue: 'VENDAS_A',
        categoryIdentity: 'cat_VENDAS_A',
        statementGroup: 'GROSS_INFLOW',
        classificationType: 'INFLOW',
        financialNature: 'OPERATING',
        signPolicy: 'PRESERVE_SOURCE_SIGN',
        materialityAssessment: { absoluteValue: 100000, materialityState: 'MATERIAL' }
      },
      {
        decisionId: 'dec_2',
        sourceRecordIdentity: 'row_2',
        containerId: 'cont_1',
        monetaryFieldPhysicalName: 'VALOR',
        categoryFieldPhysicalName: 'CATEGORIA',
        periodId: 'per_total_aggregated',
        physicalValue: 'Custo B',
        normalizedValue: 'CUSTO_B',
        categoryIdentity: 'cat_CUSTO_B',
        statementGroup: 'DIRECT_COST',
        classificationType: 'OUTFLOW',
        financialNature: 'OPERATING',
        signPolicy: 'ABSOLUTE_VALUE_AS_OUTFLOW',
        materialityAssessment: { absoluteValue: 40000, materialityState: 'MATERIAL' }
      }
    ]
  };

  const validDREArtifact: any = {
    artifactId: 'art_dre_1',
    engineId: 'DRECompositionEngine',
    engineVersion: '1.0.0-CANONICAL',
    policyId: CANONICAL_DRE_COMPOSITION_POLICY_V3.policyId,
    policyVersion: CANONICAL_DRE_COMPOSITION_POLICY_V3.version,
    policyFingerprint: CANONICAL_DRE_COMPOSITION_POLICY_V3.fingerprint,
    engagementId: 'eng_1',
    dataSourceIds: ['ds_1'],
    schemaVersionReferences: [1],
    businessArtifactIds: [],
    lines: [
      {
        lineId: 'line_1',
        lineCode: 'LINE_001',
        label: 'Vendas A',
        statementGroup: 'GROSS_INFLOW',
        periodValues: { per_total_aggregated: 100000 },
        totalValue: 100000,
        sourceCategoryIdentities: ['cat_VENDAS_A']
      },
      {
        lineId: 'line_2',
        lineCode: 'LINE_002',
        label: 'Custo B',
        statementGroup: 'DIRECT_COST',
        periodValues: { per_total_aggregated: -40000 },
        totalValue: -40000,
        sourceCategoryIdentities: ['cat_CUSTO_B']
      }
    ],
    subtotals: [
      {
        subtotalId: 'sub_1',
        subtotalCode: 'TOTAL_GROSS_INFLOW',
        formulaId: 'form_1',
        formulaVersion: '3.0.0',
        periodId: 'per_total_aggregated',
        currencyCode: 'BRL',
        operation: 'SUM_LINES',
        inputLineIds: ['line_1'],
        inputSubtotalIds: [],
        rawValue: 100000,
        roundedValue: 100000,
        provenance: { expression: '100000' }
      },
      {
        subtotalId: 'sub_2',
        subtotalCode: 'TOTAL_DEDUCTIONS',
        formulaId: 'form_2',
        formulaVersion: '3.0.0',
        periodId: 'per_total_aggregated',
        currencyCode: 'BRL',
        operation: 'SUM_LINES',
        inputLineIds: [],
        inputSubtotalIds: [],
        rawValue: 0,
        roundedValue: 0,
        provenance: { expression: '0' }
      },
      {
        subtotalId: 'sub_3',
        subtotalCode: 'NET_INFLOW',
        formulaId: 'form_3',
        formulaVersion: '3.0.0',
        periodId: 'per_total_aggregated',
        currencyCode: 'BRL',
        operation: 'ADD_SUBTOTALS',
        inputLineIds: [],
        inputSubtotalIds: ['sub_1', 'sub_2'],
        rawValue: 100000,
        roundedValue: 100000,
        provenance: { expression: '100000 + 0' }
      },
      {
        subtotalId: 'sub_4',
        subtotalCode: 'TOTAL_DIRECT_COST',
        formulaId: 'form_4',
        formulaVersion: '3.0.0',
        periodId: 'per_total_aggregated',
        currencyCode: 'BRL',
        operation: 'SUM_LINES',
        inputLineIds: ['line_2'],
        inputSubtotalIds: [],
        rawValue: -40000,
        roundedValue: -40000,
        provenance: { expression: '-40000' }
      },
      {
        subtotalId: 'sub_5',
        subtotalCode: 'GROSS_RESULT',
        formulaId: 'form_5',
        formulaVersion: '3.0.0',
        periodId: 'per_total_aggregated',
        currencyCode: 'BRL',
        operation: 'ADD_SUBTOTALS',
        inputLineIds: [],
        inputSubtotalIds: ['sub_3', 'sub_4'],
        rawValue: 60000,
        roundedValue: 60000,
        provenance: { expression: '100000 + (-40000)' }
      }
    ],
    limitations: [],
    metadata: { currencyCode: 'BRL' }
  };

  beforeEach(() => {
    engine = new DREReconciliationEngine();
    repo = new InMemoryDREReconciliationArtifactRepository();
    service = new DREReconciliationService(repo);
  });

  it('1. Cenário Íntegro Perfeito — Deve retornar status RECONCILED com 100% de cobertura', () => {
    const ctx: DREReconciliationExecutionContext = {
      dreArtifact: validDREArtifact,
      financialClassificationArtifact: validClassificationArtifact,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };

    const res = engine.reconcile(ctx);
    expect(res.success).toBe(true);
    expect(res.artifact?.reconciliationStatus).toBe('RECONCILED');
    expect(res.artifact?.sourceReconciliation.eligiblePhysicalRecordCount).toBe(2);
    expect(res.artifact?.sourceReconciliation.usedPhysicalRecordCount).toBe(2);
    expect(res.artifact?.sourceReconciliation.unexplainedDifference).toBe(0);

    const val = DREReconciliationProvenanceValidator.validate(res.artifact!);
    expect(val.isValid).toBe(true);
  });

  it('2. Cenário com Exclusões Governaods — Deve retornar status RECONCILED_WITH_LIMITATIONS', () => {
    const classArtWithExclusion: any = {
      ...validClassificationArtifact,
      classificationDecisions: [
        ...validClassificationArtifact.classificationDecisions,
        {
          decisionId: 'dec_3',
          sourceRecordIdentity: 'row_3',
          containerId: 'cont_1',
          monetaryFieldPhysicalName: 'VALOR',
          categoryFieldPhysicalName: 'CATEGORIA',
          periodId: 'per_total_aggregated',
          physicalValue: 'Não Financeiro C',
          normalizedValue: 'NAO_FINANCEIRO_C',
          categoryIdentity: 'cat_NAO_FINANCIAL',
          statementGroup: 'UNCLASSIFIED',
          classificationType: 'NON_FINANCIAL',
          financialNature: 'UNKNOWN',
          signPolicy: 'PRESERVE_SOURCE_SIGN',
          materialityAssessment: { absoluteValue: 5000, materialityState: 'IMMATERIAL' }
        }
      ]
    };

    const ctx: DREReconciliationExecutionContext = {
      dreArtifact: validDREArtifact,
      financialClassificationArtifact: classArtWithExclusion,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };

    const res = engine.reconcile(ctx);
    expect(res.success).toBe(true);
    expect(res.artifact?.reconciliationStatus).toBe('RECONCILED_WITH_LIMITATIONS');
    expect(res.artifact?.exclusions.length).toBe(1);
    expect(res.artifact?.exclusions[0].reasonCode).toBe('NON_FINANCIAL');
  });

  it('3. Cenário com Pendências Unresolved — Deve retornar status PARTIALLY_RECONCILED', () => {
    const classArtWithUnresolved: any = {
      ...validClassificationArtifact,
      classificationDecisions: [
        ...validClassificationArtifact.classificationDecisions,
        {
          decisionId: 'dec_unres',
          sourceRecordIdentity: 'row_unres',
          containerId: 'cont_1',
          monetaryFieldPhysicalName: 'VALOR',
          categoryFieldPhysicalName: 'CATEGORIA',
          periodId: 'per_total_aggregated',
          physicalValue: 'Pendente D',
          normalizedValue: 'PENDENTE_D',
          categoryIdentity: 'cat_PENDENTE',
          statementGroup: 'UNCLASSIFIED',
          classificationType: 'UNRESOLVED',
          financialNature: 'UNKNOWN',
          signPolicy: 'PRESERVE_SOURCE_SIGN',
          materialityAssessment: { absoluteValue: 2000, materialityState: 'IMMATERIAL' }
        }
      ]
    };

    const ctx: DREReconciliationExecutionContext = {
      dreArtifact: validDREArtifact,
      financialClassificationArtifact: classArtWithUnresolved,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };

    const res = engine.reconcile(ctx);
    expect(res.success).toBe(true);
    expect(res.artifact?.reconciliationStatus).toBe('PARTIALLY_RECONCILED');
    expect(res.artifact?.unresolvedItems.length).toBe(1);
  });

  it('4. Cenário de Duplicidade ou Divergência — Deve retornar status BLOCKED', () => {
    const classArtWithDuplicate: any = {
      ...validClassificationArtifact,
      classificationDecisions: [
        ...validClassificationArtifact.classificationDecisions,
        validClassificationArtifact.classificationDecisions[0] // registro duplicado exatamente igual
      ]
    };

    const ctx: DREReconciliationExecutionContext = {
      dreArtifact: validDREArtifact,
      financialClassificationArtifact: classArtWithDuplicate,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };

    const res = engine.reconcile(ctx);
    expect(res.success).toBe(true);
    expect(res.artifact?.reconciliationStatus).toBe('BLOCKED');
    expect(res.artifact?.sourceReconciliation.duplicatedPhysicalRecordCount).toBe(1);
  });

  it('5. Cenário de Mistura de Moedas — Deve falhar com erro MIXED_CURRENCY_RECONCILIATION_NOT_ALLOWED', () => {
    const mixedDREArtifact = {
      ...validDREArtifact,
      metadata: { currencyCode: 'BRL+USD' }
    };

    const ctx: DREReconciliationExecutionContext = {
      dreArtifact: mixedDREArtifact,
      financialClassificationArtifact: validClassificationArtifact,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };

    const res = engine.reconcile(ctx);
    expect(res.success).toBe(false);
    expect(res.issues[0].code).toBe('MIXED_CURRENCY_RECONCILIATION_NOT_ALLOWED');
  });

  it('6. Cenário de Omissão Material — Deve retornar status BLOCKED', () => {
    const classArtWithMissing: any = {
      ...validClassificationArtifact,
      classificationDecisions: [
        ...validClassificationArtifact.classificationDecisions,
        {
          decisionId: 'dec_miss',
          sourceRecordIdentity: 'row_miss',
          containerId: 'cont_1',
          monetaryFieldPhysicalName: 'VALOR',
          categoryFieldPhysicalName: 'CATEGORIA',
          periodId: 'per_total_aggregated',
          physicalValue: 'Omitido E',
          normalizedValue: 'OMITIDO_E',
          categoryIdentity: 'cat_OMITIDO',
          statementGroup: 'GROSS_INFLOW',
          classificationType: 'INFLOW',
          financialNature: 'OPERATING',
          signPolicy: 'PRESERVE_SOURCE_SIGN',
          isMissing: true,
          materialityAssessment: { absoluteValue: 50000, materialityState: 'MATERIAL' }
        }
      ]
    };

    const ctx: DREReconciliationExecutionContext = {
      dreArtifact: validDREArtifact,
      financialClassificationArtifact: classArtWithMissing,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };

    const res = engine.reconcile(ctx);
    expect(res.success).toBe(true);
    expect(res.artifact?.reconciliationStatus).toBe('BLOCKED');
    expect(res.artifact?.missingItems.length).toBe(1);
  });

  it('7. Cenário de Subtotal Adulterado — Oracle Independente deve detectar e retornar BLOCKED', () => {
    const tamperedDREArtifact = {
      ...validDREArtifact,
      subtotals: validDREArtifact.subtotals.map((s: any) =>
        s.subtotalCode === 'GROSS_RESULT' ? { ...s, rawValue: 999999 } : s
      )
    };

    const ctx: DREReconciliationExecutionContext = {
      dreArtifact: tamperedDREArtifact,
      financialClassificationArtifact: validClassificationArtifact,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };

    const res = engine.reconcile(ctx);
    expect(res.success).toBe(true);
    expect(res.artifact?.reconciliationStatus).toBe('BLOCKED');
    const grossResultRec = res.artifact?.subtotalReconciliations.find(s => s.subtotalCode === 'GROSS_RESULT');
    expect(grossResultRec?.status).toBe('MISMATCHED');
    expect(grossResultRec?.difference).toBeGreaterThan(0);
  });

  it('8. Service & Repositório — Deve executar reconciliação e emitir eventos factuais', async () => {
    const ctx: DREReconciliationExecutionContext = {
      dreArtifact: validDREArtifact,
      financialClassificationArtifact: validClassificationArtifact,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };

    const artifact = await service.reconcileAndSaveDRE(ctx, currentUser);
    expect(artifact.artifactId).toBeDefined();

    const latest = await service.getLatestReconciliation(validDREArtifact.artifactId);
    expect(latest?.artifactId).toBe(artifact.artifactId);

    // Invalidação por alteração da DRE
    await service.invalidateForDREChange(validDREArtifact.artifactId, 'DRE recarregada');
    const invalidated = await service.getLatestReconciliation(validDREArtifact.artifactId);
    expect(invalidated?.reconciliationStatus).toBe('INVALIDATED');
  });

  it('9. Cenários de Operação e Input Inválidos (Guarda de Falso Positivo) — Deve detectar inconsistências e retornar BLOCKED', () => {
    // A. SUM_LINES com inputSubtotalIds
    const badDREArtifactA = {
      ...validDREArtifact,
      subtotals: validDREArtifact.subtotals.map((s: any) =>
        s.subtotalCode === 'TOTAL_GROSS_INFLOW' ? { ...s, inputSubtotalIds: ['sub_2'] } : s
      )
    };
    const ctxA: DREReconciliationExecutionContext = {
      dreArtifact: badDREArtifactA,
      financialClassificationArtifact: validClassificationArtifact,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };
    const resA = engine.reconcile(ctxA);
    expect(resA.artifact?.reconciliationStatus).toBe('BLOCKED');
    expect(resA.artifact?.subtotalReconciliations.find(s => s.subtotalCode === 'TOTAL_GROSS_INFLOW')?.status).toBe('MISMATCHED');
    expect(resA.artifact?.subtotalReconciliations.find(s => s.subtotalCode === 'TOTAL_GROSS_INFLOW')?.findings[0]).toContain('INVALID_FORMULA_INPUT_TYPE');

    // B. ADD_SUBTOTALS com inputLineIds
    const badDREArtifactB = {
      ...validDREArtifact,
      subtotals: validDREArtifact.subtotals.map((s: any) =>
        s.subtotalCode === 'NET_INFLOW' ? { ...s, inputLineIds: ['line_1'] } : s
      )
    };
    const ctxB: DREReconciliationExecutionContext = {
      dreArtifact: badDREArtifactB,
      financialClassificationArtifact: validClassificationArtifact,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };
    const resB = engine.reconcile(ctxB);
    expect(resB.artifact?.reconciliationStatus).toBe('BLOCKED');
    expect(resB.artifact?.subtotalReconciliations.find(s => s.subtotalCode === 'NET_INFLOW')?.status).toBe('MISMATCHED');
    expect(resB.artifact?.subtotalReconciliations.find(s => s.subtotalCode === 'NET_INFLOW')?.findings[0]).toContain('INVALID_FORMULA_INPUT_TYPE');

    // C. Operação de fórmula divergente
    const badDREArtifactC = {
      ...validDREArtifact,
      subtotals: validDREArtifact.subtotals.map((s: any) =>
        s.subtotalCode === 'TOTAL_GROSS_INFLOW' ? { ...s, operation: 'ADD_SUBTOTALS' } : s
      )
    };
    const ctxC: DREReconciliationExecutionContext = {
      dreArtifact: badDREArtifactC,
      financialClassificationArtifact: validClassificationArtifact,
      trustArtifact: validTrustArtifact,
      semanticConfirmationArtifact: { artifactId: 'sem_1', overallStatus: 'CONFIRMED' } as any
    };
    const resC = engine.reconcile(ctxC);
    expect(resC.artifact?.reconciliationStatus).toBe('BLOCKED');
    expect(resC.artifact?.subtotalReconciliations.find(s => s.subtotalCode === 'TOTAL_GROSS_INFLOW')?.status).toBe('MISMATCHED');
    expect(resC.artifact?.subtotalReconciliations.find(s => s.subtotalCode === 'TOTAL_GROSS_INFLOW')?.findings[0]).toContain('FORMULA_OPERATION_MISMATCH');
  });
});
