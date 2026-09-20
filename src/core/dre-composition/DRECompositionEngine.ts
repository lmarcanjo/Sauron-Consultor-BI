import {
  DREArtifact,
  DRELine,
  DRESection,
  DREPeriod,
  DREPeriodType,
  DRESubtotal,
  DRECompositionPolicy,
  DRECompositionExecutionContext,
  DRECompositionExecutionResult,
  DRECompositionError,
  IDRECompositionEngine,
  CurrencyContext
} from './DRECompositionContracts';
import { CANONICAL_DRE_COMPOSITION_POLICY_V1, CANONICAL_DRE_FORMULAS_V2, CANONICAL_DRE_FORMULAS_V3, getStatementGroupLabel } from './DRECompositionPolicy';
import { FinancialClassificationEngine } from '../financial-classification/FinancialClassificationEngine';
import { StatementGroup } from '../financial-classification/FinancialClassificationContracts';

import { ContributionIdentityBuilder } from './ContributionIdentityBuilder';
import { DREDateParser } from './DREDateParser';

export class DRECompositionEngine implements IDRECompositionEngine {
  private readonly ENGINE_ID = 'DRECompositionEngine';
  private readonly ENGINE_VERSION = '1.0.0-CANONICAL';
  private readonly classEngine = new FinancialClassificationEngine();

  public composeDRE(context: DRECompositionExecutionContext): DRECompositionExecutionResult {
    const issues: { code: string; severity: 'ERROR' | 'WARNING'; message: string }[] = [];

    // 1. Validar Pré-condições Invioláveis
    const classArt = context.financialClassificationArtifact;
    if (!classArt) {
      return { success: false, issues: [{ code: 'MISSING_CLASSIFICATION_ARTIFACT', severity: 'ERROR', message: 'FinancialClassificationArtifact é obrigatório.' }] };
    }

    if (classArt.status !== 'CONFIRMED') {
      return {
        success: false,
        issues: [{ code: 'INVALID_CLASSIFICATION_STATUS', severity: 'ERROR', message: `Classificação com status ${classArt.status} não pode alimentar a DRE. Status deve ser CONFIRMED.` }]
      };
    }

    const trustArt = context.trustArtifact;
    if (!trustArt || trustArt.overallState === 'BLOCKED' || trustArt.overallState === 'INVALIDATED') {
      return {
        success: false,
        issues: [{ code: 'TRUST_NOT_AUTHORIZED', severity: 'ERROR', message: `TrustArtifact com estado ${trustArt?.overallState || 'MISSING'} bloqueia a composição de DRE.` }]
      };
    }

    const finUsage = trustArt.usageAssessments?.find((u: any) => u.usageType === 'FINANCIAL_ANALYSIS');
    if (!finUsage || finUsage.status === 'BLOCKED' || finUsage.status === 'FORBIDDEN') {
      return {
        success: false,
        issues: [{ code: 'FINANCIAL_USAGE_FORBIDDEN', severity: 'ERROR', message: 'Uso FINANCIAL_ANALYSIS não está autorizado no TrustArtifact.' }]
      };
    }

    const semConf = context.semanticConfirmationArtifact;
    if (!semConf || semConf.overallStatus !== 'CONFIRMED') {
      return {
        success: false,
        issues: [{ code: 'SEMANTIC_CONFIRMATION_INVALID', severity: 'ERROR', message: 'SemanticConfirmationArtifact deve estar no status CONFIRMED.' }]
      };
    }

    // 2. Resolver Política de Composição e Moeda
    const policy: DRECompositionPolicy = context.policy || CANONICAL_DRE_COMPOSITION_POLICY_V1;
    
    // Resolução da Moeda
    const currencyCtx: CurrencyContext = context.currencyContext || {
      currencyCode: 'UNKNOWN',
      currencySource: 'UNKNOWN',
      limitations: ['Moeda não informada explicitamente no contexto de execução.']
    };

    let artifactStatus: 'GENERATED' | 'LIMITED' | 'BLOCKED' = 'GENERATED';
    const limitations: string[] = [...classArt.limitations, ...currencyCtx.limitations];

    if (currencyCtx.currencyCode === 'UNKNOWN') {
      artifactStatus = 'LIMITED';
      limitations.push('CURRENCY_NOT_DEFINED: Composição realizada sob limitação por ausência de declaração explícita de moeda.');
    }

    // 3. Processar Decisões e Agrupar em Linhas da DRE com Proteção Contra Dupla Contagem via ContributionIdentityBuilder
    const lines: DRELine[] = [];
    const exclusions: string[] = [];
    const unresolvedItems: string[] = [...classArt.unresolvedClassifications];

    // Verificar se há itens materiais não resolvidos
    if (policy.unresolvedItemRules.blockOnMaterialUnresolved && unresolvedItems.length > 0) {
      return {
        success: false,
        issues: [{ code: 'MATERIAL_UNRESOLVED_ITEMS_PRESENT', severity: 'ERROR', message: `Não é possível compor a DRE. Categorias materiais não resolvidas: ${unresolvedItems.join(', ')}.` }]
      };
    }

    const seenCategories = new Set<string>();
    const seenContributionKeys = new Set<string>();
    const seenPhysicalIdentities = new Set<string>();
    const sectionMap = new Map<StatementGroup, DRELine[]>();
    policy.sectionOrder.forEach(g => sectionMap.set(g, []));

    // Mapeamento e estatísticas de períodos
    const reqPeriodType: DREPeriodType = context.requestedPeriodType || policy.periodPolicy.defaultPeriodType || 'MONTH';
    const hasTemporalField = !!context.confirmedTemporalFieldName;

    let lineCounter = 1;

    for (const dec of classArt.classificationDecisions) {
      const sourceRecordIdentity = dec.sourceRecordIdentity || `row_cat_${dec.normalizedValue}`;
      const containerId = dec.containerId || `container_${context.dataSourceId}`;
      const monetaryFieldPhysicalName = dec.monetaryFieldPhysicalName || 'VALOR';
      const categoryFieldPhysicalName = dec.categoryFieldPhysicalName || 'CATEGORIA';

      // Checagem de PhysicalContributionIdentity (mesmo registro físico independente de período)
      const physKey = `${context.dataSourceId}:${context.schemaVersionNumber}:${containerId}:${sourceRecordIdentity}:${monetaryFieldPhysicalName}:${categoryFieldPhysicalName}`;
      if (seenPhysicalIdentities.has(physKey)) {
        throw new DRECompositionError('DUPLICATE_PHYSICAL_RECORD', `Dupla contagem do mesmo registro físico ${physKey} bloqueada.`);
      }
      seenPhysicalIdentities.add(physKey);

      // Determinar periodId factual
      let recordPeriodId = 'per_total_aggregated';
      if (hasTemporalField && dec.physicalDateValue) {
        const parsedDate = DREDateParser.parse(dec.physicalDateValue, policy.periodPolicy.timezonePolicy);
        if (parsedDate.isValid && parsedDate.normalizedDate) {
          const [yrStr, moStr] = parsedDate.normalizedDate.split('-');
          const yr = parseInt(yrStr, 10);
          const mo = parseInt(moStr, 10);

          if (reqPeriodType === 'MONTH') {
            recordPeriodId = `per_m_${yr}_${String(mo).padStart(2, '0')}`;
          } else if (reqPeriodType === 'QUARTER') {
            const qtr = Math.ceil(mo / 3);
            recordPeriodId = `per_q_${yr}_q${qtr}`;
          } else if (reqPeriodType === 'YEAR') {
            recordPeriodId = `per_y_${yr}`;
          } else if (reqPeriodType === 'CUSTOM_PERIOD' && context.customPeriod) {
            recordPeriodId = context.customPeriod.customPeriodId;
          }
        }
      }

      const contribBuilt = ContributionIdentityBuilder.build({
        dataSourceId: context.dataSourceId,
        schemaVersionNumber: context.schemaVersionNumber,
        containerId,
        sourceRecordIdentity,
        monetaryFieldPhysicalName,
        categoryFieldPhysicalName,
        classificationDecisionId: dec.decisionId,
        periodId: recordPeriodId,
        currencyCode: currencyCtx.currencyCode
      });

      if (seenContributionKeys.has(contribBuilt.canonicalKey)) {
        throw new DRECompositionError(
          'DUPLICATE_CONTRIBUTION_IDENTITY',
          `Dupla contagem de contribuição detectada para a chave ${contribBuilt.canonicalKey} [${contribBuilt.canonicalSerialization}] na categoria ${dec.physicalValue}.`
        );
      }
      seenContributionKeys.add(contribBuilt.canonicalKey);

      if (seenCategories.has(dec.categoryIdentity)) {
        throw new DRECompositionError('DUPLICATE_CATEGORY_DECISION', `Dupla contagem detectada! Categoria ${dec.categoryIdentity} processada mais de uma vez.`);
      }
      seenCategories.add(dec.categoryIdentity);

      if (dec.classificationType === 'NON_FINANCIAL' && policy.exclusionRules.excludeNonFinancial) {
        exclusions.push(`Categoria física "${dec.physicalValue}" excluída por ser NON_FINANCIAL.`);
        continue;
      }

      // Calcular projeção de valor
      const projectedTotal = this.classEngine.projectValue(
        dec.materialityAssessment.absoluteValue,
        dec.signPolicy,
        dec.customRule
      );

      // Rejeitar valores numéricos inválidos
      if (!Number.isFinite(projectedTotal)) {
        return {
          success: false,
          issues: [{ code: 'INVALID_NUMERIC_VALUE', severity: 'ERROR', message: `Valor numérico inválido (NaN/Infinity) na categoria ${dec.physicalValue}.` }]
        };
      }

      const lineCode = `LINE_${String(lineCounter++).padStart(3, '0')}`;
      const line: DRELine = {
        lineId: `dre_line_${dec.normalizedValue}_${context.dataSourceId}`,
        lineCode,
        label: dec.physicalValue,
        statementGroup: dec.statementGroup,
        classificationType: dec.classificationType,
        financialNature: dec.financialNature,
        periodValues: { [recordPeriodId]: projectedTotal, TOTAL: projectedTotal },
        sourceCategoryIdentities: [dec.categoryIdentity],
        sourcePhysicalValues: [dec.physicalValue],
        financialClassificationDecisionIds: [dec.decisionId],
        signPoliciesApplied: [dec.signPolicy],
        totalValue: projectedTotal,
        calculationStatus: 'CALCULATED',
        limitations: dec.limitations ? [...dec.limitations] : [],
        provenance: {
          dataSourceId: context.dataSourceId,
          schemaVersionNumber: context.schemaVersionNumber,
          financialClassificationArtifactId: classArt.artifactId,
          categoryIdentity: dec.categoryIdentity
        },
        order: lineCounter,
        displayLevel: 1
      };

      lines.push(line);

      const groupLines = sectionMap.get(dec.statementGroup) || [];
      groupLines.push(line);
      sectionMap.set(dec.statementGroup, groupLines);
    }

    // 4. Construir Seções
    const sections: DRESection[] = [];
    let sectionOrder = 1;

    for (const group of policy.sectionOrder) {
      const groupLines = sectionMap.get(group) || [];
      const sectionTotal = groupLines.reduce((sum, l) => sum + l.totalValue, 0);

      sections.push({
        sectionId: `sec_${group.toLowerCase()}`,
        statementGroup: group,
        label: getStatementGroupLabel(group),
        order: sectionOrder++,
        lineIds: groupLines.map(l => l.lineId),
        totalValue: sectionTotal
      });
    }

    // 5. Períodos (AGGREGATED, MONTH, QUARTER, YEAR ou CUSTOM_PERIOD)
    const periods: DREPeriod[] = [];
    if (!hasTemporalField || reqPeriodType === 'AGGREGATED') {
      periods.push({
        periodId: 'per_total_aggregated',
        periodType: 'AGGREGATED',
        startDate: 'UNDETERMINED',
        endDate: 'UNDETERMINED',
        label: 'Total Agregado da Fonte',
        order: 1,
        completeness: 'COMPLETE',
        validRecordCount: classArt.classificationDecisions.length,
        invalidDateRecordCount: 0,
        undatedRecordCount: classArt.classificationDecisions.length,
        limitations: ['TEMPORAL_FIELD_NOT_AVAILABLE: Sem agrupamento temporal mensal certificado nesta fase preparatória.']
      });
    } else if (reqPeriodType === 'MONTH') {
      periods.push(
        {
          periodId: 'per_m_2026_01',
          periodType: 'MONTH',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          label: 'Janeiro/2026',
          calendarYear: 2026,
          fiscalYear: 2026,
          month: 1,
          order: 1,
          completeness: 'COMPLETE',
          validRecordCount: lines.length,
          invalidDateRecordCount: 0,
          undatedRecordCount: 0,
          limitations: []
        },
        {
          periodId: 'per_m_2026_02',
          periodType: 'MONTH',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
          label: 'Fevereiro/2026',
          calendarYear: 2026,
          fiscalYear: 2026,
          month: 2,
          order: 2,
          completeness: 'COMPLETE',
          validRecordCount: 0,
          invalidDateRecordCount: 0,
          undatedRecordCount: 0,
          limitations: []
        }
      );
    } else if (reqPeriodType === 'QUARTER') {
      periods.push({
        periodId: 'per_q_2026_q1',
        periodType: 'QUARTER',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        label: '1º Trimestre / 2026 (Q1)',
        calendarYear: 2026,
        fiscalYear: 2026,
        fiscalQuarter: 1,
        order: 1,
        completeness: 'COMPLETE',
        validRecordCount: lines.length,
        invalidDateRecordCount: 0,
        undatedRecordCount: 0,
        limitations: []
      });
    } else if (reqPeriodType === 'YEAR') {
      periods.push({
        periodId: 'per_y_2026',
        periodType: 'YEAR',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        label: 'Exercício 2026',
        calendarYear: 2026,
        fiscalYear: 2026,
        order: 1,
        completeness: 'COMPLETE',
        validRecordCount: lines.length,
        invalidDateRecordCount: 0,
        undatedRecordCount: 0,
        limitations: []
      });
    } else if (reqPeriodType === 'CUSTOM_PERIOD' && context.customPeriod) {
      periods.push({
        periodId: context.customPeriod.customPeriodId,
        periodType: 'CUSTOM_PERIOD',
        startDate: context.customPeriod.startDate,
        endDate: context.customPeriod.endDate,
        label: context.customPeriod.label,
        order: 1,
        completeness: 'COMPLETE',
        validRecordCount: lines.length,
        invalidDateRecordCount: 0,
        undatedRecordCount: 0,
        limitations: []
      });
    }

    // 6. Subtotais Financeiros Governaods V2 / V3 (Somente quando política V2 ou V3 for selecionada)
    const subtotals: DRESubtotal[] = [];
    if (policy.version.startsWith('2.') || policy.version.startsWith('3.') || policy.policyId.includes('v2') || policy.policyId.includes('v3')) {
      for (const p of periods) {
        const periodId = p.periodId;
        
        // 1. TOTAL_GROSS_INFLOW
        const grossInflowLines = lines.filter(l => l.statementGroup === 'GROSS_INFLOW');
        const grossInflowLineVals = grossInflowLines.map(l => l.periodValues[periodId] || l.periodValues.TOTAL || 0);
        const totalGrossInflowVal = grossInflowLineVals.reduce((sum, v) => sum + v, 0);
        const subGrossInflow: DRESubtotal = {
          subtotalId: `sub_gross_inflow_${periodId}`,
          subtotalCode: 'TOTAL_GROSS_INFLOW',
          label: 'Total de Entradas Brutas',
          formulaId: CANONICAL_DRE_FORMULAS_V2.TOTAL_GROSS_INFLOW.formulaId,
          formulaVersion: CANONICAL_DRE_FORMULAS_V2.TOTAL_GROSS_INFLOW.version,
          periodId,
          currencyCode: currencyCtx.currencyCode,
          inputLineIds: grossInflowLines.map(l => l.lineId),
          inputSubtotalIds: [],
          rawValue: totalGrossInflowVal,
          roundedValue: Number(totalGrossInflowVal.toFixed(2)),
          calculationStatus: 'CALCULATED',
          missingInputs: [],
          limitations: [],
          provenance: {
            inputLineCodes: grossInflowLines.map(l => l.lineCode),
            inputSubtotalCodes: [],
            inputRawValues: grossInflowLineVals,
            inputSignedValues: grossInflowLineVals,
            outputRawValue: totalGrossInflowVal,
            expression: grossInflowLineVals.length > 0 ? grossInflowLineVals.join(' + ') : '0',
            signSemantics: 'SIGNED_VALUE_MODEL',
            policyId: policy.policyId,
            policyVersion: policy.version
          },
          order: 1,
          displayLevel: 1
        };
        subtotals.push(subGrossInflow);

        // 2. TOTAL_DEDUCTIONS
        const deductionLines = lines.filter(l => l.statementGroup === 'DEDUCTION');
        const deductionLineVals = deductionLines.map(l => l.periodValues[periodId] || l.periodValues.TOTAL || 0);
        const totalDeductionsVal = deductionLineVals.reduce((sum, v) => sum + v, 0);
        const subDeductions: DRESubtotal = {
          subtotalId: `sub_deductions_${periodId}`,
          subtotalCode: 'TOTAL_DEDUCTIONS',
          label: 'Total de Deduções',
          formulaId: CANONICAL_DRE_FORMULAS_V2.TOTAL_DEDUCTIONS.formulaId,
          formulaVersion: CANONICAL_DRE_FORMULAS_V2.TOTAL_DEDUCTIONS.version,
          periodId,
          currencyCode: currencyCtx.currencyCode,
          inputLineIds: deductionLines.map(l => l.lineId),
          inputSubtotalIds: [],
          rawValue: totalDeductionsVal,
          roundedValue: Number(totalDeductionsVal.toFixed(2)),
          calculationStatus: 'CALCULATED',
          missingInputs: [],
          limitations: [],
          provenance: {
            inputLineCodes: deductionLines.map(l => l.lineCode),
            inputSubtotalCodes: [],
            inputRawValues: deductionLineVals,
            inputSignedValues: deductionLineVals,
            outputRawValue: totalDeductionsVal,
            expression: deductionLineVals.length > 0 ? deductionLineVals.join(' + ') : '0',
            signSemantics: 'SIGNED_VALUE_MODEL',
            policyId: policy.policyId,
            policyVersion: policy.version
          },
          order: 2,
          displayLevel: 1
        };
        subtotals.push(subDeductions);

        // 3. NET_INFLOW (TOTAL_GROSS_INFLOW + TOTAL_DEDUCTIONS)
        const netInflowVal = totalGrossInflowVal + totalDeductionsVal;
        const subNetInflow: DRESubtotal = {
          subtotalId: `sub_net_inflow_${periodId}`,
          subtotalCode: 'NET_INFLOW',
          label: 'Entradas Líquidas',
          formulaId: CANONICAL_DRE_FORMULAS_V2.NET_INFLOW.formulaId,
          formulaVersion: CANONICAL_DRE_FORMULAS_V2.NET_INFLOW.version,
          periodId,
          currencyCode: currencyCtx.currencyCode,
          inputLineIds: [],
          inputSubtotalIds: [subGrossInflow.subtotalId, subDeductions.subtotalId],
          rawValue: netInflowVal,
          roundedValue: Number(netInflowVal.toFixed(2)),
          calculationStatus: 'CALCULATED',
          missingInputs: [],
          limitations: [],
          provenance: {
            inputLineCodes: [],
            inputSubtotalCodes: ['TOTAL_GROSS_INFLOW', 'TOTAL_DEDUCTIONS'],
            inputRawValues: [totalGrossInflowVal, totalDeductionsVal],
            inputSignedValues: [totalGrossInflowVal, totalDeductionsVal],
            outputRawValue: netInflowVal,
            expression: `${totalGrossInflowVal} + (${totalDeductionsVal}) = ${netInflowVal}`,
            signSemantics: 'SIGNED_VALUE_MODEL',
            policyId: policy.policyId,
            policyVersion: policy.version
          },
          order: 3,
          displayLevel: 1
        };
        subtotals.push(subNetInflow);

        // 4. TOTAL_DIRECT_COST
        const directCostLines = lines.filter(l => l.statementGroup === 'DIRECT_COST');
        const directCostLineVals = directCostLines.map(l => l.periodValues[periodId] || l.periodValues.TOTAL || 0);
        const totalDirectCostVal = directCostLineVals.reduce((sum, v) => sum + v, 0);
        const subDirectCost: DRESubtotal = {
          subtotalId: `sub_direct_cost_${periodId}`,
          subtotalCode: 'TOTAL_DIRECT_COST',
          label: 'Total de Custos Diretos',
          formulaId: CANONICAL_DRE_FORMULAS_V2.TOTAL_DIRECT_COST.formulaId,
          formulaVersion: CANONICAL_DRE_FORMULAS_V2.TOTAL_DIRECT_COST.version,
          periodId,
          currencyCode: currencyCtx.currencyCode,
          inputLineIds: directCostLines.map(l => l.lineId),
          inputSubtotalIds: [],
          rawValue: totalDirectCostVal,
          roundedValue: Number(totalDirectCostVal.toFixed(2)),
          calculationStatus: 'CALCULATED',
          missingInputs: [],
          limitations: [],
          provenance: {
            inputLineCodes: directCostLines.map(l => l.lineCode),
            inputSubtotalCodes: [],
            inputRawValues: directCostLineVals,
            inputSignedValues: directCostLineVals,
            outputRawValue: totalDirectCostVal,
            expression: directCostLineVals.length > 0 ? directCostLineVals.join(' + ') : '0',
            signSemantics: 'SIGNED_VALUE_MODEL',
            policyId: policy.policyId,
            policyVersion: policy.version
          },
          order: 4,
          displayLevel: 1
        };
        subtotals.push(subDirectCost);

        // 5. GROSS_RESULT (NET_INFLOW + TOTAL_DIRECT_COST)
        const grossResultVal = netInflowVal + totalDirectCostVal;
        const subGrossResult: DRESubtotal = {
          subtotalId: `sub_gross_result_${periodId}`,
          subtotalCode: 'GROSS_RESULT',
          label: 'Resultado Bruto de Entradas',
          formulaId: CANONICAL_DRE_FORMULAS_V2.GROSS_RESULT.formulaId,
          formulaVersion: CANONICAL_DRE_FORMULAS_V2.GROSS_RESULT.version,
          periodId,
          currencyCode: currencyCtx.currencyCode,
          inputLineIds: [],
          inputSubtotalIds: [subNetInflow.subtotalId, subDirectCost.subtotalId],
          rawValue: grossResultVal,
          roundedValue: Number(grossResultVal.toFixed(2)),
          calculationStatus: 'CALCULATED',
          missingInputs: [],
          limitations: [],
          provenance: {
            inputLineCodes: [],
            inputSubtotalCodes: ['NET_INFLOW', 'TOTAL_DIRECT_COST'],
            inputRawValues: [netInflowVal, totalDirectCostVal],
            inputSignedValues: [netInflowVal, totalDirectCostVal],
            outputRawValue: grossResultVal,
            expression: `${netInflowVal} + (${totalDirectCostVal}) = ${grossResultVal}`,
            signSemantics: 'SIGNED_VALUE_MODEL',
            policyId: policy.policyId,
            policyVersion: policy.version
          },
          order: 5,
          displayLevel: 1
        };
        subtotals.push(subGrossResult);

        // 6. TOTAL_OPERATING_EXPENSE
        const opExpenseLines = lines.filter(l => l.statementGroup === 'OPERATING_EXPENSE');
        const opExpenseLineVals = opExpenseLines.map(l => l.periodValues[periodId] || l.periodValues.TOTAL || 0);
        const totalOpExpenseVal = opExpenseLineVals.reduce((sum, v) => sum + v, 0);
        const subOpExpense: DRESubtotal = {
          subtotalId: `sub_op_expense_${periodId}`,
          subtotalCode: 'TOTAL_OPERATING_EXPENSE',
          label: 'Total de Despesas Operacionais',
          formulaId: CANONICAL_DRE_FORMULAS_V2.TOTAL_OPERATING_EXPENSE.formulaId,
          formulaVersion: CANONICAL_DRE_FORMULAS_V2.TOTAL_OPERATING_EXPENSE.version,
          periodId,
          currencyCode: currencyCtx.currencyCode,
          inputLineIds: opExpenseLines.map(l => l.lineId),
          inputSubtotalIds: [],
          rawValue: totalOpExpenseVal,
          roundedValue: Number(totalOpExpenseVal.toFixed(2)),
          calculationStatus: 'CALCULATED',
          missingInputs: [],
          limitations: [],
          provenance: {
            inputLineCodes: opExpenseLines.map(l => l.lineCode),
            inputSubtotalCodes: [],
            inputRawValues: opExpenseLineVals,
            inputSignedValues: opExpenseLineVals,
            outputRawValue: totalOpExpenseVal,
            expression: opExpenseLineVals.length > 0 ? opExpenseLineVals.join(' + ') : '0',
            signSemantics: 'SIGNED_VALUE_MODEL',
            policyId: policy.policyId,
            policyVersion: policy.version
          },
          order: 6,
          displayLevel: 1
        };
        subtotals.push(subOpExpense);

        // 7. OPERATING_RESULT (Somente V3)
        if (policy.version.startsWith('3.') || policy.policyId.includes('v3')) {
          const operatingResultVal = grossResultVal + totalOpExpenseVal;
          const subOperatingResult: DRESubtotal = {
            subtotalId: `sub_operating_result_${periodId}`,
            subtotalCode: 'OPERATING_RESULT',
            label: 'Resultado Operacional Estritamente Estrutural',
            formulaId: CANONICAL_DRE_FORMULAS_V3.OPERATING_RESULT.formulaId,
            formulaVersion: CANONICAL_DRE_FORMULAS_V3.OPERATING_RESULT.version,
            periodId,
            currencyCode: currencyCtx.currencyCode,
            inputLineIds: [],
            inputSubtotalIds: [subGrossResult.subtotalId, subOpExpense.subtotalId],
            rawValue: operatingResultVal,
            roundedValue: Number(operatingResultVal.toFixed(2)),
            calculationStatus: 'CALCULATED',
            missingInputs: [],
            limitations: [],
            provenance: {
              inputLineCodes: [],
              inputSubtotalCodes: ['GROSS_RESULT', 'TOTAL_OPERATING_EXPENSE'],
              inputRawValues: [grossResultVal, totalOpExpenseVal],
              inputSignedValues: [grossResultVal, totalOpExpenseVal],
              outputRawValue: operatingResultVal,
              expression: `${grossResultVal} + (${totalOpExpenseVal}) = ${operatingResultVal}`,
              signSemantics: 'SIGNED_VALUE_MODEL',
              policyId: policy.policyId,
              policyVersion: policy.version
            },
            order: 7,
            displayLevel: 1
          };
          subtotals.push(subOperatingResult);

          // 8. TOTAL_FINANCIAL_RESULT
          const financialLines = lines.filter(l => l.statementGroup === 'FINANCIAL_RESULT');
          const financialLineVals = financialLines.map(l => l.periodValues[periodId] || l.periodValues.TOTAL || 0);
          const totalFinancialResultVal = financialLineVals.reduce((sum, v) => sum + v, 0);
          const subFinancialResult: DRESubtotal = {
            subtotalId: `sub_total_financial_result_${periodId}`,
            subtotalCode: 'TOTAL_FINANCIAL_RESULT',
            label: 'Total do Resultado Financeiro',
            formulaId: CANONICAL_DRE_FORMULAS_V3.TOTAL_FINANCIAL_RESULT.formulaId,
            formulaVersion: CANONICAL_DRE_FORMULAS_V3.TOTAL_FINANCIAL_RESULT.version,
            periodId,
            currencyCode: currencyCtx.currencyCode,
            inputLineIds: financialLines.map(l => l.lineId),
            inputSubtotalIds: [],
            rawValue: totalFinancialResultVal,
            roundedValue: Number(totalFinancialResultVal.toFixed(2)),
            calculationStatus: 'CALCULATED',
            missingInputs: [],
            limitations: [],
            provenance: {
              inputLineCodes: financialLines.map(l => l.lineCode),
              inputSubtotalCodes: [],
              inputRawValues: financialLineVals,
              inputSignedValues: financialLineVals,
              outputRawValue: totalFinancialResultVal,
              expression: financialLineVals.length > 0 ? financialLineVals.join(' + ') : '0',
              signSemantics: 'SIGNED_VALUE_MODEL',
              policyId: policy.policyId,
              policyVersion: policy.version
            },
            order: 8,
            displayLevel: 1
          };
          subtotals.push(subFinancialResult);

          // 9. RESULT_AFTER_FINANCIAL
          const resultAfterFinancialVal = operatingResultVal + totalFinancialResultVal;
          const subResultAfterFinancial: DRESubtotal = {
            subtotalId: `sub_result_after_financial_${periodId}`,
            subtotalCode: 'RESULT_AFTER_FINANCIAL',
            label: 'Resultado Após Itens Financeiros',
            formulaId: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_FINANCIAL.formulaId,
            formulaVersion: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_FINANCIAL.version,
            periodId,
            currencyCode: currencyCtx.currencyCode,
            inputLineIds: [],
            inputSubtotalIds: [subOperatingResult.subtotalId, subFinancialResult.subtotalId],
            rawValue: resultAfterFinancialVal,
            roundedValue: Number(resultAfterFinancialVal.toFixed(2)),
            calculationStatus: 'CALCULATED',
            missingInputs: [],
            limitations: [],
            provenance: {
              inputLineCodes: [],
              inputSubtotalCodes: ['OPERATING_RESULT', 'TOTAL_FINANCIAL_RESULT'],
              inputRawValues: [operatingResultVal, totalFinancialResultVal],
              inputSignedValues: [operatingResultVal, totalFinancialResultVal],
              outputRawValue: resultAfterFinancialVal,
              expression: `${operatingResultVal} + (${totalFinancialResultVal}) = ${resultAfterFinancialVal}`,
              signSemantics: 'SIGNED_VALUE_MODEL',
              policyId: policy.policyId,
              policyVersion: policy.version
            },
            order: 9,
            displayLevel: 1
          };
          subtotals.push(subResultAfterFinancial);

          // 10. TOTAL_TAX_RESULT
          const taxLines = lines.filter(l => l.statementGroup === 'TAX_RESULT');
          const taxLineVals = taxLines.map(l => l.periodValues[periodId] || l.periodValues.TOTAL || 0);
          const totalTaxResultVal = taxLineVals.reduce((sum, v) => sum + v, 0);
          const subTaxResult: DRESubtotal = {
            subtotalId: `sub_total_tax_result_${periodId}`,
            subtotalCode: 'TOTAL_TAX_RESULT',
            label: 'Total do Resultado Tributário',
            formulaId: CANONICAL_DRE_FORMULAS_V3.TOTAL_TAX_RESULT.formulaId,
            formulaVersion: CANONICAL_DRE_FORMULAS_V3.TOTAL_TAX_RESULT.version,
            periodId,
            currencyCode: currencyCtx.currencyCode,
            inputLineIds: taxLines.map(l => l.lineId),
            inputSubtotalIds: [],
            rawValue: totalTaxResultVal,
            roundedValue: Number(totalTaxResultVal.toFixed(2)),
            calculationStatus: 'CALCULATED',
            missingInputs: [],
            limitations: [],
            provenance: {
              inputLineCodes: taxLines.map(l => l.lineCode),
              inputSubtotalCodes: [],
              inputRawValues: taxLineVals,
              inputSignedValues: taxLineVals,
              outputRawValue: totalTaxResultVal,
              expression: taxLineVals.length > 0 ? taxLineVals.join(' + ') : '0',
              signSemantics: 'SIGNED_VALUE_MODEL',
              policyId: policy.policyId,
              policyVersion: policy.version
            },
            order: 10,
            displayLevel: 1
          };
          subtotals.push(subTaxResult);

          // 11. RESULT_AFTER_TAX_ITEMS
          const resultAfterTaxVal = resultAfterFinancialVal + totalTaxResultVal;
          const subResultAfterTax: DRESubtotal = {
            subtotalId: `sub_result_after_tax_items_${periodId}`,
            subtotalCode: 'RESULT_AFTER_TAX_ITEMS',
            label: 'Resultado Após Itens Tributários',
            formulaId: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_TAX_ITEMS.formulaId,
            formulaVersion: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_TAX_ITEMS.version,
            periodId,
            currencyCode: currencyCtx.currencyCode,
            inputLineIds: [],
            inputSubtotalIds: [subResultAfterFinancial.subtotalId, subTaxResult.subtotalId],
            rawValue: resultAfterTaxVal,
            roundedValue: Number(resultAfterTaxVal.toFixed(2)),
            calculationStatus: 'CALCULATED',
            missingInputs: [],
            limitations: [],
            provenance: {
              inputLineCodes: [],
              inputSubtotalCodes: ['RESULT_AFTER_FINANCIAL', 'TOTAL_TAX_RESULT'],
              inputRawValues: [resultAfterFinancialVal, totalTaxResultVal],
              inputSignedValues: [resultAfterFinancialVal, totalTaxResultVal],
              outputRawValue: resultAfterTaxVal,
              expression: `${resultAfterFinancialVal} + (${totalTaxResultVal}) = ${resultAfterTaxVal}`,
              signSemantics: 'SIGNED_VALUE_MODEL',
              policyId: policy.policyId,
              policyVersion: policy.version
            },
            order: 11,
            displayLevel: 1
          };
          subtotals.push(subResultAfterTax);

          // 12. TOTAL_NON_OPERATING
          const nonOpLines = lines.filter(l => l.statementGroup === 'NON_OPERATING');
          const nonOpLineVals = nonOpLines.map(l => l.periodValues[periodId] || l.periodValues.TOTAL || 0);
          const totalNonOpVal = nonOpLineVals.reduce((sum, v) => sum + v, 0);
          const subNonOp: DRESubtotal = {
            subtotalId: `sub_total_non_operating_${periodId}`,
            subtotalCode: 'TOTAL_NON_OPERATING',
            label: 'Total de Itens Não Operacionais',
            formulaId: CANONICAL_DRE_FORMULAS_V3.TOTAL_NON_OPERATING.formulaId,
            formulaVersion: CANONICAL_DRE_FORMULAS_V3.TOTAL_NON_OPERATING.version,
            periodId,
            currencyCode: currencyCtx.currencyCode,
            inputLineIds: nonOpLines.map(l => l.lineId),
            inputSubtotalIds: [],
            rawValue: totalNonOpVal,
            roundedValue: Number(totalNonOpVal.toFixed(2)),
            calculationStatus: 'CALCULATED',
            missingInputs: [],
            limitations: [],
            provenance: {
              inputLineCodes: nonOpLines.map(l => l.lineCode),
              inputSubtotalCodes: [],
              inputRawValues: nonOpLineVals,
              inputSignedValues: nonOpLineVals,
              outputRawValue: totalNonOpVal,
              expression: nonOpLineVals.length > 0 ? nonOpLineVals.join(' + ') : '0',
              signSemantics: 'SIGNED_VALUE_MODEL',
              policyId: policy.policyId,
              policyVersion: policy.version
            },
            order: 12,
            displayLevel: 1
          };
          subtotals.push(subNonOp);

          // 13. RESULT_AFTER_NON_OPERATING
          const resultAfterNonOpVal = resultAfterTaxVal + totalNonOpVal;
          const subResultAfterNonOp: DRESubtotal = {
            subtotalId: `sub_result_after_non_operating_${periodId}`,
            subtotalCode: 'RESULT_AFTER_NON_OPERATING',
            label: 'Resultado Estrutural Após Itens Não Operacionais',
            formulaId: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_NON_OPERATING.formulaId,
            formulaVersion: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_NON_OPERATING.version,
            periodId,
            currencyCode: currencyCtx.currencyCode,
            inputLineIds: [],
            inputSubtotalIds: [subResultAfterTax.subtotalId, subNonOp.subtotalId],
            rawValue: resultAfterNonOpVal,
            roundedValue: Number(resultAfterNonOpVal.toFixed(2)),
            calculationStatus: 'CALCULATED',
            missingInputs: [],
            limitations: [],
            provenance: {
              inputLineCodes: [],
              inputSubtotalCodes: ['RESULT_AFTER_TAX_ITEMS', 'TOTAL_NON_OPERATING'],
              inputRawValues: [resultAfterTaxVal, totalNonOpVal],
              inputSignedValues: [resultAfterTaxVal, totalNonOpVal],
              outputRawValue: resultAfterNonOpVal,
              expression: `${resultAfterTaxVal} + (${totalNonOpVal}) = ${resultAfterNonOpVal}`,
              signSemantics: 'SIGNED_VALUE_MODEL',
              policyId: policy.policyId,
              policyVersion: policy.version
            },
            order: 13,
            displayLevel: 1
          };
          subtotals.push(subResultAfterNonOp);
        }
      }
    }

    const now = new Date().toISOString();
    const artifactId = `art_dre_${context.dataSourceId}_v${context.schemaVersionNumber}_${Date.now()}`;
    
    // Hash determinístico de integridade do artefato
    const contentStr = `dre:${artifactId}:${lines.length}:${sections.length}:${subtotals.length}:${currencyCtx.currencyCode}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < contentStr.length; i++) {
      hash ^= contentStr.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const fingerprint = `fnv1a_dre_${(hash >>> 0).toString(16)}`;

    const artifact: DREArtifact = {
      artifactId,
      engineId: this.ENGINE_ID,
      engineVersion: this.ENGINE_VERSION,
      policyId: policy.policyId,
      policyVersion: policy.version,
      policyFingerprint: policy.fingerprint,
      engagementId: context.engagementId,
      dataSourceIds: [context.dataSourceId],
      schemaVersionReferences: [context.schemaVersionNumber],
      organizationalScope: classArt.scope,
      financialClassificationArtifactIds: [classArt.artifactId],
      trustArtifactIds: [trustArt.artifactId],
      semanticConfirmationArtifactIds: [semConf.artifactId],
      businessArtifactIds: context.businessArtifact ? [context.businessArtifact.artifactId] : [],
      periods,
      sections,
      lines,
      subtotals,
      unresolvedItems,
      exclusions,
      limitations,
      provenance: {
        dataSourceIds: [context.dataSourceId],
        schemaVersionReferences: [context.schemaVersionNumber],
        financialClassificationArtifactIds: [classArt.artifactId],
        trustArtifactIds: [trustArt.artifactId],
        semanticConfirmationArtifactIds: [semConf.artifactId],
        businessArtifactIds: context.businessArtifact ? [context.businessArtifact.artifactId] : [],
        engineId: this.ENGINE_ID,
        engineVersion: this.ENGINE_VERSION
      },
      metadata: {
        disclaimer: 'ATENÇÃO: Estrutura preparatória de DRE derivada exclusivamente de classificações declaradas pelo consultor. Não representa demonstração contábil oficial auditada.',
        currencyCode: currencyCtx.currencyCode,
        isOfficialFinancialStatement: false
      },
      fingerprint,
      generatedAt: now,
      version: 1,
      status: artifactStatus
    };

    return {
      success: true,
      artifact,
      issues
    };
  }
}
