/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreliminaryFinancialMetric, PreliminaryFinancialQualityFinding } from "./PreliminaryFinancialAnalysisContracts";
import { PreliminaryNumericParser } from "./PreliminaryNumericParser";
import { NumericParsingRules } from "./PreliminaryFinancialAnalysisPolicy";
import { ResolvedField } from "./PreliminaryFieldResolver";

export class PreliminaryMetricsCalculator {
  public static calculate(
    rows: any[],
    resolvedFields: ResolvedField[],
    numericRules: NumericParsingRules,
    provenance: { sourceId: string; workbookId: string; containerId: string; sheetName: string }
  ): {
    metrics: PreliminaryFinancialMetric[];
    qualityFindings: PreliminaryFinancialQualityFinding[];
    counts: {
      physicalRowCount: number;
      headerRowCount: number;
      dataRowCount: number;
      validRowCount: number;
      partiallyValidRowCount: number;
      excludedRowCount: number;
      emptyRowCount: number;
    };
  } {
    const qualityFindings: PreliminaryFinancialQualityFinding[] = [];
    
    // Find resolved column names
    const valueCol = resolvedFields.find((f) => f.targetKey === "value")?.physicalName;
    const paidValueCol = resolvedFields.find((f) => f.targetKey === "paid_value")?.physicalName;
    const balanceCol = resolvedFields.find((f) => f.targetKey === "balance")?.physicalName;
    const paymentDateCol = resolvedFields.find((f) => f.targetKey === "payment_date")?.physicalName;
    const currencyCol = resolvedFields.find((f) => f.targetKey === "moeda")?.physicalName || "Moeda";

    let valueTotal = 0;
    let paidValueTotal = 0;
    let balanceTotal = 0;

    let valueValidCount = 0;
    let valueExcludedCount = 0;

    let paidValueValidCount = 0;
    let paidValueExcludedCount = 0;

    let balanceValidCount = 0;
    let balanceExcludedCount = 0;

    let nonZeroBalanceCount = 0;
    let withoutPaymentDateCount = 0;
    const observedCurrencies = new Set<string>();

    const physicalRowCount = rows.length + 1; // Assuming 1 header row
    const headerRowCount = 1;
    let emptyRowCount = 0;
    let validRowCount = 0;
    let partiallyValidRowCount = 0;
    let excludedRowCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Check if row is completely empty
      const values = Object.values(row).map(v => String(v ?? "").trim());
      const isRowEmpty = values.every(v => v === "");
      if (isRowEmpty) {
        emptyRowCount++;
        continue;
      }

      // Check validation status of mapped fields in this row
      let rowValidFieldsCount = 0;
      let rowTotalFieldsCount = 0;

      // 1. Value
      if (valueCol) {
        rowTotalFieldsCount++;
        const parsed = PreliminaryNumericParser.parse(row[valueCol], numericRules);
        if (parsed.isValid) {
          valueTotal += parsed.value;
          valueValidCount++;
          rowValidFieldsCount++;
        } else {
          valueExcludedCount++;
          qualityFindings.push({
            id: `err_val_${i}`,
            code: "INVALID_VALUE_NUMBER",
            severity: "WARNING",
            message: `Valor inválido na linha ${i + 2}: "${row[valueCol] || ""}"`,
            physicalRowIndex: i + 2,
            physicalColumnName: valueCol,
            invalidValue: String(row[valueCol] || ""),
          });
        }
      }

      // 2. Paid Value
      if (paidValueCol) {
        rowTotalFieldsCount++;
        const parsed = PreliminaryNumericParser.parse(row[paidValueCol], numericRules);
        if (parsed.isValid) {
          paidValueTotal += parsed.value;
          paidValueValidCount++;
          rowValidFieldsCount++;
        } else {
          paidValueExcludedCount++;
          qualityFindings.push({
            id: `err_paid_val_${i}`,
            code: "INVALID_PAID_VALUE_NUMBER",
            severity: "WARNING",
            message: `Valor pago inválido na linha ${i + 2}: "${row[paidValueCol] || ""}"`,
            physicalRowIndex: i + 2,
            physicalColumnName: paidValueCol,
            invalidValue: String(row[paidValueCol] || ""),
          });
        }
      }

      // 3. Balance
      if (balanceCol) {
        rowTotalFieldsCount++;
        const parsed = PreliminaryNumericParser.parse(row[balanceCol], numericRules);
        if (parsed.isValid) {
          balanceTotal += parsed.value;
          balanceValidCount++;
          rowValidFieldsCount++;
          if (parsed.value !== 0) {
            nonZeroBalanceCount++;
          }
        } else {
          balanceExcludedCount++;
          qualityFindings.push({
            id: `err_bal_${i}`,
            code: "INVALID_BALANCE_NUMBER",
            severity: "WARNING",
            message: `Saldo inválido na linha ${i + 2}: "${row[balanceCol] || ""}"`,
            physicalRowIndex: i + 2,
            physicalColumnName: balanceCol,
            invalidValue: String(row[balanceCol] || ""),
          });
        }
      }

      // 4. Payment Date
      if (paymentDateCol) {
        rowTotalFieldsCount++;
        const pDate = row[paymentDateCol];
        if (pDate === undefined || pDate === null || String(pDate).trim() === "") {
          withoutPaymentDateCount++;
        } else {
          rowValidFieldsCount++;
        }
      } else {
        // Mapped column for payment date not resolved, count as missing
        withoutPaymentDateCount++;
      }

      // Currency
      const currency = row[currencyCol] || row["Moeda"] || row["moeda"];
      if (currency) {
        observedCurrencies.add(String(currency).toUpperCase().trim());
      }

      // Row status classification
      if (rowValidFieldsCount === rowTotalFieldsCount) {
        validRowCount++;
      } else if (rowValidFieldsCount > 0) {
        partiallyValidRowCount++;
      } else {
        excludedRowCount++;
      }
    }

    const dataRowCount = rows.length - emptyRowCount;

    const metrics: PreliminaryFinancialMetric[] = [
      {
        metricId: `met_rec_count`,
        code: "RECORD_COUNT",
        label: "Total de Registros",
        value: dataRowCount,
        unit: "rows",
        validInputCount: dataRowCount,
        excludedInputCount: 0,
        limitations: [],
        provenance,
      },
      {
        metricId: `met_valid_rec_count`,
        code: "VALID_RECORD_COUNT",
        label: "Registros Válidos",
        value: validRowCount,
        unit: "rows",
        validInputCount: validRowCount,
        excludedInputCount: 0,
        limitations: [],
        provenance,
      },
      {
        metricId: `met_excl_rec_count`,
        code: "EXCLUDED_RECORD_COUNT",
        label: "Registros Excluídos",
        value: excludedRowCount,
        unit: "rows",
        validInputCount: excludedRowCount,
        excludedInputCount: 0,
        limitations: [],
        provenance,
      },
      {
        metricId: `met_val_total`,
        code: "VALUE_TOTAL",
        label: "Valor Total",
        value: valueTotal,
        unit: "BRL",
        sourcePhysicalName: valueCol,
        validInputCount: valueValidCount,
        excludedInputCount: valueExcludedCount,
        limitations: valueExcludedCount > 0 ? ["Existem valores numéricos inválidos ignorados no cálculo."] : [],
        provenance,
      },
      {
        metricId: `met_paid_val_total`,
        code: "PAID_VALUE_TOTAL",
        label: "Valor Pago Total",
        value: paidValueTotal,
        unit: "BRL",
        sourcePhysicalName: paidValueCol,
        validInputCount: paidValueValidCount,
        excludedInputCount: paidValueExcludedCount,
        limitations: paidValueExcludedCount > 0 ? ["Existem valores pagos inválidos ignorados no cálculo."] : [],
        provenance,
      },
      {
        metricId: `met_bal_total`,
        code: "BALANCE_TOTAL",
        label: "Saldo Total",
        value: balanceTotal,
        unit: "BRL",
        sourcePhysicalName: balanceCol,
        validInputCount: balanceValidCount,
        excludedInputCount: balanceExcludedCount,
        limitations: balanceExcludedCount > 0 ? ["Existem saldos inválidos ignorados no cálculo."] : [],
        provenance,
      },
      {
        metricId: `met_nz_bal_count`,
        code: "NON_ZERO_BALANCE_COUNT",
        label: "Registros com Saldo em Aberto",
        value: nonZeroBalanceCount,
        unit: "count",
        validInputCount: balanceValidCount,
        excludedInputCount: balanceExcludedCount,
        limitations: [],
        provenance,
      },
      {
        metricId: `met_without_pd_count`,
        code: "WITHOUT_PAYMENT_DATE_COUNT",
        label: "Registros sem Data de Pagamento",
        value: withoutPaymentDateCount,
        unit: "count",
        validInputCount: rows.length,
        excludedInputCount: 0,
        limitations: [],
        provenance,
      },
      {
        metricId: `met_obs_curr_count`,
        code: "OBSERVED_CURRENCY_COUNT",
        label: "Moedas Observadas",
        value: observedCurrencies.size,
        unit: "currencies",
        validInputCount: rows.length,
        excludedInputCount: 0,
        limitations: [],
        provenance,
      },
    ];

    return {
      metrics,
      qualityFindings,
      counts: {
        physicalRowCount,
        headerRowCount,
        dataRowCount,
        validRowCount,
        partiallyValidRowCount,
        excludedRowCount,
        emptyRowCount,
      },
    };
  }
}
