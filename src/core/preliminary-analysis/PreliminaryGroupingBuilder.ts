/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreliminaryFinancialGrouping, PreliminaryFinancialGroupingItem } from "./PreliminaryFinancialAnalysisContracts";
import { ResolvedField } from "./PreliminaryFieldResolver";
import { GroupingRules } from "./PreliminaryFinancialAnalysisPolicy";
import { PreliminaryNumericParser } from "./PreliminaryNumericParser";
import { NumericParsingRules } from "./PreliminaryFinancialAnalysisPolicy";

export class PreliminaryGroupingBuilder {
  public static build(
    rows: any[],
    resolvedFields: ResolvedField[],
    groupingRules: GroupingRules,
    numericRules: NumericParsingRules
  ): PreliminaryFinancialGrouping[] {
    const groupings: PreliminaryFinancialGrouping[] = [];

    const dimensions = [
      { key: "situation", label: "por Situação", code: "SITUATION" },
      { key: "person", label: "por Pessoa", code: "PERSON" },
      { key: "account", label: "por Conta Contábil", code: "ACCOUNT" },
      { key: "result_center", label: "por Centro de Resultado", code: "RESULT_CENTER" },
      { key: "business_unit", label: "por Unidade de Negócio", code: "BUSINESS_UNIT" },
      { key: "payment_method", label: "por Forma de Pagamento", code: "PAYMENT_METHOD" },
    ];

    const valueCol = resolvedFields.find((f) => f.targetKey === "value")?.physicalName;
    const paidValueCol = resolvedFields.find((f) => f.targetKey === "paid_value")?.physicalName;
    const balanceCol = resolvedFields.find((f) => f.targetKey === "balance")?.physicalName;

    for (const dim of dimensions) {
      const field = resolvedFields.find((f) => f.targetKey === dim.key);
      if (!field) continue;

      const physicalName = field.physicalName;
      // Map to hold aggregated groups case-insensitively
      const aggregates = new Map<string, {
        originalCasing: string;
        recordCount: number;
        valueTotal: number;
        paidValueTotal: number;
        balanceTotal: number;
        sourceRecordIdentities: string[];
      }>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip completely empty rows
        const values = Object.values(row).map(v => String(v ?? "").trim());
        const isRowEmpty = values.every(v => v === "");
        if (isRowEmpty) continue;

        const rawVal = row[physicalName];
        const physicalValue = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : "";
        const lookupKey = physicalValue.toLowerCase();

        const v = valueCol ? PreliminaryNumericParser.parse(row[valueCol], numericRules).value : 0;
        const vp = paidValueCol ? PreliminaryNumericParser.parse(row[paidValueCol], numericRules).value : 0;
        const s = balanceCol ? PreliminaryNumericParser.parse(row[balanceCol], numericRules).value : 0;

        const recordId = `row_${i + 2}`;

        const existing = aggregates.get(lookupKey);
        if (existing) {
          existing.recordCount++;
          existing.valueTotal += v;
          existing.paidValueTotal += vp;
          existing.balanceTotal += s;
          existing.sourceRecordIdentities.push(recordId);
        } else {
          aggregates.set(lookupKey, {
            originalCasing: physicalValue || "(Vazio)",
            recordCount: 1,
            valueTotal: v,
            paidValueTotal: vp,
            balanceTotal: s,
            sourceRecordIdentities: [recordId],
          });
        }
      }

      // Convert map to items list
      let items: PreliminaryFinancialGroupingItem[] = Array.from(aggregates.values()).map((agg) => ({
        physicalValue: agg.originalCasing,
        displayName: agg.originalCasing,
        recordCount: agg.recordCount,
        valueTotal: Number(agg.valueTotal.toFixed(2)),
        paidValueTotal: Number(agg.paidValueTotal.toFixed(2)),
        balanceTotal: Number(agg.balanceTotal.toFixed(2)),
        sourceRecordIdentities: agg.sourceRecordIdentities,
        limitations: [],
      }));

      const totalGroupCount = items.length;
      let truncated = false;

      // Apply limit if total groups exceed maximum
      if (totalGroupCount > groupingRules.maxGroupsPerDimension) {
        truncated = true;
        // Sort items by recordCount descending, valueTotal descending to get top N
        items.sort((a, b) => {
          if (b.recordCount !== a.recordCount) return b.recordCount - a.recordCount;
          return b.valueTotal - a.valueTotal;
        });

        const topN = items.slice(0, groupingRules.maxGroupsPerDimension);
        const remaining = items.slice(groupingRules.maxGroupsPerDimension);

        let otherRecordCount = 0;
        let otherValueTotal = 0;
        let otherPaidValueTotal = 0;
        let otherBalanceTotal = 0;
        let otherSourceRecordIdentities: string[] = [];

        for (const rem of remaining) {
          otherRecordCount += rem.recordCount;
          otherValueTotal += rem.valueTotal;
          otherPaidValueTotal += rem.paidValueTotal;
          otherBalanceTotal += rem.balanceTotal;
          otherSourceRecordIdentities.push(...rem.sourceRecordIdentities);
        }

        topN.push({
          physicalValue: "OUTROS",
          displayName: `Outros (${remaining.length} grupos omitidos)`,
          recordCount: otherRecordCount,
          valueTotal: Number(otherValueTotal.toFixed(2)),
          paidValueTotal: Number(otherPaidValueTotal.toFixed(2)),
          balanceTotal: Number(otherBalanceTotal.toFixed(2)),
          sourceRecordIdentities: otherSourceRecordIdentities.slice(0, 100), // Limit ref count in others
          limitations: ["GROUPING_TRUNCATED"],
        });

        items = topN;
      }

      groupings.push({
        dimensionCode: dim.code,
        dimensionLabel: dim.label,
        sourcePhysicalName: physicalName,
        totalGroupCount,
        includedGroupCount: items.length,
        truncated,
        items,
      });
    }

    return groupings;
  }
}
