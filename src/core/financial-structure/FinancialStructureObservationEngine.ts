import {
  IAsterionBusinessInsightEngine,
  BusinessInsightEngineMetadata,
  BusinessInsightExecutionContext,
  BusinessInsightExecutionResult,
  BusinessInsightPolicyGuard,
  BUSINESS_INSIGHT_SDK_VERSION,
  BusinessArtifactFingerprintBuilder,
  BusinessArtifact,
  BusinessObservation,
  CalculatedMetric,
  BusinessComparison,
  UnresolvedBusinessQuestion,
  MetricCalculationStatus
} from '../business-insight';
import { FinancialObservationInput } from './FinancialStructureContracts';

export class FinancialStructureObservationEngine implements IAsterionBusinessInsightEngine {
  readonly metadata: BusinessInsightEngineMetadata = Object.freeze({
    engineId: 'financial_structure_observation_engine_v1',
    name: 'Financial Structure Observation Engine',
    version: '1.0.0',
    minimumSdkVersion: '1.0.0',
    supportedSdkVersions: ['1.0.0'],
    supportedCapabilities: ['DESCRIPTIVE_ANALYSIS', 'CONCENTRATION_ANALYSIS'] as const,
    requiredTrustUsage: 'FINANCIAL_ANALYSIS',
    supportedScopes: ['DATA_SOURCE', 'ENGAGEMENT', 'GROUP', 'COMPANY', 'UNIT', 'CONTAINER'] as const,
    stability: 'STABLE' as const
  });

  public async execute(context: BusinessInsightExecutionContext): Promise<BusinessInsightExecutionResult> {
    const startTime = Date.now();

    // 1. Barreira Obrigatória de Governança
    const requiredUsage = (context.options?.trustUsage as any) || this.metadata.requiredTrustUsage;
    BusinessInsightPolicyGuard.validateExecution(context, requiredUsage);

    const { trustArtifact, scope } = context;
    const input: FinancialObservationInput = context.options?.financialInput || {
      user: context.user,
      scope: context.scope,
      trustArtifact: context.trustArtifact,
      semanticConfirmationDecisions: [],
      records: []
    };

    // 2. Identificação de Campos Elegíveis Semanticamente Confirmados
    const monetaryDecisions = input.semanticConfirmationDecisions.filter(
      d => (d.decision === 'CONFIRMED' || d.decision === 'CUSTOM_INTERPRETATION') &&
           (d.customPayload?.category === 'MONETARY_MEASURE' || d.consultantLabel?.toUpperCase().includes('MONETARY') || (d as any).confirmedInterpretation?.category === 'MONETARY_MEASURE' || (d as any).suggestedCategory === 'MONETARY_MEASURE')
    );

    const categoricalDecisions = input.semanticConfirmationDecisions.filter(
      d => (d.decision === 'CONFIRMED' || d.decision === 'CUSTOM_INTERPRETATION') &&
           (d.customPayload?.category === 'CATEGORICAL' || d.consultantLabel?.toUpperCase().includes('CATEGORICAL') || (d as any).confirmedInterpretation?.category === 'CATEGORICAL' || (d as any).suggestedCategory === 'CATEGORICAL')
    );

    const temporalDecisions = input.semanticConfirmationDecisions.filter(
      d => (d.decision === 'CONFIRMED' || d.decision === 'CUSTOM_INTERPRETATION') &&
           (d.customPayload?.category === 'TEMPORAL' || d.consultantLabel?.toUpperCase().includes('TEMPORAL') || (d as any).confirmedInterpretation?.category === 'TEMPORAL' || (d as any).suggestedCategory === 'TEMPORAL')
    );

    const observations: BusinessObservation[] = [];
    const calculatedMetrics: CalculatedMetric[] = [];
    const comparisons: BusinessComparison[] = [];
    const unresolvedQuestions: UnresolvedBusinessQuestion[] = [];
    const globalLimitations: string[] = [...trustArtifact.limitations];

    // Registro da Contagem de Registros Financeiros Avaliados
    const totalRecords = input.records.length;
    observations.push({
      observationId: `obs_rec_count_${Date.now()}`,
      category: 'RECORD_COUNT',
      title: 'Contagem de Registros Financeiros Avaliados',
      description: `Foram avaliados ${totalRecords} registros neutros na fonte governada.`,
      scope,
      status: 'OBSERVED',
      calculatedValue: totalRecords,
      supportingMetricIds: [`metric_rec_count_${Date.now()}`],
      supportingEvidenceIds: [],
      trustUsage: requiredUsage,
      trustState: trustArtifact.trustAssessment.overallState,
      assumptions: [],
      limitations: globalLimitations,
      provenance: {
        dataSourceId: trustArtifact.dataSourceId,
        schemaVersionNumber: trustArtifact.schemaVersionNumber,
        trustArtifactId: trustArtifact.artifactId,
        trustUsage: requiredUsage,
        engineId: this.metadata.engineId,
        engineVersion: this.metadata.version
      }
    });

    calculatedMetrics.push({
      metricId: `metric_rec_count_${Date.now()}`,
      metricDefinitionId: 'FINANCIAL_RECORD_COUNT',
      definitionVersion: '1.0.0',
      name: 'Quantidade de Registros Avaliados',
      value: totalRecords,
      unit: 'registros',
      scope,
      formulaReference: 'COUNT(records)',
      inputFieldReferences: [],
      semanticDecisionReferences: [],
      evidenceIds: [],
      trustArtifactId: trustArtifact.artifactId,
      trustUsage: requiredUsage,
      calculationStatus: 'CALCULATED',
      limitations: globalLimitations,
      provenance: {
        dataSourceId: trustArtifact.dataSourceId,
        schemaVersionNumber: trustArtifact.schemaVersionNumber,
        trustArtifactId: trustArtifact.artifactId,
        trustUsage: requiredUsage,
        metricDefinitionId: 'FINANCIAL_RECORD_COUNT',
        definitionVersion: '1.0.0'
      }
    });

    // 3. Processamento de Campos Monetários Confirmados
    for (const mDecision of monetaryDecisions) {
      const fieldName = mDecision.physicalName;
      let totalSum = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      let nullCount = 0;
      let validCount = 0;
      let minVal = Number.POSITIVE_INFINITY;
      let maxVal = Number.NEGATIVE_INFINITY;

      for (const rec of input.records) {
        const val = rec.values[fieldName];
        if (val === null || val === undefined || val === '') {
          nullCount++;
          continue;
        }
        const num = typeof val === 'number' ? val : Number(val);
        if (Number.isNaN(num) || !Number.isFinite(num)) {
          nullCount++;
          continue;
        }

        validCount++;
        totalSum += num;
        if (num > 0) positiveCount++;
        if (num < 0) negativeCount++;
        if (num < minVal) minVal = num;
        if (num > maxVal) maxVal = num;
      }

      if (minVal === Number.POSITIVE_INFINITY) minVal = 0;
      if (maxVal === Number.NEGATIVE_INFINITY) maxVal = 0;

      const avgVal = validCount > 0 ? totalSum / validCount : 0;

      // Cálculo das 9 métricas obrigatórias da especificação
      const metricSpecs: Array<{ id: string; name: string; val: number; unit: string; formula: string }> = [
        { id: 'FINANCIAL_RECORD_COUNT', name: 'Quantidade de Registros Avaliados', val: totalRecords, unit: 'registros', formula: 'COUNT(records)' },
        { id: 'MONETARY_TOTAL', name: `Soma Monetária Observada (${fieldName})`, val: totalSum, unit: 'BRL', formula: `SUM(${fieldName})` },
        { id: 'MONETARY_AVERAGE', name: `Média Monetária Observada (${fieldName})`, val: avgVal, unit: 'BRL', formula: `AVG(${fieldName})` },
        { id: 'MONETARY_MINIMUM', name: `Valor Mínimo Observado (${fieldName})`, val: minVal, unit: 'BRL', formula: `MIN(${fieldName})` },
        { id: 'MONETARY_MAXIMUM', name: `Valor Máximo Observado (${fieldName})`, val: maxVal, unit: 'BRL', formula: `MAX(${fieldName})` },
        { id: 'POSITIVE_VALUE_COUNT', name: `Quantidade de Valores Positivos (${fieldName})`, val: positiveCount, unit: 'registros', formula: `COUNT(${fieldName} > 0)` },
        { id: 'NEGATIVE_VALUE_COUNT', name: `Quantidade de Valores Negativos (${fieldName})`, val: negativeCount, unit: 'registros', formula: `COUNT(${fieldName} < 0)` },
        { id: 'NULL_VALUE_COUNT', name: `Quantidade de Valores Nulos/Inválidos (${fieldName})`, val: nullCount, unit: 'registros', formula: `COUNT(${fieldName} IS NULL)` }
      ];

      const fieldMetricIds: string[] = [];

      for (const spec of metricSpecs) {
        const mId = `metric_${spec.id.toLowerCase()}_${fieldName}_${Date.now()}`;
        fieldMetricIds.push(mId);
        calculatedMetrics.push({
          metricId: mId,
          metricDefinitionId: spec.id,
          definitionVersion: '1.0.0',
          name: spec.name,
          value: spec.val,
          unit: spec.unit,
          scope,
          formulaReference: spec.formula,
          inputFieldReferences: [fieldName],
          semanticDecisionReferences: [(mDecision as any).decisionId || mDecision.columnId],
          evidenceIds: [],
          trustArtifactId: trustArtifact.artifactId,
          trustUsage: requiredUsage,
          calculationStatus: validCount > 0 || spec.id === 'FINANCIAL_RECORD_COUNT' ? 'CALCULATED' : 'NOT_CALCULABLE',
          limitations: globalLimitations,
          provenance: {
            dataSourceId: trustArtifact.dataSourceId,
            schemaVersionNumber: trustArtifact.schemaVersionNumber,
            trustArtifactId: trustArtifact.artifactId,
            trustUsage: requiredUsage,
            metricDefinitionId: spec.id,
            definitionVersion: '1.0.0'
          }
        });
      }

      // Processamento de Cobertura Temporal (PERIOD_COVERAGE) se houver campo temporal confirmado
      if (temporalDecisions.length > 0) {
        const tempFieldName = temporalDecisions[0].physicalName;
        const dates: string[] = [];

        for (const rec of input.records) {
          const dtVal = rec.values[tempFieldName];
          if (dtVal !== null && dtVal !== undefined && dtVal !== '') {
            dates.push(String(dtVal));
          }
        }

        dates.sort();
        const minDate = dates.length > 0 ? dates[0] : 'N/A';
        const maxDate = dates.length > 0 ? dates[dates.length - 1] : 'N/A';

        const covMetricId = `metric_period_coverage_${fieldName}_${Date.now()}`;
        fieldMetricIds.push(covMetricId);
        calculatedMetrics.push({
          metricId: covMetricId,
          metricDefinitionId: 'PERIOD_COVERAGE',
          definitionVersion: '1.0.0',
          name: `Cobertura Temporal Observada (${tempFieldName})`,
          value: dates.length,
          unit: 'dias_ou_registros',
          period: `${minDate} a ${maxDate}`,
          scope,
          formulaReference: `RANGE(${tempFieldName})`,
          inputFieldReferences: [tempFieldName],
          semanticDecisionReferences: [(temporalDecisions[0] as any).decisionId || temporalDecisions[0].columnId],
          evidenceIds: [],
          trustArtifactId: trustArtifact.artifactId,
          trustUsage: requiredUsage,
          calculationStatus: dates.length > 0 ? 'CALCULATED' : 'NOT_CALCULABLE',
          limitations: globalLimitations,
          provenance: {
            dataSourceId: trustArtifact.dataSourceId,
            schemaVersionNumber: trustArtifact.schemaVersionNumber,
            trustArtifactId: trustArtifact.artifactId,
            trustUsage: requiredUsage,
            metricDefinitionId: 'PERIOD_COVERAGE',
            definitionVersion: '1.0.0'
          }
        });
      }

      observations.push({
        observationId: `obs_monetary_summary_${fieldName}_${Date.now()}`,
        category: 'MONETARY_STRUCTURE',
        title: `Estrutura Monetária do Campo ${fieldName}`,
        description: `Observados ${validCount} valores válidos no campo ${fieldName}. Soma: ${totalSum.toFixed(2)}, Média: ${avgVal.toFixed(2)}, Positivos: ${positiveCount}, Negativos: ${negativeCount}, Nulos: ${nullCount}.`,
        scope,
        status: 'OBSERVED',
        calculatedValue: totalSum,
        unit: 'BRL',
        supportingMetricIds: fieldMetricIds,
        supportingEvidenceIds: [],
        trustUsage: requiredUsage,
        trustState: trustArtifact.trustAssessment.overallState,
        assumptions: [],
        limitations: globalLimitations,
        provenance: {
          dataSourceId: trustArtifact.dataSourceId,
          schemaVersionNumber: trustArtifact.schemaVersionNumber,
          trustArtifactId: trustArtifact.artifactId,
          trustUsage: requiredUsage,
          engineId: this.metadata.engineId,
          engineVersion: this.metadata.version
        }
      });

      // 3.1 CONCENTRATION_ANALYSIS Determinística (Top N por Categoria)
      if (categoricalDecisions.length > 0) {
        for (const catDecision of categoricalDecisions) {
          const catFieldName = catDecision.physicalName;
          const topN = input.options?.topN || 5;

          const categoryTotals = new Map<string, number>();

          for (const rec of input.records) {
            const catVal = rec.values[catFieldName];
            const numVal = rec.values[fieldName];

            if (catVal !== null && catVal !== undefined && catVal !== '' && typeof numVal === 'number' && Number.isFinite(numVal)) {
              const catKey = String(catVal);
              categoryTotals.set(catKey, (categoryTotals.get(catKey) || 0) + numVal);
            }
          }

          // Ordenação determinística por valor decrescente, depois nome alfabético para desempate
          const sortedCategories = Array.from(categoryTotals.entries()).sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
          });

          const totalCategorySum = Array.from(categoryTotals.values()).reduce((acc, curr) => acc + curr, 0);

          let accumulatedSum = 0;
          const topNCategories = sortedCategories.slice(0, topN);

          const concentrationItems = topNCategories.map(([categoryName, amount]) => {
            accumulatedSum += amount;
            const individualShare = totalCategorySum > 0 ? (amount / totalCategorySum) * 100 : 0;
            const accumulatedShare = totalCategorySum > 0 ? (accumulatedSum / totalCategorySum) * 100 : 0;

            // Garantia estrita contra NaN e Infinity
            const safeIndividualShare = Number.isFinite(individualShare) ? Number(individualShare.toFixed(2)) : 0;
            const safeAccumulatedShare = Number.isFinite(accumulatedShare) ? Number(accumulatedShare.toFixed(2)) : 0;

            return {
              categoryName,
              amount: Number(amount.toFixed(2)),
              individualSharePercent: safeIndividualShare,
              accumulatedSharePercent: safeAccumulatedShare
            };
          });

          const totalTopNAmount = topNCategories.reduce((sum, [_, amt]) => sum + amt, 0);
          const topNSharePercent = totalCategorySum > 0 ? Number(((totalTopNAmount / totalCategorySum) * 100).toFixed(2)) : 0;

          observations.push({
            observationId: `obs_concentration_${catFieldName}_${fieldName}_${Date.now()}`,
            category: 'CONCENTRATION_ANALYSIS',
            title: `Concentração de ${fieldName} por ${catFieldName} (Top ${topN})`,
            description: `As Top ${topNCategories.length} categorias do campo ${catFieldName} concentram ${topNSharePercent}% do total de ${fieldName}. Top itens: ${concentrationItems.map(i => `${i.categoryName}: ${i.individualSharePercent}%`).join(', ')}.`,
            scope,
            status: 'OBSERVED',
            calculatedValue: totalTopNAmount,
            unit: 'BRL',
            supportingMetricIds: fieldMetricIds,
            supportingEvidenceIds: [],
            trustUsage: requiredUsage,
            trustState: trustArtifact.trustAssessment.overallState,
            assumptions: [],
            limitations: [
              ...globalLimitations,
              `Análise de concentração limitada aos Top ${topN} itens de ${catFieldName}.`,
              'A concentração reflete puramente a distribuição aritmética e não implica inferência automatizada de risco de dependência.'
            ],
            provenance: {
              dataSourceId: trustArtifact.dataSourceId,
              schemaVersionNumber: trustArtifact.schemaVersionNumber,
              trustArtifactId: trustArtifact.artifactId,
              trustUsage: requiredUsage,
              engineId: this.metadata.engineId,
              engineVersion: this.metadata.version
            }
          });
        }
      }
    }

    // 4. Pergunta Não Resolvida se nenhum campo monetário tiver sido confirmado
    if (monetaryDecisions.length === 0) {
      unresolvedQuestions.push({
        questionId: `unres_no_monetary_${Date.now()}`,
        category: 'SEMANTIC_CONFIRMATION',
        question: 'A medida monetária confirmada representa entradas, saídas ou saldo?',
        reason: 'Nenhum campo com confirmação semântica da categoria MONETARY_MEASURE foi localizado para cálculo formal.',
        scope,
        materiality: 'HIGH',
        relatedObservationIds: [],
        relatedMetricIds: [],
        supportingEvidenceIds: [],
        trustArtifactId: trustArtifact.artifactId,
        limitations: globalLimitations,
        status: 'OPEN',
        provenance: {
          dataSourceId: trustArtifact.dataSourceId,
          trustArtifactId: trustArtifact.artifactId,
          trustUsage: requiredUsage,
          engineId: this.metadata.engineId,
          engineVersion: this.metadata.version
        }
      });
    }

    const duration = Date.now() - startTime;

    const artifactPartial = {
      artifactId: `bus_fin_obs_${trustArtifact.dataSourceId}_${Date.now()}`,
      engineId: this.metadata.engineId,
      engineVersion: this.metadata.version,
      sdkVersion: BUSINESS_INSIGHT_SDK_VERSION,
      dataSourceIds: [trustArtifact.dataSourceId],
      engagementId: trustArtifact.engagementId,
      schemaVersionReferences: [{ dataSourceId: trustArtifact.dataSourceId, schemaVersionNumber: trustArtifact.schemaVersionNumber }],
      trustArtifactIds: [trustArtifact.artifactId],
      semanticConfirmationArtifactIds: trustArtifact.semanticConfirmationArtifactId ? [trustArtifact.semanticConfirmationArtifactId] : [],

      analysisScope: scope,
      businessObservations: Object.freeze(observations),
      calculatedMetrics: Object.freeze(calculatedMetrics),
      comparisons: Object.freeze(comparisons),
      findings: Object.freeze([]), // Mínimos/Conservadores
      risks: Object.freeze([]), // PROIBIDO GERAR RISCO EMPRESARIAL
      opportunities: Object.freeze([]), // PROIBIDO GERAR OPORTUNIDADE
      actionHypotheses: Object.freeze([]), // PROIBIDO GERAR AÇÃO
      unresolvedBusinessQuestions: Object.freeze(unresolvedQuestions),
      limitations: Object.freeze(globalLimitations),

      provenance: Object.freeze({
        engineId: this.metadata.engineId,
        engineVersion: this.metadata.version,
        sdkVersion: BUSINESS_INSIGHT_SDK_VERSION,
        dataSourceIds: [trustArtifact.dataSourceId],
        engagementId: trustArtifact.engagementId,
        schemaVersionReferences: [{ dataSourceId: trustArtifact.dataSourceId, schemaVersionNumber: trustArtifact.schemaVersionNumber }],
        trustArtifactIds: [trustArtifact.artifactId],
        semanticConfirmationArtifactIds: trustArtifact.semanticConfirmationArtifactId ? [trustArtifact.semanticConfirmationArtifactId] : [],
        policyId: trustArtifact.provenance.policyId,
        policyVersion: trustArtifact.provenance.policyVersion
      }),
      metadata: Object.freeze({
        engineId: this.metadata.engineId,
        engineVersion: this.metadata.version,
        sdkVersion: BUSINESS_INSIGHT_SDK_VERSION,
        capabilitiesUsed: categoricalDecisions.length > 0 
          ? ['DESCRIPTIVE_ANALYSIS' as const, 'CONCENTRATION_ANALYSIS' as const] 
          : ['DESCRIPTIVE_ANALYSIS' as const],
        executionDurationMs: duration,
        generatedAt: new Date().toISOString()
      }),
      generatedAt: new Date().toISOString(),
      version: 1
    };

    const fingerprintMeta = BusinessArtifactFingerprintBuilder.buildFingerprintMetadata(artifactPartial);

    const artifact: BusinessArtifact = Object.freeze({
      ...artifactPartial,
      fingerprint: Object.freeze(fingerprintMeta)
    });

    return {
      success: true,
      artifact,
      executionDurationMs: duration
    };
  }
}
