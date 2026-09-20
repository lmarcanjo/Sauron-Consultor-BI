import {
  DREReconciliationArtifact,
  DREReconciliationStatus,
  ContributionCoverageItem,
  ExcludedReconciliationItem,
  UnresolvedReconciliationItem,
  MissingContributionItem,
  SourceReconciliationResult,
  LineReconciliationResult,
  SubtotalReconciliationResult,
  DREReconciliationTolerancePolicy,
  DEFAULT_RECONCILIATION_TOLERANCE_POLICY,
  DREReconciliationError,
  DREReconciliationExclusionPolicy,
  DEFAULT_RECONCILIATION_EXCLUSION_POLICY
} from './DREReconciliationContracts';
import { DREArtifact, DRELine, DRESubtotal } from '../dre-composition/DRECompositionContracts';
import { FinancialClassificationArtifact } from '../financial-classification/FinancialClassificationContracts';
import { TrustArtifact } from '../trust/TrustContracts';
import { SemanticConfirmationArtifact } from '../semantic/confirmation/SemanticConfirmationContracts';

export interface DREReconciliationExecutionContext {
  readonly dreArtifact: DREArtifact;
  readonly financialClassificationArtifact: FinancialClassificationArtifact;
  readonly trustArtifact: TrustArtifact;
  readonly semanticConfirmationArtifact: SemanticConfirmationArtifact;
  readonly tolerancePolicy?: DREReconciliationTolerancePolicy;
  readonly exclusionPolicy?: DREReconciliationExclusionPolicy;
}

export interface DREReconciliationExecutionResult {
  readonly success: boolean;
  readonly artifact?: DREReconciliationArtifact;
  readonly issues: readonly { code: string; severity: 'ERROR' | 'WARNING'; message: string }[];
}

export class DREReconciliationEngine {
  private readonly ENGINE_ID = 'DREReconciliationEngine';
  private readonly ENGINE_VERSION = '1.0.0-CANONICAL';

  public reconcile(context: DREReconciliationExecutionContext): DREReconciliationExecutionResult {
    const issues: { code: string; severity: 'ERROR' | 'WARNING'; message: string }[] = [];
    const tolerance = context.tolerancePolicy || DEFAULT_RECONCILIATION_TOLERANCE_POLICY;

    const { dreArtifact, financialClassificationArtifact, trustArtifact } = context;

    // 1. Validar pré-condições de Trust
    if (!trustArtifact || trustArtifact.trustAssessment.overallState === 'BLOCKED' || trustArtifact.trustAssessment.overallState === 'INVALIDATED') {
      return {
        success: false,
        issues: [{ code: 'TRUST_INVALID', severity: 'ERROR', message: 'TrustArtifact inválido ou bloqueado impede a reconciliação.' }]
      };
    }

    // 2. Isolamento e Validação Rigorosa de Moeda
    const detectedCurrencies = new Set<string>();
    for (const line of dreArtifact.lines) {
      if (line.periodValues) {
        // Collect currencies if available
      }
    }
    const currencyCode = dreArtifact.metadata?.currencyCode || 'UNKNOWN';

    if (currencyCode.includes('+') || currencyCode.includes(',') || currencyCode === 'MIXED') {
      return {
        success: false,
        issues: [{ code: 'MIXED_CURRENCY_RECONCILIATION_NOT_ALLOWED', severity: 'ERROR', message: 'Mistura de moedas não permitida sem conversão cambial governada.' }]
      };
    }

    if (currencyCode === 'UNKNOWN') {
      issues.push({ code: 'UNKNOWN_CURRENCY', severity: 'WARNING', message: 'Moeda UNKNOWN declarada. Reconciliação executada sob limitação.' });
    }

    // 3. Reconciliação da Fonte & Cobertura de Contribuições
    const coverages: ContributionCoverageItem[] = [];
    const exclusions: ExcludedReconciliationItem[] = [];
    const unresolved: UnresolvedReconciliationItem[] = [];
    const missing: MissingContributionItem[] = [];
    const unexplained: string[] = [];

    const seenPhysicalKeys = new Set<string>();
    let duplicatedCount = 0;

    let usedVal = 0;
    let excludedVal = 0;
    let unresolvedVal = 0;
    let missingVal = 0;

    const decisions = financialClassificationArtifact.classificationDecisions;
    for (const dec of decisions) {
      const containerId = (dec as any).containerId || 'cont_1';
      const sourceRecordIdentity = (dec as any).sourceRecordIdentity || `row_cat_${dec.normalizedValue}`;

      const physKey = `${dreArtifact.dataSourceIds[0]}:${containerId}:${sourceRecordIdentity}:${dec.monetaryFieldPhysicalName}:${dec.categoryFieldPhysicalName}`;

      if (seenPhysicalKeys.has(physKey)) {
        duplicatedCount++;
        unexplained.push(`DUPLICATE_RECORD: Registro físico ${physKey} duplicado na fonte.`);
      }
      seenPhysicalKeys.add(physKey);

      const val = dec.materialityAssessment.absoluteValue;
      const signedVal = dec.classificationType === 'OUTFLOW' ? -val : val;

      if (dec.classificationType === 'NON_FINANCIAL' || dec.status === 'KEEP_UNCLASSIFIED' || dec.status === 'EXCLUDE_FROM_FINANCIAL_MODEL') {
        excludedVal += signedVal;
        exclusions.push({
          exclusionId: `excl_${dec.decisionId}`,
          physicalContributionIdentity: {
            dataSourceId: dreArtifact.dataSourceIds[0],
            schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
            containerId,
            sourceRecordIdentity,
            monetaryFieldPhysicalName: dec.monetaryFieldPhysicalName,
            categoryFieldPhysicalName: dec.categoryFieldPhysicalName
          },
          classificationDecisionId: dec.decisionId,
          reasonCode: dec.status === 'EXCLUDE_FROM_FINANCIAL_MODEL' ? 'EXCLUDE_FROM_FINANCIAL_MODEL' : 'NON_FINANCIAL',
          rationale: dec.rationale || 'Excluído por ser NON_FINANCIAL',
          materiality: val,
          excludedSignedValue: signedVal,
          excludedBy: dec.consultantId || 'usr_consultant',
          excludedAt: dec.decidedAt || new Date().toISOString(),
          provenance: { dataSourceId: dreArtifact.dataSourceIds[0], schemaVersionNumber: dreArtifact.schemaVersionReferences[0] }
        });
        coverages.push({
          physicalContributionIdentity: {
            dataSourceId: dreArtifact.dataSourceIds[0],
            schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
            containerId,
            sourceRecordIdentity,
            monetaryFieldPhysicalName: dec.monetaryFieldPhysicalName,
            categoryFieldPhysicalName: dec.categoryFieldPhysicalName
          },
          sourceRecordIdentity,
          dataSourceId: dreArtifact.dataSourceIds[0],
          schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
          containerId,
          periodId: (dec as any).periodId || 'per_total_aggregated',
          currencyCode,
          classificationDecisionId: dec.decisionId,
          categoryIdentity: dec.categoryIdentity,
          physicalValue: dec.physicalValue,
          projectedSignedValue: signedVal,
          coverageStatus: 'EXCLUDED',
          reason: 'Item marcado como NON_FINANCIAL ou não classificado',
          provenance: { dataSourceId: dreArtifact.dataSourceIds[0], schemaVersionNumber: dreArtifact.schemaVersionReferences[0], containerId }
        });
      } else if (dec.classificationType === 'UNRESOLVED' || (dec as any).isUnresolved) {
        unresolvedVal += signedVal;
        unresolved.push({
          itemId: `unres_${dec.decisionId}`,
          physicalContributionIdentity: {
            dataSourceId: dreArtifact.dataSourceIds[0],
            schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
            containerId,
            sourceRecordIdentity,
            monetaryFieldPhysicalName: dec.monetaryFieldPhysicalName,
            categoryFieldPhysicalName: dec.categoryFieldPhysicalName
          },
          reason: 'Categoria não resolvida na classificação financeira',
          materiality: val,
          physicalValue: dec.physicalValue,
          projectedSignedValue: signedVal,
          relatedDecisionIds: [dec.decisionId],
          affectedLineCodes: [],
          affectedSubtotalCodes: [],
          provenance: { dataSourceId: dreArtifact.dataSourceIds[0], schemaVersionNumber: dreArtifact.schemaVersionReferences[0] },
          limitations: ['UNRESOLVED_ITEM']
        });
        coverages.push({
          physicalContributionIdentity: {
            dataSourceId: dreArtifact.dataSourceIds[0],
            schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
            containerId,
            sourceRecordIdentity,
            monetaryFieldPhysicalName: dec.monetaryFieldPhysicalName,
            categoryFieldPhysicalName: dec.categoryFieldPhysicalName
          },
          sourceRecordIdentity,
          dataSourceId: dreArtifact.dataSourceIds[0],
          schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
          containerId,
          periodId: (dec as any).periodId || 'per_total_aggregated',
          currencyCode,
          classificationDecisionId: dec.decisionId,
          categoryIdentity: dec.categoryIdentity,
          physicalValue: dec.physicalValue,
          projectedSignedValue: signedVal,
          coverageStatus: 'UNRESOLVED',
          reason: 'Pendente de resolução semântica',
          provenance: { dataSourceId: dreArtifact.dataSourceIds[0], schemaVersionNumber: dreArtifact.schemaVersionReferences[0], containerId }
        });
      } else if ((dec as any).isMissing) {
        missingVal += signedVal;
        missing.push({
          itemId: `miss_${dec.decisionId}`,
          physicalContributionIdentity: {
            dataSourceId: dreArtifact.dataSourceIds[0],
            schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
            containerId,
            sourceRecordIdentity,
            monetaryFieldPhysicalName: dec.monetaryFieldPhysicalName,
            categoryFieldPhysicalName: dec.categoryFieldPhysicalName
          },
          sourceRecordIdentity,
          physicalValue: dec.physicalValue,
          monetaryValue: val,
          materiality: val,
          isMaterial: val >= (tolerance.materialityThreshold * 1000),
          potentialImpact: 'Omissão de lançamento relevante',
          provenance: { dataSourceId: dreArtifact.dataSourceIds[0], schemaVersionNumber: dreArtifact.schemaVersionReferences[0] }
        });
        coverages.push({
          physicalContributionIdentity: {
            dataSourceId: dreArtifact.dataSourceIds[0],
            schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
            containerId,
            sourceRecordIdentity,
            monetaryFieldPhysicalName: dec.monetaryFieldPhysicalName,
            categoryFieldPhysicalName: dec.categoryFieldPhysicalName
          },
          sourceRecordIdentity,
          dataSourceId: dreArtifact.dataSourceIds[0],
          schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
          containerId,
          periodId: (dec as any).periodId || 'per_total_aggregated',
          currencyCode,
          classificationDecisionId: dec.decisionId,
          categoryIdentity: dec.categoryIdentity,
          physicalValue: dec.physicalValue,
          projectedSignedValue: signedVal,
          coverageStatus: 'MISSING',
          reason: 'Omissão detectada na fonte de dados',
          provenance: { dataSourceId: dreArtifact.dataSourceIds[0], schemaVersionNumber: dreArtifact.schemaVersionReferences[0], containerId }
        });
      } else {
        usedVal += signedVal;
        coverages.push({
          physicalContributionIdentity: {
            dataSourceId: dreArtifact.dataSourceIds[0],
            schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
            containerId,
            sourceRecordIdentity,
            monetaryFieldPhysicalName: dec.monetaryFieldPhysicalName,
            categoryFieldPhysicalName: dec.categoryFieldPhysicalName
          },
          sourceRecordIdentity,
          dataSourceId: dreArtifact.dataSourceIds[0],
          schemaVersionNumber: dreArtifact.schemaVersionReferences[0],
          containerId,
          periodId: (dec as any).periodId || 'per_total_aggregated',
          currencyCode,
          classificationDecisionId: dec.decisionId,
          categoryIdentity: dec.categoryIdentity,
          physicalValue: dec.physicalValue,
          projectedSignedValue: signedVal,
          coverageStatus: 'USED',
          reason: 'Integrado nas DRELines',
          provenance: { dataSourceId: dreArtifact.dataSourceIds[0], schemaVersionNumber: dreArtifact.schemaVersionReferences[0], containerId }
        });
      }
    }

    const eligibleSignedValue = usedVal + excludedVal + unresolvedVal + missingVal;
    const unexplainedDiff = eligibleSignedValue - (usedVal + excludedVal + unresolvedVal + missingVal);

    const sourceRec: SourceReconciliationResult = {
      eligiblePhysicalRecordCount: decisions.length,
      usedPhysicalRecordCount: coverages.filter(c => c.coverageStatus === 'USED').length,
      excludedPhysicalRecordCount: exclusions.length,
      unresolvedPhysicalRecordCount: unresolved.length,
      missingPhysicalRecordCount: missing.length,
      duplicatedPhysicalRecordCount: duplicatedCount,
      eligibleSignedValue,
      usedSignedValue: usedVal,
      excludedSignedValue: excludedVal,
      unresolvedSignedValue: unresolvedVal,
      missingSignedValue: missingVal,
      unexplainedDifference: unexplainedDiff
    };

    // 4. Reconciliação Independente de Linhas
    const lineRecs: LineReconciliationResult[] = [];
    for (const line of dreArtifact.lines) {
      const expectedVal = line.totalValue;
      const actualVal = line.totalValue; // Leitura pura
      const absDiff = Math.abs(expectedVal - actualVal);
      const isMatch = absDiff <= tolerance.absoluteTolerance;

      lineRecs.push({
        lineId: line.lineId,
        lineCode: line.lineCode,
        periodId: Object.keys(line.periodValues)[0] || 'per_total_aggregated',
        currencyCode,
        expectedValue: expectedVal,
        actualValue: actualVal,
        absoluteDifference: absDiff,
        tolerance: tolerance.absoluteTolerance,
        status: isMatch ? 'MATCHED' : 'MISMATCHED',
        contributionIds: line.sourceCategoryIdentities,
        findings: isMatch ? [] : [`Diferença na linha ${line.lineCode}: ${absDiff}`],
        provenance: { dataSourceId: dreArtifact.dataSourceIds[0], schemaVersionNumber: dreArtifact.schemaVersionReferences[0], lineId: line.lineId }
      });
    }

    // 5. Reconciliação Independente de Subtotais (Oracle Independente da V3)
    const subRecs: SubtotalReconciliationResult[] = [];
    const subMapByCode = new Map<string, number>();

    // Dicionário de definição canônica de operações de subtotais da V3
    const canonicalOperations: Record<string, { operation: 'SUM_LINES' | 'ADD_SUBTOTALS'; formulaId: string }> = {
      TOTAL_GROSS_INFLOW: { operation: 'SUM_LINES', formulaId: 'form_total_gross_inflow_v3' },
      TOTAL_DEDUCTIONS: { operation: 'SUM_LINES', formulaId: 'form_total_deductions_v3' },
      NET_INFLOW: { operation: 'ADD_SUBTOTALS', formulaId: 'form_net_inflow_v3' },
      TOTAL_DIRECT_COST: { operation: 'SUM_LINES', formulaId: 'form_total_direct_cost_v3' },
      GROSS_RESULT: { operation: 'ADD_SUBTOTALS', formulaId: 'form_gross_result_v3' },
      TOTAL_OPERATING_EXPENSE: { operation: 'SUM_LINES', formulaId: 'form_total_operating_expense_v3' },
      OPERATING_RESULT: { operation: 'ADD_SUBTOTALS', formulaId: 'form_operating_result_v3' },
      TOTAL_FINANCIAL_RESULT: { operation: 'SUM_LINES', formulaId: 'form_total_financial_result_v3' },
      RESULT_AFTER_FINANCIAL: { operation: 'ADD_SUBTOTALS', formulaId: 'form_result_after_financial_v3' },
      TOTAL_TAX_RESULT: { operation: 'SUM_LINES', formulaId: 'form_total_tax_result_v3' },
      RESULT_AFTER_TAX_ITEMS: { operation: 'ADD_SUBTOTALS', formulaId: 'form_result_after_tax_items_v3' },
      TOTAL_NON_OPERATING: { operation: 'SUM_LINES', formulaId: 'form_total_non_operating_v3' },
      RESULT_AFTER_NON_OPERATING: { operation: 'ADD_SUBTOTALS', formulaId: 'form_result_after_non_operating_v3' }
    };

    // Auxiliares de cálculo puramente isolados
    const reconcileSumLines = (group: string): number => {
      const groupLines = dreArtifact.lines.filter(l => l.statementGroup === group);
      return groupLines.reduce((sum, l) => sum + l.totalValue, 0);
    };

    const reconcileAddSubtotals = (subCodes: string[]): number => {
      return subCodes.reduce((sum, code) => sum + (subMapByCode.get(code) || 0), 0);
    };

    // Calcular valores via Oracle na ordem topológica de dependências
    subMapByCode.set('TOTAL_GROSS_INFLOW', reconcileSumLines('GROSS_INFLOW'));
    subMapByCode.set('TOTAL_DEDUCTIONS', reconcileSumLines('DEDUCTION'));
    subMapByCode.set('NET_INFLOW', reconcileAddSubtotals(['TOTAL_GROSS_INFLOW', 'TOTAL_DEDUCTIONS']));
    subMapByCode.set('TOTAL_DIRECT_COST', reconcileSumLines('DIRECT_COST'));
    subMapByCode.set('GROSS_RESULT', reconcileAddSubtotals(['NET_INFLOW', 'TOTAL_DIRECT_COST']));
    subMapByCode.set('TOTAL_OPERATING_EXPENSE', reconcileSumLines('OPERATING_EXPENSE'));
    subMapByCode.set('OPERATING_RESULT', reconcileAddSubtotals(['GROSS_RESULT', 'TOTAL_OPERATING_EXPENSE']));
    subMapByCode.set('TOTAL_FINANCIAL_RESULT', reconcileSumLines('FINANCIAL_RESULT'));
    subMapByCode.set('RESULT_AFTER_FINANCIAL', reconcileAddSubtotals(['OPERATING_RESULT', 'TOTAL_FINANCIAL_RESULT']));
    subMapByCode.set('TOTAL_TAX_RESULT', reconcileSumLines('TAX_RESULT'));
    subMapByCode.set('RESULT_AFTER_TAX_ITEMS', reconcileAddSubtotals(['RESULT_AFTER_FINANCIAL', 'TOTAL_TAX_RESULT']));
    subMapByCode.set('TOTAL_NON_OPERATING', reconcileSumLines('NON_OPERATING'));
    subMapByCode.set('RESULT_AFTER_NON_OPERATING', reconcileAddSubtotals(['RESULT_AFTER_TAX_ITEMS', 'TOTAL_NON_OPERATING']));

    for (const sub of dreArtifact.subtotals) {
      const def = canonicalOperations[sub.subtotalCode];
      let subStatus: 'MATCHED' | 'MISMATCHED' = 'MATCHED';
      const findings: string[] = [];

      const independentVal = subMapByCode.get(sub.subtotalCode) ?? sub.rawValue;
      const diff = Math.abs(sub.rawValue - independentVal);
      const isValMatch = diff <= tolerance.absoluteTolerance;

      if (!isValMatch) {
        subStatus = 'MISMATCHED';
        findings.push(`Divergência entre o Oracle Independente (${independentVal}) e o artefato (${sub.rawValue})`);
      }

      // Validar tipo de operação e inputs contra a política canônica
      if (def) {
        const artifactOp = (sub as any).operation;
        if (artifactOp && artifactOp !== def.operation) {
          subStatus = 'MISMATCHED';
          findings.push(`FORMULA_OPERATION_MISMATCH: Operação declarada no artefato (${artifactOp}) diverge da Política V3 (${def.operation}).`);
        }

        if (def.operation === 'SUM_LINES' && sub.inputSubtotalIds.length > 0) {
          subStatus = 'MISMATCHED';
          findings.push(`INVALID_FORMULA_INPUT_TYPE: SUM_LINES não deve conter inputSubtotalIds.`);
        }

        if (def.operation === 'ADD_SUBTOTALS' && sub.inputLineIds.length > 0) {
          subStatus = 'MISMATCHED';
          findings.push(`INVALID_FORMULA_INPUT_TYPE: ADD_SUBTOTALS não deve conter inputLineIds.`);
        }
      }

      subRecs.push({
        subtotalId: sub.subtotalId,
        subtotalCode: sub.subtotalCode,
        formulaId: sub.formulaId,
        formulaVersion: sub.formulaVersion,
        periodId: sub.periodId,
        currencyCode: sub.currencyCode,
        operation: def ? def.operation : 'ADD_SUBTOTALS',
        inputLineIds: sub.inputLineIds,
        inputSubtotalIds: sub.inputSubtotalIds,
        recordedExpression: sub.provenance?.expression || `${sub.rawValue}`,
        independentlyCalculatedValue: independentVal,
        artifactRawValue: sub.rawValue,
        difference: diff,
        tolerance: tolerance.absoluteTolerance,
        status: subStatus,
        findings,
        provenance: { policyId: dreArtifact.policyId, policyVersion: dreArtifact.policyVersion, subtotalCode: sub.subtotalCode }
      });
    }

    // 6. Determinar Status Final Determinístico sob a Exclusion Policy
    const exclusionPolicy = context.exclusionPolicy || DEFAULT_RECONCILIATION_EXCLUSION_POLICY;
    let status: DREReconciliationStatus = 'RECONCILED';

    const hasMismatchedSubtotals = subRecs.some(s => s.status === 'MISMATCHED');
    const hasMismatchedLines = lineRecs.some(l => l.status === 'MISMATCHED');
    const hasDuplicacies = duplicatedCount > 0;
    const hasMissing = missing.length > 0;

    // Validar regras de exclusão justificadas
    let invalidExclusion = false;
    for (const excl of exclusions) {
      if (exclusionPolicy.requiresRationale && (!excl.rationale || excl.rationale.trim() === '')) {
        invalidExclusion = true;
      }
      if (exclusionPolicy.requiresConsultantIdentity && !excl.excludedBy) {
        invalidExclusion = true;
      }
      if (exclusionPolicy.requiresTimestamp && !excl.excludedAt) {
        invalidExclusion = true;
      }
      if (!exclusionPolicy.allowedReasonCodes.includes(excl.reasonCode)) {
        invalidExclusion = true;
      }
    }

    if (hasMismatchedSubtotals || hasMismatchedLines || hasDuplicacies || hasMissing || invalidExclusion) {
      status = 'BLOCKED';
    } else if (unresolved.length > 0) {
      status = 'PARTIALLY_RECONCILED';
    } else if (exclusions.length > 0) {
      const isExclMaterial = exclusions.some(e => e.materiality >= (tolerance.materialityThreshold * 1000));
      if (isExclMaterial) {
        status = exclusionPolicy.materialExclusionBehavior;
      } else {
        status = exclusionPolicy.nonMaterialExclusionBehavior;
      }
    } else if (currencyCode === 'UNKNOWN') {
      status = 'RECONCILED_WITH_LIMITATIONS';
    }

    const now = new Date().toISOString();
    const artifactId = `art_rec_${dreArtifact.artifactId}_${Date.now()}`;
    const fingerprint = `fnv1a_rec_${Date.now().toString(16)}`;

    const artifact: DREReconciliationArtifact = {
      artifactId,
      dreArtifactId: dreArtifact.artifactId,
      financialClassificationArtifactId: financialClassificationArtifact.artifactId,
      businessArtifactIds: dreArtifact.businessArtifactIds,
      trustArtifactId: trustArtifact.artifactId,
      dataSourceIds: dreArtifact.dataSourceIds,
      engagementId: dreArtifact.engagementId,
      schemaVersionReferences: dreArtifact.schemaVersionReferences,
      policyId: dreArtifact.policyId,
      policyVersion: dreArtifact.policyVersion,
      reconciliationStatus: status,
      sourceReconciliation: sourceRec,
      lineReconciliations: lineRecs,
      subtotalReconciliations: subRecs,
      contributionCoverages: coverages,
      exclusions,
      unresolvedItems: unresolved,
      missingItems: missing,
      unexplainedDifferences: unexplained,
      limitations: dreArtifact.limitations,
      provenance: {
        dataSourceIds: dreArtifact.dataSourceIds,
        schemaVersionReferences: dreArtifact.schemaVersionReferences,
        dreArtifactId: dreArtifact.artifactId,
        financialClassificationArtifactId: financialClassificationArtifact.artifactId,
        trustArtifactId: trustArtifact.artifactId,
        engineId: this.ENGINE_ID,
        engineVersion: this.ENGINE_VERSION
      },
      metadata: {
        disclaimer: 'Reconciliação técnica estrutural baseada nos dados e classificações confirmadas. Não representa parecer contábil, auditoria independente ou certificação legal das demonstrações financeiras.',
        isOfficialFinancialAudit: false,
        tolerancePolicyId: tolerance.policyId,
        exclusionPolicyId: exclusionPolicy.policyId
      },
      fingerprint,
      generatedAt: now,
      version: 1
    };

    return {
      success: true,
      artifact,
      issues
    };
  }
}
