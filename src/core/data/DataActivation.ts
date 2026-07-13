import { activeDatasetStore } from "./ActiveDatasetStore";
import { setEnterpriseContext, getEnterpriseContext } from "../enterprise-consolidation/EnterpriseContextStore";
import { spreadsheetStorageAdapter } from "../storage/IndexedSpreadsheetStorageAdapter";
import { workbookRepository as libraryWorkbookRepository } from "../workbook-library/WorkbookRepository";
import { workbookRepository as coreWorkbookRepository } from "../workbook/WorkbookRepository";
import { enterpriseRepository, Company } from "../persistence/EnterpriseRepository";
import { ActiveDataset, ActiveDatasetRow, ColumnProfile } from "../../types/dataSource";
import { EnterpriseContext } from "../enterprise-consolidation/EnterpriseContextTypes";
import { activeSourceSelectionStore } from "./ActiveSourceSelectionStore";
import { workspaceIntelligenceEngine } from "../workspace-intelligence/WorkspaceIntelligenceEngine";
import { businessDomainEngine } from "../business-domains/BusinessDomainEngine";

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
    window.dispatchEvent(new CustomEvent("SAURON_WORKSPACE_REGISTRY_UPDATED", { detail: state }));
  } catch (e) {
    console.error("[DataActivation] Failed to save workspace registry:", e);
  }
}

export async function activateImportedSources({
  workbookIds,
  datasetIds,
  enterpriseContext
}: ActivateImportedSourcesParams): Promise<void> {
  console.log(`[DataActivation] Starting transacting unified activation for workbooks:`, workbookIds, `datasets:`, datasetIds);

  // 1. PREPARE: Capture previous state for transaction recovery
  const prevDataset = activeDatasetStore.getActiveDataset();
  const prevRows = activeDatasetStore.getActiveRows();
  const prevContext = getEnterpriseContext();
  const prevRegistry = getWorkspaceRegistry();
  
  const registry = getWorkspaceRegistry();
  const workspaceId = registry?.currentWorkspaceId || "workspace_default";
  const prevSelection = activeSourceSelectionStore.get(workspaceId);

  try {
    // 2. Perform validation and data load
    const allEnterprises = await enterpriseRepository.getAll();
    const allDatasets: ActiveDataset[] = [];
    const allRows: any[] = [];

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
        console.warn(`[DataActivation] Error checking library repo for dataset ${id}:`, e);
      }

      // Check core repo
      if (!dataset) {
        try {
          const coreWb = coreWorkbookRepository.get(id);
          if (coreWb && (coreWb as any).activeDataset) {
            dataset = (coreWb as any).activeDataset;
          }
        } catch (e) {
          console.warn(`[DataActivation] Error checking core repo for dataset ${id}:`, e);
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

      allDatasets.push(dataset);

      // Load all rows
      const datasetRows = await spreadsheetStorageAdapter.getRows(id);

      // Resolve linked company / group names
      const linkedEnt = allEnterprises.find(e => 
        e.id === id || 
        (e as any).workbookIds?.includes(id)
      );
      const parentGroup = (linkedEnt && (linkedEnt as any).parentId)
        ? allEnterprises.find(e => e.id === (linkedEnt as any).parentId) 
        : null;

      const companyName = linkedEnt ? linkedEnt.name : (enterpriseContext.companyId ? allEnterprises.find(e => e.id === enterpriseContext.companyId)?.name : "");
      const groupName = parentGroup 
        ? parentGroup.name 
        : (linkedEnt && linkedEnt.type === "Grupo" 
            ? linkedEnt.name 
            : (enterpriseContext.groupId ? allEnterprises.find(e => e.id === enterpriseContext.groupId)?.name : "")
          );

      const normalizedRows = datasetRows.map((row, idx) => {
        const getNum = (v: any) => {
          if (v === undefined || v === null || v === "") return 0;
          if (typeof v === "number") return v;
          const sanit = String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
          const parsed = parseFloat(sanit);
          return isNaN(parsed) ? 0 : parsed;
        };

        return {
          id: `row_${id}_${idx}_${Date.now()}`,
          Grupo: groupName || row["Grupo"] || row["Grupo Economico"] || row["Grupo Econômico"] || "Geral",
          CNPJ: row["CNPJ"] || row["Cnpj"] || "00.000.000/0001-00",
          Marca: row["Marca"] || row["Bandeira"] || "N/D",
          Empresa: companyName || row["Empresa"] || row["Razão Social"] || row["Razao Social"] || "Empresa Geral",
          Mês: row["Mês"] || row["Mes"] || row["Competência"] || row["Competencia"] || "N/D",
          Razão: row["Razão"] || row["Razao"] || "Outros",
          Categoria: row["Categoria"] || row["Classificação"] || row["Classificacao"] || "Sem Categoria",
          Receita: row["Receita"] !== undefined ? getNum(row["Receita"]) : getNum(row["Valor"] || 0),
          Custo: row["Custo"] !== undefined ? getNum(row["Custo"]) : 0,
          Despesa: row["Despesa"] !== undefined ? getNum(row["Despesa"]) : 0,
          Lucro: row["Lucro"] !== undefined ? getNum(row["Lucro"]) : 0,
          Margem: row["Margem"] !== undefined ? getNum(row["Margem"]) : 0,
          Vendedor: row["Vendedor"] || row["Consultor"] || "Padrão",
          arquivo: dataset!.sourceName,
          dataImportacao: dataset!.importedAt,
          ...row
        };
      });

      allRows.push(...normalizedRows);
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

    // 4. COMMIT phase
    // Persist selection entity explicitly
    const activeSelection = {
      contextId: workspaceId,
      sourceIds: workbookIds,
      updatedAt: new Date().toISOString()
    };
    activeSourceSelectionStore.set(activeSelection);

    // Save to enterprise repository
    const targetCompanyId = enterpriseContext.companyId;
    if (targetCompanyId) {
      const comp = allEnterprises.find(e => e.id === targetCompanyId) as Company;
      if (comp) {
        const currentWbIds = comp.workbookIds || [];
        comp.workbookIds = Array.from(new Set([...currentWbIds, ...workbookIds]));
        await enterpriseRepository.save(comp);
      }
    }

    // Set enterprise context
    const updatedContext: EnterpriseContext = {
      ...enterpriseContext,
      workbookIds,
      datasetIds
    };
    setEnterpriseContext(updatedContext);

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
      
      const combinedPreview: ActiveDatasetRow[] = allRows.slice(0, 5).map((row, idx) => ({
        raw: row,
        normalized: row,
        metadata: {
          rowIndex: idx + 1,
          sheetName: row.aba || "Dados",
          fileName: row.arquivo || "Consolidado",
        }
      }));

      const allProfiles: ColumnProfile[] = [];
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
        rowCount: allRows.length,
        columnCount: Math.max(...allDatasets.map(d => d.columnCount)),
        sheets: allDatasets.flatMap(d => d.sheets),
        activeSheet: allDatasets[0].activeSheet,
        previewRows: combinedPreview,
        columnProfiles: allProfiles,
        importProfile: null,
        rawStorageRef: combinedId,
        status: "ACTIVE"
      };
    }

    activeDatasetStore.setActiveDataset(finalActiveDataset, allRows);

    // Sync template state with resolved domain
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("SAURON_ACTIVE_DOMAIN_CHANGED", { detail: resolvedDomain }));
      window.dispatchEvent(new CustomEvent("DATASET_ACTIVATED", { detail: finalActiveDataset }));
      window.dispatchEvent(new CustomEvent("sauron:data-loaded"));
    }

    console.log(`[DataActivation] Transacting activation complete. Resolved Domain: ${resolvedDomain}. Consolidated ${allRows.length} rows.`);

  } catch (err) {
    console.error(`[DataActivation] Unified activation failed! Commencing ROLLBACK phase...`, err);

    // 5. ROLLBACK phase
    if (prevDataset) {
      activeDatasetStore.setActiveDataset(prevDataset, prevRows);
    } else {
      activeDatasetStore.clearActiveDataset();
    }

    setEnterpriseContext(prevContext);

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
