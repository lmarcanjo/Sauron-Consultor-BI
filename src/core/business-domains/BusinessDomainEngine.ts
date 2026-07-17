/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { businessDomainRegistry } from "./BusinessDomainRegistry";
import { 
  BusinessVocabulary, 
  BusinessHierarchy, 
  BusinessKpi, 
  BusinessMeetingTemplate, 
  BusinessPresentationTemplate 
} from "./BusinessDomainTypes";
import { businessVocabularyEngine } from "./BusinessVocabularyEngine";
import { businessHierarchyEngine } from "./BusinessHierarchyEngine";
import { businessKpiEngine } from "./BusinessKpiEngine";
import { businessMeetingEngine } from "./BusinessMeetingEngine";
import { businessPresentationEngine } from "./BusinessPresentationEngine";
import { WorkbookCatalog } from "../workbook/WorkbookTypes";

export class BusinessDomainEngine {
  /**
   * Detects the business domain of a workbook by analyzing its sheets, tables, metadata, and column headers.
   */
  public detectDomain(workbook: WorkbookCatalog): string {
    const packs = businessDomainRegistry.list().filter(p => p.manifest.id !== "shared");

    const workbookHeaders = new Set<string>();

    if (workbook.columns && Array.isArray(workbook.columns)) {
      workbook.columns.forEach(col => {
        if (col.originalName) {
          workbookHeaders.add(col.originalName.toLowerCase().trim());
        }
      });
    }

    if (workbook.tables && Array.isArray(workbook.tables)) {
      workbook.tables.forEach(table => {
        if (table.headers && Array.isArray(table.headers)) {
          table.headers.forEach(h => {
            workbookHeaders.add(h.toLowerCase().trim());
          });
        }
      });
    }

    if (workbook.sheets && Array.isArray(workbook.sheets)) {
      workbook.sheets.forEach(sheet => {
        if (sheet.preview && Array.isArray(sheet.preview)) {
          sheet.preview.forEach(row => {
            if (row.cells && Array.isArray(row.cells)) {
              row.cells.forEach(cell => {
                if (typeof cell.value === "string" && cell.value.length < 50) {
                  workbookHeaders.add(cell.value.toLowerCase().trim());
                }
              });
            }
          });
        }
      });
    }

    let bestDomain = "shared";
    let maxScore = 0;

    for (const pack of packs) {
      let score = 0;

      const mappings = pack.mapping.suggestedMappings;
      const mappedTargets = Object.values(mappings).map(v => v.toLowerCase().trim());
      const mappedKeys = Object.keys(mappings).map(k => k.toLowerCase().trim());

      const vocabTerms = new Set<string>();
      if (pack.vocabulary && pack.vocabulary.terms) {
        pack.vocabulary.terms.forEach(t => {
          vocabTerms.add(t.term.toLowerCase().trim());
          t.synonyms.forEach(s => vocabTerms.add(s.toLowerCase().trim()));
        });
      }

      workbookHeaders.forEach(header => {
        if (vocabTerms.has(header)) {
          score += 2;
        }
        if (mappedTargets.includes(header) || mappedKeys.includes(header)) {
          score += 1;
        }
      });

      if (workbook.metadata && workbook.metadata.name) {
        const fileName = workbook.metadata.name.toLowerCase();
        if (fileName.includes(pack.manifest.id) || fileName.includes(pack.manifest.name.toLowerCase())) {
          score += 5;
        }
      }

      if (workbook.sheets) {
        workbook.sheets.forEach(sheet => {
          const sheetName = sheet.name.toLowerCase();
          if (sheetName.includes(pack.manifest.id) || sheetName.includes(pack.manifest.name.toLowerCase())) {
            score += 3;
          }
          if (vocabTerms.has(sheetName)) {
            score += 2;
          }
        });
      }

      if (score > maxScore) {
        maxScore = score;
        bestDomain = pack.manifest.id;
      }
    }

    return bestDomain;
  }

  /**
   * Detects subdomain within a workbook.
   */
  public detectSubDomain(workbook: WorkbookCatalog): string | null {
    const domainId = this.detectDomain(workbook);
    const pack = businessDomainRegistry.get(domainId);
    if (!pack || !pack.manifest.subdomains || pack.manifest.subdomains.length === 0) {
      return null;
    }

    const allText = new Set<string>();
    if (workbook.sheets) {
      workbook.sheets.forEach(s => allText.add(s.name.toLowerCase()));
    }
    if (workbook.columns) {
      workbook.columns.forEach(c => {
        if (c.originalName) allText.add(c.originalName.toLowerCase());
      });
    }

    for (const sub of pack.manifest.subdomains) {
      const subLower = sub.toLowerCase();
      for (const text of allText) {
        if (text.includes(subLower)) {
          return sub;
        }
      }
    }

    return null;
  }

  public getVocabulary(domain: string): BusinessVocabulary | null {
    const pack = businessDomainRegistry.get(domain);
    return pack ? pack.vocabulary : null;
  }

  public getHierarchy(domain: string): BusinessHierarchy | null {
    return businessHierarchyEngine.getHierarchy(domain);
  }

  public getKPIs(domain: string): BusinessKpi[] {
    return businessKpiEngine.getKPIs(domain);
  }

  public getMeetingTemplate(domain: string): BusinessMeetingTemplate | null {
    return businessMeetingEngine.getMeetingTemplate(domain);
  }

  public getPresentationTemplate(domain: string): BusinessPresentationTemplate | null {
    return businessPresentationEngine.getPresentationTemplate(domain);
  }

  public getActiveDomainId(): string {
    if (typeof localStorage === "undefined") return "shared";
    try {
      const raw = localStorage.getItem("sauron_workspace_registry");
      if (raw) {
        const state = JSON.parse(raw);
        const currentId = state.currentWorkspaceId;
        if (currentId && state.workspaces && state.workspaces[currentId]) {
          const ws = state.workspaces[currentId];
          return ws.manualDomain || ws.detectedDomain || ws.businessDomain || "shared";
        }
      }
    } catch (e) {
      // ignore
    }
    return "shared";
  }

  public translateToDomain(label: string): string {
    const domainId = this.getActiveDomainId();
    if (domainId === "shared" || domainId === "unknown") return label;

    let result = label;
    const domainMap = businessDomainRegistry.get(domainId)?.terminology;
    if (!domainMap) return label;

    Object.entries(domainMap).forEach(([key, replacement]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        const isCapitalized = match[0] === match[0].toUpperCase();
        const isAllUpper = match === match.toUpperCase();
        let rep = replacement;
        if (isAllUpper) {
          rep = rep.toUpperCase();
        } else if (isCapitalized) {
          rep = rep[0].toUpperCase() + rep.slice(1);
        } else {
          rep = rep.toLowerCase();
        }
        return rep;
      });
    });

    return result;
  }

  public adaptDatasetToCatalog(dataset: any): WorkbookCatalog {
    if (!dataset) {
      return {
        id: "",
        metadata: { id: "", name: "", extension: "", importedAt: "", hash: "", sheetCount: 0, rowCount: 0, columnCount: 0, cellCount: 0 },
        sheets: [],
        tables: [],
        columns: [],
        namedRanges: [],
        formulas: [],
        pivotTables: [],
        charts: [],
        hiddenRows: [],
        hiddenColumns: [],
        freezePanes: [],
        mergedCells: [],
        conditionalFormatting: [],
        dataValidation: [],
        dependencies: { nodes: [], edges: [] },
        diagnostics: {
          sheetCount: 0,
          rowCount: 0,
          columnCount: 0,
          formulaCount: 0,
          chartCount: 0,
          tableCount: 0,
          pivotTableCount: 0,
          namedRangeCount: 0,
          mergedCellCount: 0,
          dataValidationCount: 0,
          conditionalFormattingCount: 0,
          emptyColumns: [],
          duplicateHeaders: [],
          mixedTypes: [],
          patternChanges: [],
          structuralIssues: [],
          performance: { profilingRowsPerSheetLimit: null, pagedReading: false, fullWorkbookLoadedByParser: false }
        },
        createdAt: ""
      };
    }
    
    const columns = (dataset.columnProfiles || []).map((col: any) => ({
      originalName: col.originalName || col.name,
      alias: col.alias || col.name || "",
      sheetName: col.sheetName || "",
      columnIndex: 0,
      columnLetter: "",
      inferredType: "text",
      valueCount: 0,
      emptyCount: 0,
      uniqueCount: 0,
      duplicateCount: 0,
      fillRate: 1,
      minValue: null,
      maxValue: null,
      examples: [],
      textPattern: null,
      numericPattern: null,
      possibleDates: 0,
      possibleCpfs: 0,
      possibleCnpjs: 0,
      possiblePhones: 0,
      possibleCeps: 0,
      possibleCodes: 0,
      possibleIds: 0
    }));

    const sheets = (dataset.sheets || []).map((sh: any) => {
      const sheetName = typeof sh === "string" ? sh : sh.sheetName;
      const sheetPreviewRows = (dataset.previewRows || [])
        .filter((row: any) => row.metadata?.sheetName === sheetName)
        .map((row: any, rIdx: number) => {
          const cells = Object.entries(row.normalized || row.raw || {}).map(([key, value]) => ({
            address: key,
            value: value
          }));
          return { rowIndex: rIdx, cells };
        });

      return {
        id: sheetName,
        name: sheetName,
        index: 0,
        visibility: "visible" as const,
        rowCount: typeof sh === "string" ? 0 : sh.rowCount,
        columnCount: typeof sh === "string" ? 0 : sh.columnCount,
        usedRange: null,
        preview: sheetPreviewRows,
        hasFormulas: false,
        hasCharts: false,
        hasPivot: false,
        hasTables: false,
        hasMergedCells: false,
        hasConditionalFormatting: false,
        hasNamedRanges: false,
        hasHiddenRows: false,
        hasHiddenColumns: false
      };
    });

    return {
      id: dataset.datasetId || "",
      metadata: {
        id: dataset.datasetId || "",
        name: dataset.sourceName || "",
        extension: dataset.sourceName?.endsWith(".csv") ? ".csv" : ".xlsx",
        importedAt: dataset.importedAt || "",
        hash: dataset.rawStorageRef || "",
        sheetCount: sheets.length,
        rowCount: dataset.rowCount || 0,
        columnCount: dataset.columnCount || 0,
        cellCount: 0
      },
      sheets,
      tables: [],
      columns,
      namedRanges: [],
      formulas: [],
      pivotTables: [],
      charts: [],
      hiddenRows: [],
      hiddenColumns: [],
      freezePanes: [],
      mergedCells: [],
      conditionalFormatting: [],
      dataValidation: [],
      dependencies: { nodes: [], edges: [] },
      diagnostics: {
        sheetCount: sheets.length,
        rowCount: dataset.rowCount || 0,
        columnCount: dataset.columnCount || 0,
        formulaCount: 0,
        chartCount: 0,
        tableCount: 0,
        pivotTableCount: 0,
        namedRangeCount: 0,
        mergedCellCount: 0,
        dataValidationCount: 0,
        conditionalFormattingCount: 0,
        emptyColumns: [],
        duplicateHeaders: [],
        mixedTypes: [],
        patternChanges: [],
        structuralIssues: [],
        performance: { profilingRowsPerSheetLimit: null, pagedReading: false, fullWorkbookLoadedByParser: false }
      },
      createdAt: dataset.importedAt || ""
    };
  }
}

export const businessDomainEngine = new BusinessDomainEngine();
export default businessDomainEngine;
