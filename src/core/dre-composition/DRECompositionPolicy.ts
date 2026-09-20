import { StatementGroup } from '../financial-classification/FinancialClassificationContracts';
import { DRECompositionPolicy } from './DRECompositionContracts';

export function computeDREPolicyFingerprint(policy: Omit<DRECompositionPolicy, 'fingerprint'>): string {
  const str = [
    policy.policyId,
    policy.version,
    policy.name,
    policy.supportedStatementGroups.join(','),
    policy.sectionOrder.join(','),
    policy.lineOrderingRules.sortBy,
    policy.signApplicationRules.enforceClassificationSignPolicy ? 'true' : 'false',
    policy.unresolvedItemRules.allowUnresolvedNonMaterial ? 'true' : 'false',
    policy.unresolvedItemRules.blockOnMaterialUnresolved ? 'true' : 'false',
    policy.exclusionRules.excludeNonFinancial ? 'true' : 'false',
    policy.exclusionRules.excludeZeroValues ? 'true' : 'false',
    policy.currencyPolicy.currencyCode,
    policy.currencyPolicy.currencySource,
    policy.currencyPolicy.decimalPlaces,
    policy.currencyPolicy.roundingMode,
    policy.currencyPolicy.mixedCurrencyBehavior,
    policy.roundingPolicy.decimalPlaces,
    policy.roundingPolicy.roundingMode,
    policy.periodPolicy.supportedPeriodTypes.join(','),
    policy.periodPolicy.defaultPeriodType,
    policy.periodPolicy.fiscalYearStartMonth,
    policy.periodPolicy.timezonePolicy,
    policy.periodPolicy.invalidDateBehavior,
    policy.periodPolicy.undatedRecordBehavior,
    policy.periodPolicy.customPeriodOverlapBehavior,
    policy.periodPolicy.partialPeriodBehavior,
    policy.periodPolicy.emptyPeriodBehavior,
    policy.periodPolicy.boundaryInclusivity,
    policy.periodPolicy.allowMissingDates ? 'true' : 'false',
    policy.aggregationPolicy.groupByPeriod ? 'true' : 'false',
    policy.aggregationPolicy.groupByStatementGroup ? 'true' : 'false',
    policy.valueSemantics || 'SIGNED_VALUE_MODEL',
    policy.signApplicationStage || 'DRE_LINE_PROJECTION',
    policy.formulaInputConvention || 'SIGNED_VALUES'
  ].join('|');

  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a_pol_${(hash >>> 0).toString(16)}`;
}

const v1Base = {
  policyId: 'asterion_dre_composition_policy_v1',
  version: '1.0.0',
  name: 'Política Canônica V1 de Composição de Estrutura de DRE (Preparatória e Periodizada)',
  supportedStatementGroups: Object.freeze([
    'GROSS_INFLOW',
    'DEDUCTION',
    'DIRECT_COST',
    'OPERATING_EXPENSE',
    'FINANCIAL_RESULT',
    'TAX_RESULT',
    'NON_OPERATING',
    'UNCLASSIFIED'
  ] as StatementGroup[]),
  sectionOrder: Object.freeze([
    'GROSS_INFLOW',
    'DEDUCTION',
    'DIRECT_COST',
    'OPERATING_EXPENSE',
    'FINANCIAL_RESULT',
    'TAX_RESULT',
    'NON_OPERATING',
    'UNCLASSIFIED'
  ] as StatementGroup[]),
  lineOrderingRules: Object.freeze({ sortBy: 'NORMALIZED_NAME' as const }),
  subtotalDefinitions: Object.freeze([]), // Subtotais avançados vazios na V1
  signApplicationRules: Object.freeze({ enforceClassificationSignPolicy: true }),
  unresolvedItemRules: Object.freeze({ allowUnresolvedNonMaterial: true, blockOnMaterialUnresolved: true }),
  exclusionRules: Object.freeze({ excludeNonFinancial: true, excludeZeroValues: false }),
  roundingPolicy: Object.freeze({ decimalPlaces: 2, roundingMode: 'HALF_EVEN' as const }),
  currencyPolicy: Object.freeze({
    currencyCode: 'UNKNOWN',
    currencySource: 'UNKNOWN' as const,
    decimalPlaces: 2,
    roundingMode: 'HALF_EVEN' as const,
    mixedCurrencyBehavior: 'REJECT' as const
  }),
  periodPolicy: Object.freeze({
    supportedPeriodTypes: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    defaultPeriodType: 'MONTH' as const,
    fiscalYearStartMonth: 1, // Calendário civil padrão
    timezonePolicy: 'UTC' as const,
    invalidDateBehavior: 'INCLUDE_IN_AGGREGATED_ONLY' as const,
    undatedRecordBehavior: 'INCLUDE_IN_AGGREGATED_ONLY' as const,
    customPeriodOverlapBehavior: 'ALLOW_WITHOUT_DUPLICATION' as const,
    partialPeriodBehavior: 'MARK_PARTIAL' as const,
    emptyPeriodBehavior: 'OMIT' as const,
    boundaryInclusivity: 'START_AND_END_INCLUSIVE' as const,
    allowMissingDates: true
  }),
  aggregationPolicy: Object.freeze({ groupByPeriod: true, groupByStatementGroup: true }),
  valueSemantics: 'SIGNED_VALUE_MODEL' as const,
  signApplicationStage: 'DRE_LINE_PROJECTION' as const,
  formulaInputConvention: 'SIGNED_VALUES' as const
};

export const CANONICAL_DRE_COMPOSITION_POLICY_V1: DRECompositionPolicy = Object.freeze({
  ...v1Base,
  fingerprint: computeDREPolicyFingerprint(v1Base)
});

// Fórmulas Determinísticas Canônicas V2 (Apenas Subtotais Financeiros Iniciais Aprovados com Semântica de Valores Assinados)
export const CANONICAL_DRE_FORMULAS_V2 = Object.freeze({
  TOTAL_GROSS_INFLOW: Object.freeze({
    formulaId: 'form_total_gross_inflow_v2',
    version: '2.0.1',
    code: 'TOTAL_GROSS_INFLOW',
    label: 'Total de Entradas Brutas',
    description: 'Soma de todas as linhas financeiras classificadas no grupo Entradas Brutas (GROSS_INFLOW).',
    operation: 'SUM_LINES' as const,
    inputReferences: Object.freeze(['GROSS_INFLOW']),
    outputSubtotalCode: 'TOTAL_GROSS_INFLOW',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'ZERO' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_gross_inflow_v2_signed'
  }),
  TOTAL_DEDUCTIONS: Object.freeze({
    formulaId: 'form_total_deductions_v2',
    version: '2.0.1',
    code: 'TOTAL_DEDUCTIONS',
    label: 'Total de Deduções',
    description: 'Soma de todas as linhas financeiras classificadas no grupo Deduções (DEDUCTION) projetadas com sinal negativo.',
    operation: 'SUM_LINES' as const,
    inputReferences: Object.freeze(['DEDUCTION']),
    outputSubtotalCode: 'TOTAL_DEDUCTIONS',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'ZERO' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_deductions_v2_signed'
  }),
  NET_INFLOW: Object.freeze({
    formulaId: 'form_net_inflow_v2',
    version: '2.0.1',
    code: 'NET_INFLOW',
    label: 'Entradas Líquidas',
    description: 'Soma do Total de Entradas Brutas com o Total de Deduções assinadas negativas (TOTAL_GROSS_INFLOW + TOTAL_DEDUCTIONS).',
    operation: 'ADD_SUBTOTALS' as const,
    inputReferences: Object.freeze(['TOTAL_GROSS_INFLOW', 'TOTAL_DEDUCTIONS']),
    outputSubtotalCode: 'NET_INFLOW',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'NOT_CALCULABLE' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_net_inflow_v2_signed'
  }),
  TOTAL_DIRECT_COST: Object.freeze({
    formulaId: 'form_total_direct_cost_v2',
    version: '2.0.1',
    code: 'TOTAL_DIRECT_COST',
    label: 'Total de Custos Diretos',
    description: 'Soma de todas as linhas financeiras classificadas no grupo Custos Diretos (DIRECT_COST) projetadas com sinal negativo.',
    operation: 'SUM_LINES' as const,
    inputReferences: Object.freeze(['DIRECT_COST']),
    outputSubtotalCode: 'TOTAL_DIRECT_COST',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'ZERO' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_direct_cost_v2_signed'
  }),
  GROSS_RESULT: Object.freeze({
    formulaId: 'form_gross_result_v2',
    version: '2.0.1',
    code: 'GROSS_RESULT',
    label: 'Resultado Bruto de Entradas',
    description: 'Soma das Entradas Líquidas com o Total de Custos Diretos assinados negativos (NET_INFLOW + TOTAL_DIRECT_COST).',
    operation: 'ADD_SUBTOTALS' as const,
    inputReferences: Object.freeze(['NET_INFLOW', 'TOTAL_DIRECT_COST']),
    outputSubtotalCode: 'GROSS_RESULT',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'NOT_CALCULABLE' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_gross_result_v2_signed'
  }),
  TOTAL_OPERATING_EXPENSE: Object.freeze({
    formulaId: 'form_total_operating_expense_v2',
    version: '2.0.1',
    code: 'TOTAL_OPERATING_EXPENSE',
    label: 'Total de Despesas Operacionais',
    description: 'Soma de todas as linhas financeiras classificadas no grupo Despesas Operacionais (OPERATING_EXPENSE) projetadas com sinal negativo.',
    operation: 'SUM_LINES' as const,
    inputReferences: Object.freeze(['OPERATING_EXPENSE']),
    outputSubtotalCode: 'TOTAL_OPERATING_EXPENSE',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'ZERO' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_op_expense_v2_signed'
  })
});

const v2Base = {
  ...v1Base,
  policyId: 'asterion_dre_composition_policy_v2',
  version: '2.0.1',
  predecessorPolicyId: 'asterion_dre_composition_policy_v1',
  name: 'Política Canônica V2 de Composição de Estrutura de DRE com Subtotais Financeiros Iniciais e Semântica de Valores Assinados',
  subtotalDefinitions: Object.freeze([
    {
      subtotalId: 'sub_total_gross_inflow',
      label: 'Total de Entradas Brutas',
      formulaId: CANONICAL_DRE_FORMULAS_V2.TOTAL_GROSS_INFLOW.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V2.TOTAL_GROSS_INFLOW.version,
      inputLineIds: Object.freeze([]),
      operation: 'SUM' as const,
      order: 1
    },
    {
      subtotalId: 'sub_total_deductions',
      label: 'Total de Deduções',
      formulaId: CANONICAL_DRE_FORMULAS_V2.TOTAL_DEDUCTIONS.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V2.TOTAL_DEDUCTIONS.version,
      inputLineIds: Object.freeze([]),
      operation: 'SUM' as const,
      order: 2
    },
    {
      subtotalId: 'sub_net_inflow',
      label: 'Entradas Líquidas',
      formulaId: CANONICAL_DRE_FORMULAS_V2.NET_INFLOW.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V2.NET_INFLOW.version,
      inputLineIds: Object.freeze([]),
      operation: 'ADD' as const,
      order: 3
    },
    {
      subtotalId: 'sub_total_direct_cost',
      label: 'Total de Custos Diretos',
      formulaId: CANONICAL_DRE_FORMULAS_V2.TOTAL_DIRECT_COST.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V2.TOTAL_DIRECT_COST.version,
      inputLineIds: Object.freeze([]),
      operation: 'SUM' as const,
      order: 4
    },
    {
      subtotalId: 'sub_gross_result',
      label: 'Resultado Bruto de Entradas',
      formulaId: CANONICAL_DRE_FORMULAS_V2.GROSS_RESULT.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V2.GROSS_RESULT.version,
      inputLineIds: Object.freeze([]),
      operation: 'ADD' as const,
      order: 5
    },
    {
      subtotalId: 'sub_total_operating_expense',
      label: 'Total de Despesas Operacionais',
      formulaId: CANONICAL_DRE_FORMULAS_V2.TOTAL_OPERATING_EXPENSE.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V2.TOTAL_OPERATING_EXPENSE.version,
      inputLineIds: Object.freeze([]),
      operation: 'SUM' as const,
      order: 6
    }
  ]),
  valueSemantics: 'SIGNED_VALUE_MODEL' as const,
  signApplicationStage: 'DRE_LINE_PROJECTION' as const,
  formulaInputConvention: 'SIGNED_VALUES' as const
};

export const CANONICAL_DRE_COMPOSITION_POLICY_V2: DRECompositionPolicy = Object.freeze({
  ...v2Base,
  fingerprint: computeDREPolicyFingerprint(v2Base)
});

// Fórmulas Determinísticas Canônicas V3 (Estrutura Operacional Completa + Financeiro + Tributário + Não Operacional)
export const CANONICAL_DRE_FORMULAS_V3 = Object.freeze({
  ...CANONICAL_DRE_FORMULAS_V2,
  OPERATING_RESULT: Object.freeze({
    formulaId: 'form_operating_result_v3',
    version: '3.0.0',
    code: 'OPERATING_RESULT',
    label: 'Resultado Operacional Estritamente Estrutural',
    description: 'Soma do Resultado Bruto de Entradas com o Total de Despesas Operacionais (GROSS_RESULT + TOTAL_OPERATING_EXPENSE).',
    operation: 'ADD_SUBTOTALS' as const,
    inputReferences: Object.freeze(['GROSS_RESULT', 'TOTAL_OPERATING_EXPENSE']),
    outputSubtotalCode: 'OPERATING_RESULT',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'NOT_CALCULABLE' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_operating_result_v3'
  }),
  TOTAL_FINANCIAL_RESULT: Object.freeze({
    formulaId: 'form_total_financial_result_v3',
    version: '3.0.0',
    code: 'TOTAL_FINANCIAL_RESULT',
    label: 'Total do Resultado Financeiro',
    description: 'Soma de todas as linhas financeiras classificadas no grupo Resultado Financeiro (FINANCIAL_RESULT).',
    operation: 'SUM_LINES' as const,
    inputReferences: Object.freeze(['FINANCIAL_RESULT']),
    outputSubtotalCode: 'TOTAL_FINANCIAL_RESULT',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'ZERO' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_total_financial_result_v3'
  }),
  RESULT_AFTER_FINANCIAL: Object.freeze({
    formulaId: 'form_result_after_financial_v3',
    version: '3.0.0',
    code: 'RESULT_AFTER_FINANCIAL',
    label: 'Resultado Após Itens Financeiros',
    description: 'Soma do Resultado Operacional com o Total do Resultado Financeiro (OPERATING_RESULT + TOTAL_FINANCIAL_RESULT).',
    operation: 'ADD_SUBTOTALS' as const,
    inputReferences: Object.freeze(['OPERATING_RESULT', 'TOTAL_FINANCIAL_RESULT']),
    outputSubtotalCode: 'RESULT_AFTER_FINANCIAL',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'NOT_CALCULABLE' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_result_after_financial_v3'
  }),
  TOTAL_TAX_RESULT: Object.freeze({
    formulaId: 'form_total_tax_result_v3',
    version: '3.0.0',
    code: 'TOTAL_TAX_RESULT',
    label: 'Total do Resultado Tributário',
    description: 'Soma de todas as linhas financeiras classificadas no grupo Resultado Tributário (TAX_RESULT).',
    operation: 'SUM_LINES' as const,
    inputReferences: Object.freeze(['TAX_RESULT']),
    outputSubtotalCode: 'TOTAL_TAX_RESULT',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'ZERO' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_total_tax_result_v3'
  }),
  RESULT_AFTER_TAX_ITEMS: Object.freeze({
    formulaId: 'form_result_after_tax_items_v3',
    version: '3.0.0',
    code: 'RESULT_AFTER_TAX_ITEMS',
    label: 'Resultado Após Itens Tributários',
    description: 'Soma do Resultado Após Itens Financeiros com o Total do Resultado Tributário (RESULT_AFTER_FINANCIAL + TOTAL_TAX_RESULT).',
    operation: 'ADD_SUBTOTALS' as const,
    inputReferences: Object.freeze(['RESULT_AFTER_FINANCIAL', 'TOTAL_TAX_RESULT']),
    outputSubtotalCode: 'RESULT_AFTER_TAX_ITEMS',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'NOT_CALCULABLE' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_result_after_tax_items_v3'
  }),
  TOTAL_NON_OPERATING: Object.freeze({
    formulaId: 'form_total_non_operating_v3',
    version: '3.0.0',
    code: 'TOTAL_NON_OPERATING',
    label: 'Total de Itens Não Operacionais',
    description: 'Soma de todas as linhas financeiras classificadas no grupo Não Operacional (NON_OPERATING).',
    operation: 'SUM_LINES' as const,
    inputReferences: Object.freeze(['NON_OPERATING']),
    outputSubtotalCode: 'TOTAL_NON_OPERATING',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'ZERO' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_total_non_operating_v3'
  }),
  RESULT_AFTER_NON_OPERATING: Object.freeze({
    formulaId: 'form_result_after_non_operating_v3',
    version: '3.0.0',
    code: 'RESULT_AFTER_NON_OPERATING',
    label: 'Resultado Estrutural Após Itens Não Operacionais',
    description: 'Soma do Resultado Após Itens Tributários com o Total de Itens Não Operacionais (RESULT_AFTER_TAX_ITEMS + TOTAL_NON_OPERATING).',
    operation: 'ADD_SUBTOTALS' as const,
    inputReferences: Object.freeze(['RESULT_AFTER_TAX_ITEMS', 'TOTAL_NON_OPERATING']),
    outputSubtotalCode: 'RESULT_AFTER_NON_OPERATING',
    supportedPeriods: Object.freeze(['AGGREGATED', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM_PERIOD'] as const),
    supportedCurrencies: Object.freeze(['*']),
    roundingStage: 'ON_OUTPUT' as const,
    missingInputBehavior: 'NOT_CALCULABLE' as const,
    zeroInputBehavior: 'CALCULATE' as const,
    limitations: Object.freeze([]),
    fingerprint: 'fnv1a_form_result_after_non_operating_v3'
  })
});

const v3Base = {
  ...v2Base,
  policyId: 'asterion_dre_composition_policy_v3',
  version: '3.0.0',
  predecessorPolicyId: 'asterion_dre_composition_policy_v2',
  name: 'Política Canônica V3 de Composição de Estrutura de DRE com Estrutura Operacional Estendida e Todos os Grupos Financeiros',
  subtotalDefinitions: Object.freeze([
    ...v2Base.subtotalDefinitions,
    {
      subtotalId: 'sub_operating_result',
      label: 'Resultado Operacional Estritamente Estrutural',
      formulaId: CANONICAL_DRE_FORMULAS_V3.OPERATING_RESULT.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V3.OPERATING_RESULT.version,
      inputLineIds: Object.freeze([]),
      operation: 'ADD' as const,
      order: 7
    },
    {
      subtotalId: 'sub_total_financial_result',
      label: 'Total do Resultado Financeiro',
      formulaId: CANONICAL_DRE_FORMULAS_V3.TOTAL_FINANCIAL_RESULT.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V3.TOTAL_FINANCIAL_RESULT.version,
      inputLineIds: Object.freeze([]),
      operation: 'SUM' as const,
      order: 8
    },
    {
      subtotalId: 'sub_result_after_financial',
      label: 'Resultado Após Itens Financeiros',
      formulaId: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_FINANCIAL.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_FINANCIAL.version,
      inputLineIds: Object.freeze([]),
      operation: 'ADD' as const,
      order: 9
    },
    {
      subtotalId: 'sub_total_tax_result',
      label: 'Total do Resultado Tributário',
      formulaId: CANONICAL_DRE_FORMULAS_V3.TOTAL_TAX_RESULT.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V3.TOTAL_TAX_RESULT.version,
      inputLineIds: Object.freeze([]),
      operation: 'SUM' as const,
      order: 10
    },
    {
      subtotalId: 'sub_result_after_tax_items',
      label: 'Resultado Após Itens Tributários',
      formulaId: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_TAX_ITEMS.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_TAX_ITEMS.version,
      inputLineIds: Object.freeze([]),
      operation: 'ADD' as const,
      order: 11
    },
    {
      subtotalId: 'sub_total_non_operating',
      label: 'Total de Itens Não Operacionais',
      formulaId: CANONICAL_DRE_FORMULAS_V3.TOTAL_NON_OPERATING.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V3.TOTAL_NON_OPERATING.version,
      inputLineIds: Object.freeze([]),
      operation: 'SUM' as const,
      order: 12
    },
    {
      subtotalId: 'sub_result_after_non_operating',
      label: 'Resultado Estrutural Após Itens Não Operacionais',
      formulaId: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_NON_OPERATING.formulaId,
      formulaVersion: CANONICAL_DRE_FORMULAS_V3.RESULT_AFTER_NON_OPERATING.version,
      inputLineIds: Object.freeze([]),
      operation: 'ADD' as const,
      order: 13
    }
  ])
};

export const CANONICAL_DRE_COMPOSITION_POLICY_V3: DRECompositionPolicy = Object.freeze({
  ...v3Base,
  fingerprint: computeDREPolicyFingerprint(v3Base)
});

export function getStatementGroupLabel(group: StatementGroup): string {
  const labels: Record<StatementGroup, string> = {
    GROSS_INFLOW: 'Entradas Brutas',
    DEDUCTION: 'Deduções',
    DIRECT_COST: 'Custos Diretos',
    OPERATING_EXPENSE: 'Despesas Operacionais',
    FINANCIAL_RESULT: 'Resultado Financeiro',
    TAX_RESULT: 'Resultado Tributário',
    NON_OPERATING: 'Itens Não Operacionais',
    UNCLASSIFIED: 'Não Classificados'
  };
  return labels[group] || group;
}
