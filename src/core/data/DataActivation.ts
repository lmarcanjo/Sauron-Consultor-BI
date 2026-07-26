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
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import { enterpriseRepository } from "../persistence/EnterpriseRepository";
import { NormalizedDatabaseConfig, DatabaseSourceSelection } from "../connections/DatabaseConfig";

export interface ActivateImportedSourcesParams {
  workbookIds: string[];
  datasetIds: string[];
  enterpriseContext: EnterpriseContext;
}

export interface ActivateDatabaseSourceParams {
  records: any[];
  sourceLabel: string;
  config: NormalizedDatabaseConfig;
  enterpriseContext: EnterpriseContext;
  expectedSourceId?: string;
}

export type { DatabaseSourceSelection } from "../connections/DatabaseConfig";

function databaseSourceFingerprint(config: NormalizedDatabaseConfig, context: EnterpriseContext): string {
  return [
    config.type,
    config.host || "connection",
    config.port || "",
    config.database,
    config.table || config.query || "query",
    context.groupId || "",
    context.companyId || "",
  ].join("|");
}

function stableDatabaseSourceId(config: NormalizedDatabaseConfig, context: EnterpriseContext): string {
  const fingerprint = databaseSourceFingerprint(config, context);
  let hash = 2166136261;
  for (let index = 0; index < fingerprint.length; index += 1) {
    hash ^= fingerprint.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sql_source_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export { stableDatabaseSourceId };

function databaseColumns(records: any[]): string[] {
  return Array.from(new Set(records.flatMap(row => Object.keys(row || {}))))
    .filter(column => column !== "id");
}

/** Publishes a fetched SQL table through the same canonical activation path. */
export async function activateDatabaseSource({
  records,
  sourceLabel,
  config,
  enterpriseContext,
  expectedSourceId,
}: ActivateDatabaseSourceParams): Promise<string> {
  if (!records.length) throw new Error("A tabela selecionada não retornou registros para ativação.");
  if (!enterpriseContext.groupId) throw new Error("Selecione um grupo antes de ativar a fonte SQL.");
  if (enterpriseContext.scope === "COMPANY" && !enterpriseContext.companyId) {
    throw new Error("Selecione uma empresa válida antes de ativar a fonte SQL.");
  }
  if (enterpriseContext.scope !== "GROUP" && enterpriseContext.scope !== "COMPANY") {
    throw new Error("Selecione o grupo ou a empresa que receberá esta fonte.");
  }

  const enterprises = await enterpriseRepository.getAll();
  const group = enterprises.find(item => item.id === enterpriseContext.groupId && item.type === "Grupo");
  if (!group) throw new Error("O grupo selecionado não está disponível. Escolha outro contexto.");
  const company = enterpriseContext.companyId
    ? enterprises.find(item => item.id === enterpriseContext.companyId && item.type === "Empresa")
    : undefined;
  if (enterpriseContext.scope === "COMPANY" && (!company || (company as any).parentId !== group.id)) {
    throw new Error("A empresa selecionada não pertence ao grupo atual.");
  }

  const sourceId = stableDatabaseSourceId(config, enterpriseContext);
  if (expectedSourceId && expectedSourceId !== sourceId) {
    throw new Error("A fonte SQL ativa não corresponde ao contexto atual.");
  }
  const now = new Date().toISOString();
  const columns = databaseColumns(records);
  const tableName = config.table || "Tabela SQL";
  const previewRows = records.slice(0, 100).map((row, index) => ({
    raw: row,
    normalized: row,
    metadata: { rowIndex: index + 1, sheetName: tableName, fileName: sourceLabel },
  }));
  const dataset: ActiveDataset = {
    datasetId: sourceId,
    sourceType: "DATABASE_DATA",
    sourceName: sourceLabel,
    importedAt: now,
    rowCount: records.length,
    columnCount: columns.length,
    sheets: [{
      sheetName: tableName,
      rowCount: records.length,
      columnCount: columns.length,
      columns,
      formulaCount: 0,
      storageRef: sourceId,
      classification: "Base de dados",
      selectedForImport: true,
    }],
    activeSheet: tableName,
    previewRows,
    columnProfiles: [],
    importProfile: null,
    rawStorageRef: sourceId,
    status: "ACTIVE",
    databaseType: config.type,
    databaseHost: config.host,
    databasePort: config.port,
    databaseName: config.database,
    tableName,
    physicalColumns: columns,
    activatedAt: now,
    version: 1,
    sourceIdentity: {
      sourceId,
      workbookId: sourceId,
      datasetId: sourceId,
      fingerprint: databaseSourceFingerprint(config, enterpriseContext),
      fileName: sourceLabel,
      originalFileName: sourceLabel,
      storageMetadataKey: sourceId,
      storageRowsKey: sourceId,
      tenantId: "local",
      workspaceId: enterpriseContext.workspaceId || "workspace_default",
      groupId: enterpriseContext.groupId,
      companyId: enterpriseContext.scope === "COMPANY" ? enterpriseContext.companyId : undefined,
    },
  };

  const previousDataset = activeDatasetStore.getActiveDataset();
  const previousRows = activeDatasetStore.getActiveRows();
  let createdWorkbook = false;
  try {
    await IndexedSpreadsheetStorage.deleteRows(sourceId);
    await IndexedSpreadsheetStorage.saveSheetRows(sourceId, tableName, records);
    await IndexedSpreadsheetStorage.saveMetadata(sourceId, {
      id: sourceId,
      fileName: sourceLabel,
      uploadedAt: now,
      sheets: [{ sheetName: tableName, rowCount: records.length, columns, previewRows: records.slice(0, 5) }],
    });
    const persistedMetadata = await IndexedSpreadsheetStorage.getMetadata(sourceId);
    if (!persistedMetadata) throw new Error("Não foi possível persistir os metadados da fonte SQL.");

    const existingWorkbook = libraryWorkbookRepository.getWorkbook(sourceId);
    if (existingWorkbook) {
      const previousVersion = Number(existingWorkbook.versionIds.length || 0);
      const versionedDataset = { ...dataset, version: previousVersion + 1 };
      libraryWorkbookRepository.createWorkbookVersion(sourceId, versionedDataset, `SQL ${versionedDataset.version}`);
    } else {
      libraryWorkbookRepository.createWorkbook({
        id: sourceId,
        projectId: enterpriseContext.workspaceId || "workspace_default",
        name: sourceLabel,
        sourceName: sourceLabel,
        currentVersion: { id: `version_${sourceId}`, activeDataset: dataset, sourceName: sourceLabel, importedAt: now, rowCount: records.length, columnCount: columns.length, sheetCount: 1, formulaCount: 0, rawStorageRef: sourceId },
      });
      createdWorkbook = true;
    }

    await enterpriseRepository.bindSource({
      sourceId,
      workbookId: sourceId,
      datasetId: sourceId,
      tenantId: "local",
      workspaceId: enterpriseContext.workspaceId || "workspace_default",
      groupId: enterpriseContext.groupId,
      companyId: enterpriseContext.scope === "COMPANY" ? enterpriseContext.companyId : undefined,
      scopeType: enterpriseContext.scope,
    });

    const scopeId = enterpriseContext.scope === "COMPANY" ? enterpriseContext.companyId : enterpriseContext.groupId;
    if (scopeId) {
      activeSourceSelectionStore.setForScope({
        tenantId: "local",
        workspaceId: enterpriseContext.workspaceId || "workspace_default",
        scopeType: enterpriseContext.scope,
        scopeId,
      }, [sourceId]);
    }
    setEnterpriseContext({
      ...enterpriseContext,
      workspaceId: enterpriseContext.workspaceId || "workspace_default",
      workbookIds: [sourceId],
      datasetIds: [sourceId],
    }, { refreshSources: false, clearPreviousDataset: false });
    activeDatasetStore.setActiveDataset(dataset);
    return sourceId;
  } catch (error) {
    if (createdWorkbook) {
      try { libraryWorkbookRepository.deleteWorkbook(sourceId); } catch { /* preserve original failure */ }
    }
    try { await enterpriseRepository.removeSourceBinding(sourceId); } catch { /* preserve original failure */ }
    if (previousDataset) activeDatasetStore.setActiveDataset(previousDataset, previousRows);
    else activeDatasetStore.clearActiveDataset();
    throw error;
  }
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
  const canonicalWorkspaceId = enterpriseContext.workspaceId || identityEngine.getCurrentWorkspace()?.id || registry?.currentWorkspaceId || "workspace_default";
  const workspaceId = canonicalWorkspaceId;
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
    setEnterpriseContext(updatedContext, { refreshSources: false, clearPreviousDataset: false });

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

    setEnterpriseContext(prevContext, { refreshSources: false, clearPreviousDataset: false });

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
