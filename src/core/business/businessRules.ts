/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core business rules and financial validations

export const BUSINESS_RULES = {
  // Validate standard Brazilian CNPJ format
  isValidCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return false;
    
    // Simple check for repeated digits
    if (/^(\d)\1{13}$/.test(cleaned)) return false;
    
    // Minimal standard check (first digit, second digit)
    let size = cleaned.length - 2;
    let numbers = cleaned.substring(0, size);
    const digits = cleaned.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    
    size = size + 1;
    numbers = cleaned.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    
    return true;
  },

  // Safely calculate margins to avoid division-by-zero artifacts
  calculateMargin(profit: number, revenue: number): number {
    if (!revenue || revenue === 0) return 0;
    return profit / revenue;
  },

  // Categorize operating margin quality
  getMarginStatus(margin: number): "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL" {
    if (margin >= 0.15) return "EXCELLENT";
    if (margin >= 0.08) return "GOOD";
    if (margin >= 0.02) return "WARNING";
    return "CRITICAL";
  }
};
