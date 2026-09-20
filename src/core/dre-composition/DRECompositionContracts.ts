import { AnalysisScope } from '../business-insight/BusinessArtifactContracts';
import { StatementGroup, SignPolicy, FinancialClassificationDecision } from '../financial-classification/FinancialClassificationContracts';

export type DREArtifactStatus =
  | 'GENERATED'
  | 'LIMITED'
  | 'BLOCKED'
  | 'INVALIDATED'
  | 'SUPERSEDED';

export type DRECalculationStatus =
  | 'CALCULATED'
  | 'PARTIALLY_CALCULATED'
  | 'NOT_CALCULABLE'
  | 'BLOCKED'
  | 'ZERO'
  | 'EXCLUDED';

export type DREPeriodType =
  | 'AGGREGATED'
  | 'MONTH'
  | 'QUARTER'
  | 'YEAR'
  | 'CUSTOM_PERIOD';

export type DRESubtotalOperation =
  | 'SUM'
  | 'ADD'
  | 'SUBTRACT';

export type PeriodCompleteness =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'UNKNOWN'
  | 'NOT_APPLICABLE';

export interface InvalidDateItem {
  readonly itemId: string;
  readonly sourceRecordIdentity: string;
  readonly physicalValue: string;
  readonly containerId: string;
  readonly temporalFieldPhysicalName: string;
  readonly reason: string;
  readonly parserRuleId: string;
  readonly contributionValue: number;
  readonly treatment: 'EXCLUDED_FROM_PERIOD' | 'INCLUDED_IN_AGGREGATED_ONLY' | 'BLOCKED' | 'REQUIRES_REVIEW';
  readonly provenance: {
    readonly dataSourceId: string;
    readonly schemaVersionNumber: number;
  };
}

export interface PhysicalContributionIdentity {
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly containerId: string;
  readonly sourceRecordIdentity: string;
  readonly monetaryFieldPhysicalName: string;
  readonly categoryFieldPhysicalName: string;
}

export interface DREPeriod {
  readonly periodId: string;
  readonly periodType: DREPeriodType;
  readonly startDate: string;
  readonly endDate: string;
  readonly label: string;
  readonly calendarYear?: number;
  readonly fiscalYear?: number;
  readonly fiscalQuarter?: number;
  readonly month?: number;
  readonly order: number;
  readonly completeness: PeriodCompleteness;
  readonly validRecordCount: number;
  readonly invalidDateRecordCount: number;
  readonly undatedRecordCount: number;
  readonly limitations: readonly string[];
}

export interface ContributionIdentity {
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly containerId: string;
  readonly sourceRecordIdentity: string;
  readonly monetaryFieldPhysicalName: string;
  readonly categoryFieldPhysicalName: string;
  readonly classificationDecisionId: string;
  readonly periodId: string;
  readonly currencyCode: string;
}

export type CurrencySource =
  | 'SOURCE_FIELD_CONFIRMED'
  | 'ENGAGEMENT_CONFIGURATION'
  | 'ORGANIZATIONAL_CONFIGURATION'
  | 'CONSULTANT_DECLARATION'
  | 'UNKNOWN';

export interface CurrencyContext {
  readonly currencyCode: string;
  readonly currencySource: CurrencySource;
  readonly semanticDecisionId?: string;
  readonly configuredBy?: string;
  readonly configuredAt?: string;
  readonly limitations: readonly string[];
}

export interface DRECurrencyPolicy {
  readonly currencyCode: string;
  readonly currencySource: CurrencySource;
  readonly decimalPlaces: number;
  readonly roundingMode: 'HALF_EVEN' | 'HALF_UP' | 'TRUNCATE';
  readonly mixedCurrencyBehavior: 'REJECT' | 'ALLOW_WITH_LIMITATION';
}

export interface DRESubtotalDefinition {
  readonly subtotalId: string;
  readonly label: string;
  readonly formulaId: string;
  readonly formulaVersion: string;
  readonly inputLineIds: readonly string[];
  readonly operation: DRESubtotalOperation;
  readonly order: number;
}

export interface DRECompositionPolicy {
  readonly policyId: string;
  readonly version: string;
  readonly name: string;
  readonly supportedStatementGroups: readonly StatementGroup[];
  readonly sectionOrder: readonly StatementGroup[];
  readonly lineOrderingRules: { readonly sortBy: 'PHYSICAL_NAME' | 'NORMALIZED_NAME' | 'AMOUNT_DESC' };
  readonly subtotalDefinitions: readonly DRESubtotalDefinition[];
  readonly signApplicationRules: { readonly enforceClassificationSignPolicy: boolean };
  readonly unresolvedItemRules: { readonly allowUnresolvedNonMaterial: boolean; readonly blockOnMaterialUnresolved: boolean };
  readonly exclusionRules: { readonly excludeNonFinancial: boolean; readonly excludeZeroValues: boolean };
  readonly roundingPolicy: { readonly decimalPlaces: number; readonly roundingMode: 'HALF_EVEN' | 'HALF_UP' };
  readonly currencyPolicy: DRECurrencyPolicy;
  readonly periodPolicy: {
    readonly supportedPeriodTypes: readonly DREPeriodType[];
    readonly defaultPeriodType: DREPeriodType;
    readonly fiscalYearStartMonth: number; // 1 = Janeiro, 2 = Fevereiro, etc.
    readonly timezonePolicy: 'UTC' | 'LOCAL' | 'SOURCE_TIMEZONE';
    readonly invalidDateBehavior: 'EXCLUDE_FROM_PERIOD' | 'INCLUDE_IN_AGGREGATED_ONLY' | 'BLOCK' | 'REQUIRE_REVIEW';
    readonly undatedRecordBehavior: 'INCLUDE_IN_AGGREGATED_ONLY' | 'BLOCK' | 'EXCLUDE';
    readonly customPeriodOverlapBehavior: 'ALLOW_WITHOUT_DUPLICATION' | 'BLOCK';
    readonly partialPeriodBehavior: 'MARK_PARTIAL' | 'ALLOW';
    readonly emptyPeriodBehavior: 'OMIT' | 'INCLUDE_ZERO';
    readonly boundaryInclusivity: 'START_AND_END_INCLUSIVE' | 'START_INCLUSIVE_END_EXCLUSIVE';
    readonly allowMissingDates: boolean;
  };
  readonly aggregationPolicy: { readonly groupByPeriod: boolean; readonly groupByStatementGroup: boolean };
  readonly valueSemantics: 'SIGNED_VALUE_MODEL';
  readonly signApplicationStage: 'DRE_LINE_PROJECTION';
  readonly formulaInputConvention: 'SIGNED_VALUES';
  readonly fingerprint: string;
}

export interface DRELine {
  readonly lineId: string;
  readonly lineCode: string;
  readonly label: string;
  readonly statementGroup: StatementGroup;
  readonly classificationType: string;
  readonly financialNature: string;
  readonly periodValues: Record<string, number>;
  readonly sourceCategoryIdentities: readonly string[];
  readonly sourcePhysicalValues: readonly string[];
  readonly financialClassificationDecisionIds: readonly string[];
  readonly signPoliciesApplied: readonly string[];
  readonly totalValue: number;
  readonly calculationStatus: DRECalculationStatus;
  readonly limitations: readonly string[];
  readonly provenance: {
    readonly dataSourceId: string;
    readonly schemaVersionNumber: number;
    readonly financialClassificationArtifactId: string;
    readonly categoryIdentity: string;
  };
  readonly order: number;
  readonly displayLevel: number;
}

export interface DRESection {
  readonly sectionId: string;
  readonly statementGroup: StatementGroup;
  readonly label: string;
  readonly order: number;
  readonly lineIds: readonly string[];
  readonly totalValue: number;
}

export type DREFormulaOperation =
  | 'SUM_LINES'
  | 'ADD_SUBTOTALS'
  | 'SUBTRACT_SUBTOTALS'
  | 'SUBTRACT_LINES_FROM_SUBTOTAL';

export interface DREFormulaDefinition {
  readonly formulaId: string;
  readonly version: string;
  readonly code: string;
  readonly label: string;
  readonly description: string;
  readonly operation: DREFormulaOperation;
  readonly inputReferences: readonly string[];
  readonly outputSubtotalCode: string;
  readonly supportedPeriods: readonly DREPeriodType[];
  readonly supportedCurrencies: readonly string[];
  readonly roundingStage: 'ON_OUTPUT' | 'INTERMEDIATE';
  readonly missingInputBehavior: 'NOT_CALCULABLE' | 'ZERO' | 'PARTIAL';
  readonly zeroInputBehavior: 'CALCULATE' | 'OMIT';
  readonly limitations: readonly string[];
  readonly fingerprint: string;
}

export interface DRESubtotal {
  readonly subtotalId: string;
  readonly subtotalCode: string;
  readonly label: string;
  readonly formulaId: string;
  readonly formulaVersion: string;
  readonly periodId: string;
  readonly currencyCode: string;
  readonly inputLineIds: readonly string[];
  readonly inputSubtotalIds: readonly string[];
  readonly rawValue: number;
  readonly roundedValue: number;
  readonly calculationStatus: DRECalculationStatus;
  readonly missingInputs: readonly string[];
  readonly limitations: readonly string[];
  readonly provenance: {
    readonly inputLineCodes: readonly string[];
    readonly inputSubtotalCodes: readonly string[];
    readonly inputRawValues: readonly number[];
    readonly inputSignedValues: readonly number[];
    readonly outputRawValue: number;
    readonly expression: string;
    readonly signSemantics: 'SIGNED_VALUE_MODEL';
    readonly policyId: string;
    readonly policyVersion: string;
  };
  readonly order: number;
  readonly displayLevel: number;
}

export interface DREProvenance {
  readonly dataSourceIds: readonly string[];
  readonly schemaVersionReferences: readonly number[];
  readonly financialClassificationArtifactIds: readonly string[];
  readonly trustArtifactIds: readonly string[];
  readonly semanticConfirmationArtifactIds: readonly string[];
  readonly businessArtifactIds: readonly string[];
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface DREArtifact {
  readonly artifactId: string;
  readonly engineId: string;
  readonly engineVersion: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly policyFingerprint: string;
  readonly engagementId: string;
  readonly dataSourceIds: readonly string[];
  readonly schemaVersionReferences: readonly number[];
  readonly organizationalScope: AnalysisScope;
  readonly financialClassificationArtifactIds: readonly string[];
  readonly trustArtifactIds: readonly string[];
  readonly semanticConfirmationArtifactIds: readonly string[];
  readonly businessArtifactIds: readonly string[];
  readonly periods: readonly DREPeriod[];
  readonly sections: readonly DRESection[];
  readonly lines: readonly DRELine[];
  readonly subtotals: readonly DRESubtotal[];
  readonly unresolvedItems: readonly string[];
  readonly exclusions: readonly string[];
  readonly limitations: readonly string[];
  readonly provenance: DREProvenance;
  readonly metadata: {
    readonly disclaimer: string;
    readonly currencyCode: string;
    readonly isOfficialFinancialStatement: false;
  };
  readonly fingerprint: string;
  readonly generatedAt: string;
  readonly version: number;
  readonly status: DREArtifactStatus;
  readonly invalidatedAt?: string;
  readonly invalidationReason?: string;
}

export interface CustomPeriodDefinition {
  readonly customPeriodId: string;
  readonly label: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly rationale: string;
}

export interface DRECompositionExecutionContext {
  readonly engagementId: string;
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly financialClassificationArtifact: any;
  readonly trustArtifact: any;
  readonly semanticConfirmationArtifact: any;
  readonly businessArtifact?: any;
  readonly currencyContext?: CurrencyContext;
  readonly policy?: DRECompositionPolicy;
  readonly requestedPeriodType?: DREPeriodType;
  readonly confirmedTemporalFieldName?: string;
  readonly customPeriod?: CustomPeriodDefinition;
  readonly rawRecords?: readonly Record<string, unknown>[];
}

export interface DRECompositionExecutionResult {
  readonly success: boolean;
  readonly artifact?: DREArtifact;
  readonly issues: readonly { readonly code: string; readonly severity: 'ERROR' | 'WARNING'; readonly message: string }[];
}

export interface IDRECompositionEngine {
  composeDRE(context: DRECompositionExecutionContext): DRECompositionExecutionResult;
}

export class DRECompositionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(`[DRECompositionError:${code}] ${message}`);
    this.name = 'DRECompositionError';
  }
}
