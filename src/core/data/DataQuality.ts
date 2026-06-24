/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dataSourceManager } from "./DataSourceManager";

export interface QualityReport {
  score: number;
  label: "Excelente" | "Boa" | "Atenção" | "Crítica";
  findings: string[];
}

export class DataQuality {
  private static instance: DataQuality;

  private constructor() {}

  public static getInstance(): DataQuality {
    if (!DataQuality.instance) {
      DataQuality.instance = new DataQuality();
    }
    return DataQuality.instance;
  }

  /**
   * Assesses a set of records for compliance and structural hygiene, generating a comprehensive report.
   */
  public evaluateRecords(records: any[]): QualityReport {
    const rawRes = dataSourceManager.calculateQualityScore(records);
    return {
      score: rawRes.score,
      label: rawRes.label,
      findings: rawRes.report
    };
  }
}

export const dataQuality = DataQuality.getInstance();
