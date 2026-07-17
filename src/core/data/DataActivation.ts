import { activeDatasetStore } from "./ActiveDatasetStore";
import { setEnterpriseContext, getEnterpriseContext } from "../enterprise-consolidation/EnterpriseContextStore";
import { spreadsheetStorageAdapter } from "../storage/IndexedSpreadsheetStorageAdapter";
import { workbookRepository as libraryWorkbookRepository } from "../workbook-library/WorkbookRepository";
import { workbookRepository as coreWorkbookRepository } from "../workbook/WorkbookRepository";
import { ActiveDataset, ActiveDatasetRow } from "../../types/dataSource";
import { EnterpriseContext } from "../enterprise-consolidation/EnterpriseContextTypes";
import { activeSourceSelectionStore } from "./ActiveSourceSelectionStore";
import { workspaceIntelligenceEngine } from "../workspace-intelligence/WorkspaceIntelligenceEngine";
import { businessDomainEngine } from "../business-domains/BusinessDomainEngine";
import { platformLogger } from "../platform/PlatformLogger";
import { withSourceIdentity } from "./sourceIdentity";
import { identityEngine } from "../identity/IdentityEngine";

export interface ActivateImportedSourcesParams {
  workbookIds: string[];
  datasetIds: string[];
  enterpriseContext: EnterpriseContext;
}

function getWorkspaceRegistry(): any {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("sauron_workspace_registry");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveWorkspaceRegistry(state: any): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem("sauron_workspace_registry", JSON.stringify(state));
  } catch (e) {
    platformLogger.error("[DataActivation] Failed to save workspace registry:", e);
  }
}

export async function activateImportedSources({
  workbookIds,
  datasetIds,
  enterpriseContext
}: ActivateImportedSourcesParams): Promise<void> {
  platformLogger.info(`[DataActivation] Starting transacting unified activation for workbooks:`, workbookIds, `datasets:`, datasetIds);

  // 1. PREPARE: Capture previous state for transaction recovery
  const prevDataset = activeDatasetStore.getActiveDataset();
  const prevRows = activeDatasetStore.getActiveRows();
  const prevContext = getEnterpriseContext();
  const prevRegistry = getWorkspaceRegistry();
  
  const registry = getWorkspaceRegistry();
  const workspaceId = registry?.currentWorkspaceId || "workspace_default";
  const canonicalWorkspaceId = identityEngine.getCurrentWorkspace()?.id || workspaceId;
  const prevSelection = activeSourceSelectionStore.get(workspaceId);

  try {
    // 2. Perform validation and data load
    const allDatasets: ActiveDataset[] = [];
    const allEnterprises = await (await import("../persistence/EnterpriseRepository")).enterpriseRepository.getAll();

    for (const id of datasetIds) {
      let dataset: ActiveDataset | null = null;

      // Check library repo
      try {
        const version = libraryWorkbookRepository.getCurrentVersion(id);
        if (version?.activeDataset) {
          dataset = version.activeDataset;
        } else {
          const wbs = libraryWorkbookRepository.listWorkbooks();
          for (const wb of wbs) {
            const v = libraryWorkbookRepository.getCurrentVersion(wb.id);
            if (v?.activeDataset?.datasetId === id) {
              dataset = v.activeDataset;
              break;
            }
          }
        }
      } catch (e) {
        platformLogger.warn(`[DataActivation] Error checking library repo for dataset ${id}:`, e);
      }

      // Check core repo
      if (!dataset) {
        try {
          const coreWb = coreWorkbookRepository.get(id);
          if (coreWb && (coreWb as any).activeDataset) {
            dataset = (coreWb as any).activeDataset;
          }
        } catch (e) {
          platformLogger.warn(`[DataActivation] Error checking core repo for dataset ${id}:`, e);
        }
      }

      // Fallback IndexedDB
      if (!dataset) {
        const metadata = await spreadsheetStorageAdapter.getMetadata(id);
        if (!metadata) {
          throw new Error(`Fonte de dados não encontrada no repositório ou IndexedDB: ${id}`);
        }
        
        dataset = {
          datasetId: id,
          sourceType: "SPREADSHEET_DATA",
          sourceName: metadata.fileName,
          importedAt: metadata.uploadedAt || new Date().toISOString(),
          rowCount: metadata.sheets.reduce((sum, s) => sum + s.rowCount, 0),
          columnCount: metadata.sheets[0]?.columns.length || 0,
          sheets: metadata.sheets.map(s => ({
            sheetName: s.sheetName,
            rowCount: s.rowCount,
            columnCount: s.columns.length,
            formulaCount: 0,
            storageRef: `ref_${id}_${s.sheetName}`,
            classification: "Base de dados",
            selectedForImport: true
          })),
          activeSheet: metadata.sheets[0]?.sheetName || "",
          previewRows: [],
          columnProfiles: [],
          importProfile: null,
          rawStorageRef: id,
          status: "ACTIVE"
        };
      }

      // Verify that data is actually persisted in storage using lightweight port methods
      const hasMeta = await spreadsheetStorageAdapter.hasMetadata(id);
      const rowCount = await spreadsheetStorageAdapter.getRowCount(id);
      const hasRows = await spreadsheetStorageAdapter.hasRows(id, dataset.activeSheet || "Dados");
      
      if (!hasMeta || rowCount === 0 || !hasRows) {
        throw new Error(`Persistência de dados incompleta ou corrompida no IndexedDB para a fonte ${id}`);
      }

      // Keep only a bounded preview in the active bus. The complete source is
      // already persisted per workbook/sheet and remains queryable on demand.
      if (dataset.previewRows.length === 0) {
        const previewRows = await spreadsheetStorageAdapter.getRowsPaged(
          id,
          dataset.activeSheet || "Dados",
          0,
          100
        );
        dataset = {
          ...dataset,
          previewRows: previewRows.map((row, idx) => ({
            raw: row,
            normalized: row,
            metadata: {
              rowIndex: idx + 1,
              sheetName: dataset!.activeSheet || "Dados",
              fileName: dataset!.sourceName,
            },
          })),
        };
      }

      allDatasets.push(withSourceIdentity(dataset));
    }

    // 3. Domain detection & separation rules
    let bestDomain = "neutral";
    let bestConfidence = 0;
    for (const dataset of allDatasets) {
      const catalog = businessDomainEngine.adaptDatasetToCatalog(dataset);
      const domainId = businessDomainEngine.detectDomain(catalog);
      const decision = workspaceIntelligenceEngine.evaluateWorkbookImport(dataset, dataset.datasetId);
      const confidence = decision.domain.confidence;
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestDomain = domainId;
      }
    }

    const activeCompany = allEnterprises.find(e => e.id === enterpriseContext.companyId);
    const companySegment = activeCompany?.segment;
    const manualDomain = registry?.workspaces[workspaceId]?.manualDomain;

    let resolvedDomain = "neutral";
    if (manualDomain && manualDomain !== "neutral" && manualDomain !== "unknown") {
      resolvedDomain = manualDomain;
    } else if (companySegment && companySegment !== "neutral" && companySegment !== "unknown") {
      resolvedDomain = companySegment;
    } else if (bestConfidence >= 85 && bestDomain !== "neutral" && bestDomain !== "unknown") {
      resolvedDomain = bestDomain;
    }

    // Update workspace properties
    if (registry && registry.workspaces[workspaceId]) {
      const ws = registry.workspaces[workspaceId];
      ws.detectedDomain = bestDomain;
      ws.domainConfidence = bestConfidence;
      if (bestConfidence >= 85 && (!ws.manualDomain || ws.manualDomain === "neutral")) {
        ws.businessDomain = bestDomain as any;
      }
      ws.updatedAt = new Date().toISOString();
      saveWorkspaceRegistry(registry);
    }

    // 4. COMMIT phase. Active selections are scoped by organizational context;
    // the legacy workspace lookup remains read-compatible for old sessions.
    const scopeId = enterpriseContext.scope === "GROUP"
      ? enterpriseContext.groupId
      : enterpriseContext.scope === "COMPANY"
        ? enterpriseContext.companyId
        : enterpriseContext.unitId;
    if (enterpriseContext.scope !== "WORKBOOK" && scopeId) {
      activeSourceSelectionStore.setForScope({
        tenantId: "local",
        workspaceId: canonicalWorkspaceId,
        scopeType: enterpriseContext.scope,
        scopeId,
      }, workbookIds);
    }

    // Set enterprise context
    const updatedContext: EnterpriseContext = {
      ...enterpriseContext,
      workspaceId: enterpriseContext.workspaceId || canonicalWorkspaceId,
      workbookIds,
      datasetIds
    };
    setEnterpriseContext(updatedContext, { refreshSources: false });

    // Set dataset store
    if (allDatasets.length === 0) {
      activeDatasetStore.clearActiveDataset();
      return;
    }

    let finalActiveDataset: ActiveDataset;
    if (allDatasets.length === 1) {
      finalActiveDataset = allDatasets[0];
    } else {
      const combinedId = `combined_${datasetIds.slice().sort().join("_")}`;
      const sourceNames = allDatasets.map(d => d.sourceName).join(", ");
      
      const combinedPreview: ActiveDatasetRow[] = allDatasets
        .flatMap(dataset => dataset.previewRows.slice(0, 5))
        .slice(0, 20)
        .map((row, idx) => ({
        raw: row.raw,
        normalized: row.normalized,
        metadata: {
          rowIndex: row.metadata.rowIndex || idx + 1,
          sheetName: row.metadata.sheetName || "Dados",
          fileName: row.metadata.fileName || "Consolidado",
        }
      }));

      const allProfiles = [] as ActiveDataset["columnProfiles"];
      const seenCols = new Set<string>();
      allDatasets.forEach(d => {
        d.columnProfiles?.forEach(p => {
          if (!seenCols.has(p.name)) {
            seenCols.add(p.name);
            allProfiles.push(p);
          }
        });
      });

      finalActiveDataset = {
        datasetId: combinedId,
        sourceType: "SPREADSHEET_DATA",
        sourceName: sourceNames,
        importedAt: new Date().toISOString(),
        rowCount: allDatasets.reduce((sum, dataset) => sum + dataset.rowCount, 0),
        columnCount: Math.max(...allDatasets.map(d => d.columnCount)),
        sheets: allDatasets.flatMap(d => d.sheets),
        activeSheet: allDatasets[0].activeSheet,
        previewRows: combinedPreview,
        columnProfiles: allProfiles,
        importProfile: null,
        rawStorageRef: allDatasets[0].rawStorageRef,
        sourceDatasetIds: datasetIds,
        sourceWorkbookIds: workbookIds,
        status: "ACTIVE"
      };
    }

    activeDatasetStore.setActiveDataset(finalActiveDataset);

    // Sync template state with resolved domain
    platformLogger.info(`[DataActivation] Transacting activation complete. Resolved Domain: ${resolvedDomain}. Activated ${finalActiveDataset.rowCount} source rows through metadata and preview.`);

  } catch (err) {
    platformLogger.error(`[DataActivation] Unified activation failed! Commencing ROLLBACK phase...`, err);

    // 5. ROLLBACK phase
    if (prevDataset) {
      activeDatasetStore.setActiveDataset(prevDataset, prevRows);
    } else {
      activeDatasetStore.clearActiveDataset();
    }

    setEnterpriseContext(prevContext, { refreshSources: false });

    if (prevRegistry) {
      saveWorkspaceRegistry(prevRegistry);
    }

    if (prevSelection) {
      activeSourceSelectionStore.set(prevSelection);
    } else if (workspaceId) {
      activeSourceSelectionStore.delete(workspaceId);
    }

    throw err;
  }
}
