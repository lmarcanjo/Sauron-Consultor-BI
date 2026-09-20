/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NumericParsingRules {
  decimalSeparator: "," | ".";
  thousandSeparator: "." | "," | "";
  allowAccountingParentheses: boolean;
}

export interface DateParsingRules {
  brDateFormat: RegExp;
  excelEpochStartUTC: number;
}

export interface FieldResolutionRules {
  priorities: string[];
}

export interface GroupingRules {
  maxGroupsPerDimension: number;
}

export interface RoundingRules {
  precisionScale: number; // e.g. 2 for cents
}

export interface PreliminaryFinancialAnalysisPolicy {
  policyId: string;
  version: string;
  numericParsingRules: NumericParsingRules;
  dateParsingRules: DateParsingRules;
  fieldResolutionRules: FieldResolutionRules;
  groupingRules: GroupingRules;
  roundingRules: RoundingRules;
  fingerprint: string;
}

export const PRELIMINARY_POLICY_V1: PreliminaryFinancialAnalysisPolicy = {
  policyId: "prelim_policy_v1",
  version: "1.0.0",
  numericParsingRules: {
    decimalSeparator: ",",
    thousandSeparator: ".",
    allowAccountingParentheses: true,
  },
  dateParsingRules: {
    brDateFormat: /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/,
    excelEpochStartUTC: -2209132800000, // Date.UTC(1899, 11, 30)
  },
  fieldResolutionRules: {
    priorities: ["EXACT_PHYSICAL_NAME", "COMPATIBLE_TYPE", "HIGHEST_VALID_VALUES", "PHYSICAL_INDEX"],
  },
  groupingRules: {
    maxGroupsPerDimension: 50,
  },
  roundingRules: {
    precisionScale: 2,
  },
  fingerprint: "prelim_policy_v1_v1.0.0_canonical_sha256_placeholder",
};
