/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { businessDomainRegistry } from "./BusinessDomainRegistry";
import { businessDomainEngine } from "./BusinessDomainEngine";
import { WorkbookCatalog } from "../workbook/WorkbookTypes";

export interface DomainDiagnosticsReport {
  isValidRegistry: boolean;
  registeredPacksCount: number;
  missingFilesByPack: Record<string, string[]>;
  workbookDomainMatch?: {
    detectedDomain: string;
    score: number;
    unmappedColumns: string[];
    mappedColumnsCount: number;
    totalColumnsCount: number;
    coveragePercentage: number;
  };
}

export class BusinessDomainDiagnostics {
  /**
   * Audits the state of the registry and verify basic integrity of domain packs.
   */
  public diagnoseRegistry(): DomainDiagnosticsReport {
    const packs = businessDomainRegistry.list();
    const missingFiles: Record<string, string[]> = {};
    let isValid = true;

    packs.forEach(pack => {
      const missing: string[] = [];
      if (!pack.manifest) missing.push("manifest");
      if (!pack.vocabulary) missing.push("vocabulary");
      if (!pack.hierarchy) missing.push("hierarchy");
      if (!pack.kpis) missing.push("kpis");
      if (!pack.meeting) missing.push("meeting");
      if (!pack.presentation) missing.push("presentation");
      if (!pack.rules) missing.push("rules");
      if (!pack.mapping) missing.push("mapping");

      if (missing.length > 0) {
        missingFiles[pack.manifest.id] = missing;
        isValid = false;
      }
    });

    return {
      isValidRegistry: isValid,
      registeredPacksCount: packs.length,
      missingFilesByPack: missingFiles
    };
  }

  /**
   * Diagnoses a workbook against the Business Domain Framework.
   */
  public diagnoseWorkbook(workbook: WorkbookCatalog): DomainDiagnosticsReport["workbookDomainMatch"] {
    const detectedDomain = businessDomainEngine.detectDomain(workbook);
    const pack = businessDomainRegistry.get(detectedDomain);

    if (!pack) {
      return {
        detectedDomain,
        score: 0,
        unmappedColumns: [],
        mappedColumnsCount: 0,
        totalColumnsCount: 0,
        coveragePercentage: 0
      };
    }

    const workbookHeaders: string[] = [];
    if (workbook.columns) {
      workbook.columns.forEach(col => {
        if (col.originalName) {
          workbookHeaders.push(col.originalName);
        }
      });
    }

    const mappings = pack.mapping.suggestedMappings;
    const mappedKeys = new Set(Object.keys(mappings).map(k => k.toLowerCase()));
    const mappedValues = new Set(Object.values(mappings).map(v => v.toLowerCase()));

    let mappedCount = 0;
    const unmapped: string[] = [];

    const vocabLower = pack.vocabulary.terms.map(t => t.term.toLowerCase());
    const synsLower = pack.vocabulary.terms.flatMap(t => t.synonyms.map(s => s.toLowerCase()));

    workbookHeaders.forEach(header => {
      const headerLower = header.toLowerCase();
      if (mappedKeys.has(headerLower) || mappedValues.has(headerLower)) {
        mappedCount++;
      } else if (vocabLower.includes(headerLower) || synsLower.includes(headerLower)) {
        mappedCount++;
      } else {
        unmapped.push(header);
      }
    });

    const totalCount = workbookHeaders.length;
    const coveragePercentage = totalCount > 0 ? (mappedCount / totalCount) * 100 : 100;

    return {
      detectedDomain,
      score: totalCount > 0 ? mappedCount : 0,
      unmappedColumns: unmapped,
      mappedColumnsCount: mappedCount,
      totalColumnsCount: totalCount,
      coveragePercentage
    };
  }
}

export const businessDomainDiagnostics = new BusinessDomainDiagnostics();
export default businessDomainDiagnostics;
