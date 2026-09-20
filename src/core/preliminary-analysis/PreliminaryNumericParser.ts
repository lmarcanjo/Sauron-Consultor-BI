/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NumericParsingRules } from "./PreliminaryFinancialAnalysisPolicy";

export class PreliminaryNumericParser {
  public static parse(value: unknown, rules: NumericParsingRules): { value: number; isValid: boolean; rawString?: string } {
    if (value === undefined || value === null) {
      return { value: 0, isValid: false };
    }

    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        return { value, isValid: true };
      }
      return { value: 0, isValid: false };
    }

    const rawStr = String(value).trim();
    if (rawStr === "") {
      return { value: 0, isValid: false, rawString: rawStr };
    }

    let cleaned = rawStr.replace(/\s/g, "");

    // Handle accounting parentheses like (1.200,50)
    if (rules.allowAccountingParentheses && cleaned.startsWith("(") && cleaned.endsWith(")")) {
      cleaned = "-" + cleaned.slice(1, -1);
    }

    // Replace thousands separator and normalize decimals
    if (rules.decimalSeparator === ",") {
      // replace dots (thousands) with nothing, and comma (decimals) with dot
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // replace commas (thousands) with nothing
      cleaned = cleaned.replace(/,/g, "");
    }

    const num = parseFloat(cleaned);
    if (Number.isFinite(num)) {
      return { value: num, isValid: true, rawString: rawStr };
    }

    return { value: 0, isValid: false, rawString: rawStr };
  }
}
