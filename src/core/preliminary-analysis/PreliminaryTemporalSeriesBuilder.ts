/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreliminaryFinancialTemporalSeries, PreliminaryFinancialTemporalSeriesItem, PreliminaryFinancialQualityFinding } from "./PreliminaryFinancialAnalysisContracts";
import { ResolvedField } from "./PreliminaryFieldResolver";
import { NumericParsingRules, DateParsingRules } from "./PreliminaryFinancialAnalysisPolicy";
import { PreliminaryNumericParser } from "./PreliminaryNumericParser";

export class PreliminaryTemporalSeriesBuilder {
  public static parseDateValue(value: unknown, rules: DateParsingRules): Date | null {
    if (value instanceof Date && Number.isFinite(value.getTime())) return value;
    if (typeof value === "number" && Number.isFinite(value) && value > 1) {
      const date = new Date(rules.excelEpochStartUTC + value * 24 * 60 * 60 * 1000);
      return Number.isFinite(date.getTime()) ? date : null;
    }

    if (!value) return null;
    const text = String(value).trim();
    const brDate = text.match(rules.brDateFormat);
    if (brDate) {
      const year = Number(brDate[3].length === 2 ? `20${brDate[3]}` : brDate[3]);
      const date = new Date(year, Number(brDate[2]) - 1, Number(brDate[1]));
      return Number.isFinite(date.getTime()) ? date : null;
    }

    const parsed = new Date(text);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  public static build(
    rows: any[],
    resolvedFields: ResolvedField[],
    numericRules: NumericParsingRules,
    dateRules: DateParsingRules,
    qualityFindings: PreliminaryFinancialQualityFinding[]
  ): PreliminaryFinancialTemporalSeries[] {
    const seriesList: PreliminaryFinancialTemporalSeries[] = [];

    const temporalFields = [
      { key: "emission_date", code: "EMISSION_MONTH", label: "Valor por mês de Emissão", valColKey: "value" },
      { key: "due_date", code: "DUE_MONTH", label: "Valor por mês de Vencimento", valColKey: "value" },
      { key: "payment_date", code: "PAYMENT_MONTH", label: "Valor Pago por mês de Pagamento", valColKey: "paid_value" },
    ];

    const valueCol = resolvedFields.find((f) => f.targetKey === "value")?.physicalName;
    const paidValueCol = resolvedFields.find((f) => f.targetKey === "paid_value")?.physicalName;
    const balanceCol = resolvedFields.find((f) => f.targetKey === "balance")?.physicalName;

    for (const tf of temporalFields) {
      const field = resolvedFields.find((f) => f.targetKey === tf.key);
      if (!field) continue;

      const physicalName = field.physicalName;
      const targetValCol = tf.valColKey === "value" ? valueCol : paidValueCol;

      const aggregates = new Map<string, {
        recordCount: number;
        valueTotal: number;
        paidValueTotal: number;
        balanceTotal: number;
      }>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Skip completely empty rows
        const values = Object.values(row).map(v => String(v ?? "").trim());
        const isRowEmpty = values.every(v => v === "");
        if (isRowEmpty) continue;

        const rawDate = row[physicalName];
        const parsedDate = this.parseDateValue(rawDate, dateRules);

        if (!parsedDate) {
          // Record quality finding for invalid date if it is not empty
          if (rawDate !== undefined && rawDate !== null && String(rawDate).trim() !== "") {
            qualityFindings.push({
              id: `err_date_${tf.code}_${i}`,
              code: `INVALID_DATE_${tf.code}`,
              severity: "WARNING",
              message: `Data inválida na coluna ${physicalName} (linha ${i + 2}): "${rawDate}"`,
              physicalRowIndex: i + 2,
              physicalColumnName: physicalName,
              invalidValue: String(rawDate),
            });
          }
          continue;
        }

        const year = parsedDate.getUTCFullYear();
        const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
        const periodKey = `${year}-${month}`;

        const v = valueCol ? PreliminaryNumericParser.parse(row[valueCol], numericRules).value : 0;
        const vp = paidValueCol ? PreliminaryNumericParser.parse(row[paidValueCol], numericRules).value : 0;
        const s = balanceCol ? PreliminaryNumericParser.parse(row[balanceCol], numericRules).value : 0;

        const existing = aggregates.get(periodKey);
        if (existing) {
          existing.recordCount++;
          existing.valueTotal += v;
          existing.paidValueTotal += vp;
          existing.balanceTotal += s;
        } else {
          aggregates.set(periodKey, {
            recordCount: 1,
            valueTotal: v,
            paidValueTotal: vp,
            balanceTotal: s,
          });
        }
      }

      // Convert and sort by periodKey ascending
      const items: PreliminaryFinancialTemporalSeriesItem[] = Array.from(aggregates.entries()).map(
        ([periodKey, agg]) => ({
          periodKey,
          recordCount: agg.recordCount,
          valueTotal: Number(agg.valueTotal.toFixed(2)),
          paidValueTotal: Number(agg.paidValueTotal.toFixed(2)),
          balanceTotal: Number(agg.balanceTotal.toFixed(2)),
        })
      );

      items.sort((a, b) => a.periodKey.localeCompare(b.periodKey));

      seriesList.push({
        seriesCode: tf.code,
        seriesLabel: tf.label,
        sourcePhysicalName: physicalName,
        items,
      });
    }

    return seriesList;
  }
}
