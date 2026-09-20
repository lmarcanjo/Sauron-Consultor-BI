/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreliminaryFieldUsage } from "./PreliminaryFinancialAnalysisContracts";

export interface ResolvedField {
  targetKey: string;
  physicalName: string;
  physicalColumnIndex: number;
  candidatesReplaced: string[];
  reason: string;
  typeCompatible: boolean;
  limitations: string[];
}

export class PreliminaryFieldResolver {
  private static SEMANTIC_PATTERNS: Record<string, RegExp[]> = {
    emission_date: [/^emissão$/i, /^data\s*emissão$/i],
    due_date: [/^vencimento$/i, /^data\s*vencimento$/i],
    payment_date: [/^pagamento$/i, /^data\s*pagamento$/i],
    situation: [/^situação$/i, /^status$/i],
    person: [/^pessoa$/i, /^cliente$/i, /^fornecedor$/i],
    account: [/^conta\s*contábil$/i, /^conta$/i],
    result_center: [/^centro\s*de\s*resultado$/i, /^centro\s*de\s*custo$/i],
    business_unit: [/^unidade\s*de\s*negócio$/i, /^unidade$/i],
    payment_method: [/^forma\s*de\s*pagamento$/i, /^meio\s*de\s*pagamento$/i],
    value: [/^valor$/i, /^valor\s*total$/i, /^vl\.\s*total$/i],
    paid_value: [/^valor\s*pago$/i, /^vl\.\s*pago$/i],
    balance: [/^saldo$/i, /^restante$/i],
  };

  /**
   * Resolve physical columns deterministically based on priority.
   */
  public static resolve(
    columns: string[],
    rows: any[]
  ): { resolved: ResolvedField[]; fieldUsages: PreliminaryFieldUsage[] } {
    const resolved: ResolvedField[] = [];
    const fieldUsages: PreliminaryFieldUsage[] = [];

    // Map each physical column with index and stable displayName
    const physicalColumns = columns.map((col, idx) => {
      const physicalName = col === undefined || col === null ? "" : String(col);
      const isUnnamed = physicalName.trim() === "";
      return {
        physicalName,
        physicalColumnIndex: idx,
        displayName: isUnnamed ? `Coluna sem cabeçalho ${idx + 1}` : physicalName,
        isUnnamed,
      };
    });

    // Populate default fieldUsages as IGNORED
    for (const pCol of physicalColumns) {
      fieldUsages.push({
        physicalName: pCol.physicalName,
        physicalColumnIndex: pCol.physicalColumnIndex,
        displayName: pCol.displayName,
        usageStatus: "IGNORED",
        limitationCode: pCol.isUnnamed ? "EMPTY_PHYSICAL_HEADER" : undefined,
      });
    }

    // Resolve each target key
    for (const [targetKey, patterns] of Object.entries(this.SEMANTIC_PATTERNS)) {
      // Find all physical columns matching the patterns
      const candidates = physicalColumns.filter((pCol) => {
        if (pCol.isUnnamed) return false;
        return patterns.some((p) => p.test(pCol.physicalName));
      });

      if (candidates.length === 0) continue;

      // Select the best candidate deterministically
      // 1. Priority by exact name matching pattern (higher index in patterns list is lower priority)
      // 2. Highest number of valid values (non-empty/non-null)
      // 3. Physical index desempate (earlier index first)
      const scoredCandidates = candidates.map((candidate) => {
        // pattern match score (lower is better, meaning matched earlier pattern)
        let patternScore = 999;
        for (let i = 0; i < patterns.length; i++) {
          if (patterns[i].test(candidate.physicalName)) {
            patternScore = i;
            break;
          }
        }

        // valid values count
        let validCount = 0;
        for (const row of rows) {
          const val = row[candidate.physicalName];
          if (val !== undefined && val !== null && String(val).trim() !== "") {
            validCount++;
          }
        }

        return {
          candidate,
          patternScore,
          validCount,
          physicalIndex: candidate.physicalColumnIndex,
        };
      });

      // Sort by pattern score asc, valid count desc, physical index asc
      scoredCandidates.sort((a, b) => {
        if (a.patternScore !== b.patternScore) return a.patternScore - b.patternScore;
        if (b.validCount !== a.validCount) return b.validCount - a.validCount;
        return a.physicalIndex - b.physicalIndex;
      });

      const best = scoredCandidates[0];
      const bestCol = best.candidate;

      const candidatesReplaced = scoredCandidates
        .slice(1)
        .map((sc) => sc.candidate.physicalName);

      resolved.push({
        targetKey,
        physicalName: bestCol.physicalName,
        physicalColumnIndex: bestCol.physicalColumnIndex,
        candidatesReplaced,
        reason: `Mapeamento determinístico via correspondência de padrão semantic_${targetKey}. Candidates preteridos: ${candidatesReplaced.join(", ") || "nenhum"}.`,
        typeCompatible: true,
        limitations: [],
      });

      // Update fieldUsages
      const usage = fieldUsages.find((u) => u.physicalColumnIndex === bestCol.physicalColumnIndex);
      if (usage) {
        usage.usageStatus = "USED";
        usage.semanticRole = targetKey.toUpperCase();
      }
    }

    return { resolved, fieldUsages };
  }
}
