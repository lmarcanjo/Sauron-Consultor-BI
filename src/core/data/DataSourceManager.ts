/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../../types";
import { 
  ActiveDataSource, 
  DataSourceState, 
  SpreadsheetWorkspace, 
  SpreadsheetFile, 
  ClientFilterConfig, 
  ConsultantAdjustment, 
  DataVersion, 
  ImportProfile 
} from "../../types/dataSource";
import { gerarDadosSimulados, generateDemoSpreadsheetRows } from "../../data/demoData";
import { AuditEngine } from "../audit/AuditEngine";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";

// --- GLOBAL QUERY SECURITY / PROTECTIONS ---
export function assertNoMockDataWhenRealSource(
  first: string | LancamentoFinanceiro[],
  second: string | LancamentoFinanceiro[]
): LancamentoFinanceiro[] {
  let activeDataSource: string;
  let records: LancamentoFinanceiro[];

  if (typeof first === "string") {
    activeDataSource = first;
    records = second as LancamentoFinanceiro[];
  } else {
    records = first;
    activeDataSource = second as string;
  }

  if (activeDataSource === "DEMO_DATA") {
    return records;
  }

  const isMock = (r: LancamentoFinanceiro) => {
    const record = r as any;
    return (
      record.__isDemo === true ||
      record.sourceType === "DEMO_DATA" ||
      r.Grupo === "Ficticio" ||
      r.Origem === "Simulado" ||
      (r.id && String(r.id).startsWith("sim_"))
    );
  };

  const mockRecords = records.filter(isMock);
  const cleanRecords = records.filter(r => !isMock(r));

  if (mockRecords.length > 0) {
    const errorMsg = `[Sauron Audit] Violação Crítica de Integridade: Dados simulados/fictícios (Simulado/Demo) foram detectados em uma fonte de dados real (${activeDataSource})! Operação abortada para evitar contaminação de relatórios executivos.`;
    console.error(errorMsg);

    // Register audit log in localStorage
    if (typeof localStorage !== "undefined") {
      try {
        const savedLogs = localStorage.getItem("sauron_audit_logs");
        const logs = savedLogs ? JSON.parse(savedLogs) : [];
        logs.push({
          id: `audit_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
          timestamp: new Date().toISOString(),
          type: "DATA_CONTAMINATION_ATTEMPT",
          severity: "CRITICAL",
          message: errorMsg,
          dataSource: activeDataSource,
          count: mockRecords.length,
        });
        localStorage.setItem("sauron_audit_logs", JSON.stringify(logs));
      } catch (err) {
        console.error("Erro ao registrar auditoria em localStorage", err);
      }
    }
  }

  return cleanRecords;
}

export class DataSourceManager {
  private state: DataSourceState;
  private workspace: SpreadsheetWorkspace;
  private databaseRecords: LancamentoFinanceiro[] = [];
  private consultantAdjustments: ConsultantAdjustment[] = [];
  private filterConfigs: ClientFilterConfig[] = [];
  private dataVersions: DataVersion[] = [];
  private currentImportProfile: ImportProfile | null = null;
  private cachedActiveRecords: LancamentoFinanceiro[] | null = null;
  private fileRowsMap: Record<string, any[]> = {};

  constructor() {
    const hasLocalStorage = typeof localStorage !== "undefined";

    const savedState = hasLocalStorage ? localStorage.getItem("sauron_ds_state") : null;
    this.state = savedState
      ? JSON.parse(savedState)
      : {
          activeDataSource: "SPREADSHEET_DATA",
          activeSpreadsheetIds: [],
          allowMixedSources: false,
          approvedByConsultant: false,
          lastUpdatedAt: new Date().toISOString(),
        };

    const savedWorkspace = hasLocalStorage ? localStorage.getItem("sauron_ds_workspace") : null;
    this.workspace = savedWorkspace
      ? JSON.parse(savedWorkspace)
      : {
          id: "workspace_default",
          name: "Sauron Workspace Geral",
          files: [],
          activeFileIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    const savedAdjustments = hasLocalStorage ? localStorage.getItem("sauron_ds_adjustments") : null;
    this.consultantAdjustments = savedAdjustments ? JSON.parse(savedAdjustments) : [];

    const savedFilters = hasLocalStorage ? localStorage.getItem("sauron_ds_filters") : null;
    this.filterConfigs = savedFilters ? JSON.parse(savedFilters) : [];

    const savedVersions = hasLocalStorage ? localStorage.getItem("sauron_ds_versions") : null;
    this.dataVersions = savedVersions ? JSON.parse(savedVersions) : [];
    
    const savedDbData = hasLocalStorage ? localStorage.getItem("sauron_ds_db_data") : null;
    this.databaseRecords = savedDbData ? JSON.parse(savedDbData) : [];

    this.loadFullRowsFromIndexedDB();
  }

  private async loadFullRowsFromIndexedDB() {
    if (typeof window === "undefined") return;
    try {
      for (const file of this.workspace.files) {
        const rows = await IndexedSpreadsheetStorage.getRows(file.id);
        if (rows && rows.length > 0) {
          this.fileRowsMap[file.id] = rows;
          
          // Hydrate the in-memory sheets with full rows loaded from IndexedDB
          file.sheets.forEach(sheet => {
            const sheetRows = rows.filter(r => r.aba === sheet.sheetName);
            if (sheetRows.length > 0) {
              sheet.rows = sheetRows;
            }
          });
        }
      }
      
      // Load database records from IndexedDB
      const dbRows = await IndexedSpreadsheetStorage.getRows("__database_records__");
      if (dbRows && dbRows.length > 0) {
        this.databaseRecords = dbRows;
      }

      this.cachedActiveRecords = null;
      this.triggerUpdateEvent();
    } catch (err) {
      console.error("[DataSourceManager] Failed to load rows from IndexedDB:", err);
    }
  }

  public setFileRows(fileId: string, rows: any[]) {
    this.fileRowsMap[fileId] = rows;
    const file = this.workspace.files.find(f => f.id === fileId);
    if (file) {
      file.sheets.forEach(sheet => {
        const sheetRows = rows.filter(r => r.aba === sheet.sheetName);
        if (sheetRows.length > 0) {
          sheet.rows = sheetRows;
        }
      });
    }
    this.cachedActiveRecords = null;
    this.triggerUpdateEvent();
  }

  public saveToStorage() {
    const hasLocalStorage = typeof localStorage !== "undefined";
    this.state.lastUpdatedAt = new Date().toISOString();
    if (hasLocalStorage) {
      try {
        try {
          localStorage.setItem("sauron_ds_state", JSON.stringify(this.state));
        } catch (e) {
          console.error("[Sauron Storage] Erro ao salvar sauron_ds_state:", e);
        }

        try {
          localStorage.setItem("sauron_ds_adjustments", JSON.stringify(this.consultantAdjustments));
        } catch (e) {
          console.error("[Sauron Storage] Erro ao salvar sauron_ds_adjustments:", e);
        }

        try {
          localStorage.setItem("sauron_ds_filters", JSON.stringify(this.filterConfigs));
        } catch (e) {
          console.error("[Sauron Storage] Erro ao salvar sauron_ds_filters:", e);
        }

        // Safe progressive saving for versions
        try {
          this.dataVersions.forEach(v => {
            if (v.status === "DISCARDED") {
              v.data = [];
            }
          });
          localStorage.setItem("sauron_ds_versions", JSON.stringify(this.dataVersions));
        } catch (versionsError) {
          console.warn("[Sauron Storage] Falha ao salvar versões completas. Tentando versão reduzida (apenas última/oficial)...", versionsError);
          const lightVersions = this.dataVersions.map((v, idx) => {
            const isLatestOrOfficial = v.status === "OFFICIAL" || idx === this.dataVersions.length - 1;
            return {
              ...v,
              data: isLatestOrOfficial ? v.data : []
            };
          });
          try {
            localStorage.setItem("sauron_ds_versions", JSON.stringify(lightVersions));
          } catch (e2) {
            console.warn("[Sauron Storage] Falha ao salvar versões reduzidas. Tentando versão super reduzida (limite de 20 linhas para prévia)...", e2);
            const superLightVersions = this.dataVersions.map((v, idx) => {
              const isLatestOrOfficial = v.status === "OFFICIAL" || idx === this.dataVersions.length - 1;
              return {
                ...v,
                data: isLatestOrOfficial ? v.data.slice(0, 20) : []
              };
            });
            try {
              localStorage.setItem("sauron_ds_versions", JSON.stringify(superLightVersions));
            } catch (e3) {
              console.warn("[Sauron Storage] Falha ao salvar super reduzido. Gravando apenas metadados das versões (sem array de dados)...", e3);
              const ultraLightVersions = this.dataVersions.map(v => ({
                ...v,
                data: []
              }));
              try {
                localStorage.setItem("sauron_ds_versions", JSON.stringify(ultraLightVersions));
              } catch (e4) {
                console.error("[Sauron Storage] Falha crítica e irreversível ao salvar metadados das versões:", e4);
              }
            }
          }
          // Log a warning to the audit logs so it is visible
          try {
            AuditEngine.getInstance().logEvent(
              "STORAGE_QUOTA_OPTIMIZATION",
              "O volume de dados de versões excedeu a cota do localStorage. Histórico otimizado automaticamente para liberar espaço.",
              "WARNING",
              { user: "Lennon Marcanjo" }
            );
          } catch (err) {
            console.error("Erro ao registrar log de armazenamento:", err);
          }
        }
        
        // Safe progressive saving for workspace - Always save a truncated version (max 100 rows) to prevent quota errors
        try {
          const defaultTruncatedWorkspace = {
            ...this.workspace,
            files: this.workspace.files.map(file => ({
              ...file,
              sheets: file.sheets.map(sheet => ({
                ...sheet,
                rows: sheet.rows.slice(0, 100)
              }))
            }))
          };
          localStorage.setItem("sauron_ds_workspace", JSON.stringify(defaultTruncatedWorkspace));
        } catch (workspaceError) {
          console.warn("[Sauron Storage] Falha ao salvar workspace com 100 linhas. Tentando com 20 linhas...", workspaceError);
          const superLightWorkspace = {
            ...this.workspace,
            files: this.workspace.files.map(file => ({
              ...file,
              sheets: file.sheets.map(sheet => ({
                ...sheet,
                rows: sheet.rows.slice(0, 20)
              }))
            }))
          };
          try {
            localStorage.setItem("sauron_ds_workspace", JSON.stringify(superLightWorkspace));
          } catch (e3) {
            console.warn("[Sauron Storage] Falha no workspace super leve. Gravando apenas metadados do workspace (sem dados)...", e3);
            const ultraLightWorkspace = {
              ...this.workspace,
              files: this.workspace.files.map(file => ({
                ...file,
                sheets: file.sheets.map(sheet => ({
                  ...sheet,
                  rows: []
                }))
              }))
            };
            try {
              localStorage.setItem("sauron_ds_workspace", JSON.stringify(ultraLightWorkspace));
            } catch (e4) {
              console.error("[Sauron Storage] Falha crítica ao salvar metadados do workspace:", e4);
            }
          }
        }
      } catch (globalError) {
        console.error("[Sauron Storage] Erro global ao salvar dados:", globalError);
      }
    }
  }

  public getActiveSource(): ActiveDataSource {
    return this.state.activeDataSource;
  }

  public setActiveSource(source: ActiveDataSource) {
    this.state.activeDataSource = source;
    if (source === "DEMO_DATA") {
      this.state.approvedByConsultant = true;
    }
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public isApproved(): boolean {
    return this.state.approvedByConsultant;
  }

  public setApproved(approved: boolean) {
    this.state.approvedByConsultant = approved;
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public getActiveSourceLabel(): string {
    switch (this.state.activeDataSource) {
      case "DEMO_DATA":
        return "Modo Demonstração — Dados Fictícios";
      case "SPREADSHEET_DATA":
        return "Planilhas Consolidadas Reais";
      case "DATABASE_DATA":
        return "Banco de Dados Cliente (Read-Only)";
      case "CONSULTANT_DATA":
        return "Análises Criadas pelo Consultor";
      case "MIXED_APPROVED_DATA":
        return "Base Consolidada Híbrida (Aprovada)";
      default:
        return "Origem Desconhecida";
    }
  }

  public assertNoMockDataWhenRealSource(activeDataSource: ActiveDataSource, records: LancamentoFinanceiro[]): LancamentoFinanceiro[] {
    return assertNoMockDataWhenRealSource(records, activeDataSource);
  }

  public getDemoSpreadsheetRows(segment: "automotivo" | "agro" | "servicos" | "industria"): any[] {
    const active = this.getActiveSource();
    if (active !== "DEMO_DATA") {
      const errorMsg = `[Sauron Audit] Bloqueado: Tentativa de obter dados demonstrativos com a fonte ativa configurada como ${active}.`;
      console.warn(errorMsg);
      return [];
    }
    return generateDemoSpreadsheetRows(segment);
  }

  public isDemoMode(): boolean {
    return this.state.activeDataSource === "DEMO_DATA";
  }

  public isSpreadsheetMode(): boolean {
    return this.state.activeDataSource === "SPREADSHEET_DATA";
  }

  public isDatabaseMode(): boolean {
    return this.state.activeDataSource === "DATABASE_DATA";
  }

  public getActiveRecords(): LancamentoFinanceiro[] {
    if (this.state.activeDataSource === "DEMO_DATA") {
      const isDemoAllowed = typeof window !== "undefined" && 
        (window.location.pathname.includes("/__internal/demo") || window.location.search.includes("demo=true"));
      if (!isDemoAllowed) {
        this.state.activeDataSource = "SPREADSHEET_DATA";
        this.saveToStorage();
      }
    }

    if (this.cachedActiveRecords) {
      return this.cachedActiveRecords;
    }
    let rawRecords: LancamentoFinanceiro[] = [];

    switch (this.state.activeDataSource) {
      case "DEMO_DATA":
        rawRecords = gerarDadosSimulados();
        break;

      case "SPREADSHEET_DATA":
        const activeFiles = this.workspace.files.filter((f) => 
          this.workspace.activeFileIds.includes(f.id) && 
          f.status === "ACTIVE" && 
          f.approvedByConsultant === true
        );
        activeFiles.forEach((file) => {
          const fullRows = this.fileRowsMap[file.id];
          if (fullRows && fullRows.length > 0) {
            rawRecords.push(...fullRows);
          } else {
            file.sheets.forEach((sheet) => {
              rawRecords.push(...(sheet.rows as LancamentoFinanceiro[]));
            });
          }
        });
        break;

      case "DATABASE_DATA":
        rawRecords = this.databaseRecords;
        break;

      case "CONSULTANT_DATA":
        const baseSource = this.databaseRecords.length > 0 ? this.databaseRecords : this.getActiveRecordsForSource("SPREADSHEET_DATA");
        rawRecords = this.applyConsultantAdjustments(baseSource);
        break;

      case "MIXED_APPROVED_DATA":
        const dbRecs = this.assertNoMockDataWhenRealSource("DATABASE_DATA", this.databaseRecords);
        const ssRecs = this.assertNoMockDataWhenRealSource("SPREADSHEET_DATA", this.getActiveRecordsForSource("SPREADSHEET_DATA"));
        rawRecords = [...dbRecs, ...ssRecs];
        break;
    }

    this.cachedActiveRecords = this.assertNoMockDataWhenRealSource(this.state.activeDataSource, rawRecords);
    return this.cachedActiveRecords;
  }

  private getActiveRecordsForSource(source: "SPREADSHEET_DATA" | "DATABASE_DATA"): LancamentoFinanceiro[] {
    const raw: LancamentoFinanceiro[] = [];
    if (source === "SPREADSHEET_DATA") {
       const activeFiles = this.workspace.files.filter((f) => 
         this.workspace.activeFileIds.includes(f.id) && 
         f.status === "ACTIVE" && 
         f.approvedByConsultant === true
       );
       activeFiles.forEach((file) => {
         const fullRows = this.fileRowsMap[file.id];
         if (fullRows && fullRows.length > 0) {
           raw.push(...fullRows);
         } else {
           file.sheets.forEach((sheet) => {
             raw.push(...(sheet.rows as LancamentoFinanceiro[]));
           });
         }
       });
    } else {
      raw.push(...this.databaseRecords);
    }
    return raw;
  }

  public getWorkspace(): SpreadsheetWorkspace {
    return this.workspace;
  }

  public getDatabaseRecords(): LancamentoFinanceiro[] {
    return this.databaseRecords;
  }

  public addSpreadsheetFile(file: SpreadsheetFile, mode: "APPEND" | "REPLACE" | "SEPARATE" | "PENDING") {
    const sameNameFiles = this.workspace.files.filter(f => f.fileName === file.fileName);
    const verNum = sameNameFiles.length + 1;
    const currentVersion = `v${verNum}`;

    const processedSheets = file.sheets.map(sheet => {
      const processedRows = sheet.rows.map((row, idx) => {
        return {
          ...row,
          arquivo: file.fileName,
          nome_arquivo: file.fileName,
          aba: sheet.sheetName,
          nome_aba: sheet.sheetName,
          linha: idx + 2,
          numero_linha: idx + 2,
          data_importacao: file.importedAt || new Date().toISOString(),
          dataImportacao: file.importedAt || new Date().toISOString(),
          usuario: file.importedBy || "Lennon Marcanjo",
          usuário: file.importedBy || "Lennon Marcanjo"
        };
      });
      return {
        ...sheet,
        rows: processedRows
      };
    });

    const allRows: any[] = [];
    processedSheets.forEach(s => allRows.push(...s.rows));
    const qual = this.calculateQualityScore(allRows);

    const enhancedFile: SpreadsheetFile = {
      ...file,
      sheets: processedSheets,
      totalAbas: processedSheets.length,
      version: currentVersion,
      versao: currentVersion,
      qualityScore: qual.score,
      qualityLabel: qual.label,
      scoreQualidade: qual.label,
      nome: file.fileName,
      dataImportacao: file.importedAt,
      usuario: file.importedBy,
      status: file.status || (mode === "PENDING" ? "PENDING_APPROVAL" : "PENDING_VALIDATION"),
      approvedByConsultant: file.approvedByConsultant !== undefined ? file.approvedByConsultant : (file.status === "ACTIVE" ? true : false)
    };

    if (mode === "REPLACE") {
      this.workspace.files.forEach(f => {
        f.status = "INACTIVE";
        f.approvedByConsultant = false;
      });
      this.workspace.files = [enhancedFile];
      this.workspace.activeFileIds = [enhancedFile.id];
    } else if (mode === "APPEND") {
      this.workspace.files.push(enhancedFile);
      this.workspace.activeFileIds.push(enhancedFile.id);
    } else if (mode === "SEPARATE") {
      this.workspace.files.push({ ...enhancedFile, status: "INACTIVE" });
    } else {
      this.workspace.files.push(enhancedFile);
    }

    this.workspace.updatedAt = new Date().toISOString();
    this.state.activeDataSource = "SPREADSHEET_DATA";
    this.state.approvedByConsultant = false;

    this.fileRowsMap[enhancedFile.id] = allRows;
    if (typeof window !== "undefined") {
      IndexedSpreadsheetStorage.saveRows(enhancedFile.id, allRows).catch(err => {
        console.error("Failed to save rows to IndexedDB", err);
      });
    }

    this.createNewVersion("SPREADSHEET", enhancedFile.fileName, allRows);
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public deleteSpreadsheetFile(fileId: string) {
    this.workspace.files = this.workspace.files.filter((f) => f.id !== fileId);
    this.workspace.activeFileIds = this.workspace.activeFileIds.filter((id) => id !== fileId);
    this.workspace.updatedAt = new Date().toISOString();
    delete this.fileRowsMap[fileId];
    if (typeof window !== "undefined") {
      IndexedSpreadsheetStorage.deleteRows(fileId).catch(err => {
        console.error("Failed to delete rows in IndexedDB:", err);
      });
    }
    
    if (this.workspace.activeFileIds.length === 0) {
      this.state.activeDataSource = "DEMO_DATA";
      this.state.approvedByConsultant = true;
    } else {
      const remainingActiveApproved = this.workspace.files.some(f => 
        this.workspace.activeFileIds.includes(f.id) && f.approvedByConsultant === true
      );
      this.state.approvedByConsultant = remainingActiveApproved;
    }
    
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public toggleSpreadsheetFile(fileId: string) {
    const isCurrentlyActive = this.workspace.activeFileIds.includes(fileId);
    const file = this.workspace.files.find(f => f.id === fileId);
    
    if (isCurrentlyActive) {
      this.workspace.activeFileIds = this.workspace.activeFileIds.filter((id) => id !== fileId);
      if (file) file.status = "INACTIVE";
    } else {
      this.workspace.activeFileIds.push(fileId);
      if (file) {
        file.status = "ACTIVE";
      }
    }
    
    this.workspace.updatedAt = new Date().toISOString();
    
    if (this.workspace.activeFileIds.length > 0) {
      this.state.activeDataSource = "SPREADSHEET_DATA";
      const hasApprovedActive = this.workspace.files.some(f => 
        this.workspace.activeFileIds.includes(f.id) && f.approvedByConsultant === true
      );
      this.state.approvedByConsultant = hasApprovedActive;
    } else {
      this.state.activeDataSource = "DEMO_DATA";
      this.state.approvedByConsultant = true;
    }
    
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public syncDatabaseRecords(records: LancamentoFinanceiro[], sourceName: string) {
    this.databaseRecords = this.assertNoMockDataWhenRealSource("DATABASE_DATA", records);
    try {
      // Save full records in IndexedDB
      if (typeof window !== "undefined") {
        IndexedSpreadsheetStorage.saveRows("__database_records__", records).catch(err => {
          console.error("Failed to save database records to IndexedDB", err);
        });
      }
      
      // Save truncated version to localStorage (max 100 rows)
      const truncatedDb = this.databaseRecords.slice(0, 100);
      localStorage.setItem("sauron_ds_db_data", JSON.stringify(truncatedDb));
    } catch (e) {
      console.warn("[Sauron Storage] Erro ao salvar sauron_ds_db_data no localStorage (limite excedido):", e);
    }
    
    this.state.activeDataSource = "DATABASE_DATA";
    this.state.approvedByConsultant = false;

    this.createNewVersion("DATABASE", sourceName, this.databaseRecords);
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public getVersions(): DataVersion[] {
    return this.dataVersions;
  }

  public createNewVersion(sourceType: "SPREADSHEET" | "DATABASE", label: string, data: LancamentoFinanceiro[]) {
    const nextNum = String(this.dataVersions.length + 1).padStart(3, "0");
    const newVersion: DataVersion = {
      versionId: `v${nextNum}`,
      label: `Importação ${nextNum} - ${label}`,
      timestamp: new Date().toISOString(),
      user: "Lennon Marcanjo",
      recordsCount: data.length,
      status: "PREVIEW",
      source: sourceType,
      data: data.slice(0, 100) // Truncate to 100 rows to prevent localStorage quota issues
    };
    
    this.dataVersions.push(newVersion);
    this.saveToStorage();
  }

  public rollbackToVersion(versionId: string) {
    const ver = this.dataVersions.find(v => v.versionId === versionId);
    if (!ver) return;

    this.dataVersions.forEach(v => {
      if (v.versionId === versionId) {
        v.status = "OFFICIAL";
      } else {
        v.status = "DISCARDED";
      }
    });

    if (ver.source === "SPREADSHEET") {
      this.state.activeDataSource = "SPREADSHEET_DATA";
      const fileId = `rolled_file_${Date.now()}`;
      const virtualFile: SpreadsheetFile = {
        id: fileId,
        fileName: ver.label,
        importedAt: ver.timestamp,
        importedBy: ver.user,
        status: "ACTIVE",
        totalRows: ver.recordsCount,
        totalColumns: ver.data.length > 0 ? Object.keys(ver.data[0]).length : 0,
        sheets: [
          {
            id: `sheet_${Date.now()}`,
            fileId: fileId,
            sheetName: "Dados Restaurados",
            rows: ver.data,
            columns: []
          }
        ]
      };
      this.workspace.files = [virtualFile];
      this.workspace.activeFileIds = [fileId];
    } else {
      this.state.activeDataSource = "DATABASE_DATA";
      this.databaseRecords = ver.data;
      try {
        localStorage.setItem("sauron_ds_db_data", JSON.stringify(this.databaseRecords));
      } catch (e) {
        console.warn("[Sauron Storage] Erro ao reverter e salvar sauron_ds_db_data no localStorage:", e);
      }
    }

    this.state.approvedByConsultant = true;
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public calculateQualityScore(rows: any[]): { score: number; label: "Excelente" | "Boa" | "Atenção" | "Crítica"; report: string[] } {
    if (!rows || rows.length === 0) {
      return { score: 100, label: "Excelente", report: ["Base limpa ou vazia."] };
    }

    let score = 100;
    const report: string[] = [];
    const totalRows = rows.length;
    const firstRow = rows[0] || {};
    const columns = Object.keys(firstRow);
    const totalCells = totalRows * (columns.length || 1);

    const namelessCols = columns.filter(k => k.startsWith("__EMPTY") || k.toLowerCase().includes("vazio") || k.trim() === "");
    if (namelessCols.length > 0) {
      score -= Math.min(10, namelessCols.length * 2);
      report.push(`Ponto de atenção: Detetadas ${namelessCols.length} colunas sem cabeçalho nomeado (Ex: ${namelessCols.join(", ")}). Pode ser normal em exportações de ERP. O consultor pode ignorar ou renomear se necessário. Não bloqueia a importação.`);
    }

    let emptyCellsCount = 0;
    rows.forEach(r => {
      columns.forEach(col => {
        const val = r[col];
        if (val === undefined || val === null || String(val).trim() === "") {
          emptyCellsCount++;
        }
      });
    });
    if (emptyCellsCount > 0) {
      const emptyPct = (emptyCellsCount / totalCells) * 100;
      score -= Math.min(10, Math.round(emptyPct * 0.5));
      report.push(`Ponto de atenção: Detetadas ${emptyCellsCount} células vazias (${emptyPct.toFixed(1)}%). Pode ser normal em exportações de ERP. O consultor pode ignorar ou revisar se necessário. Não bloqueia a importação.`);
    }

    let invalidDatesCount = 0;
    rows.forEach(r => {
      const val = r["Mês"] || r["Mes"] || r["data"] || r["data_referencia"];
      if (!val || val === "N/D" || val === "Sem Data") {
        invalidDatesCount++;
      } else {
        const strVal = String(val).toLowerCase().trim();
        const hasMonthWord = /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(strVal);
        const parsed = Date.parse(strVal.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
        if (isNaN(parsed) && !hasMonthWord && !/^\d{4}-\d{2}$/.test(strVal)) {
          invalidDatesCount++;
        }
      }
    });
    if (invalidDatesCount > 0) {
      const invalidDatePct = (invalidDatesCount / totalRows) * 100;
      score -= Math.min(10, Math.round(invalidDatePct * 0.4));
      report.push(`Ponto de atenção: Detetados ${invalidDatesCount} registros com datas vazias ou sob outro formato (${invalidDatePct.toFixed(1)}%). Pode ser normal em exportações de ERP. O consultor pode ignorar ou revisar se necessário. Não bloqueia a importação.`);
    }

    let inconsistentTypesCount = 0;
    const numericFields = ["Receita", "Custo", "Despesa", "Lucro", "Margem"];
    rows.forEach(r => {
      numericFields.forEach(col => {
        const val = r[col];
        if (val !== undefined && val !== null && val !== "") {
          if (typeof val === "string") {
            const cleanVal = val.trim();
            const numericValue = Number(cleanVal.replace(/\./g, "").replace(",", "."));
            if (isNaN(numericValue)) {
              inconsistentTypesCount++;
            }
          } else if (typeof val !== "number") {
            inconsistentTypesCount++;
          }
        }
      });
    });
    if (inconsistentTypesCount > 0) {
      const totalNumericCells = totalRows * numericFields.length;
      const incPct = (inconsistentTypesCount / totalNumericCells) * 100;
      score -= Math.min(10, Math.round(incPct * 0.5));
      report.push(`Ponto de atenção: Detetados ${inconsistentTypesCount} campos financeiros vazios ou descritivos (${incPct.toFixed(1)}%). Pode ser normal em exportações de ERP. O consultor pode ignorar ou revisar se necessário. Não bloqueia a importação.`);
    }

    let duplicateRowsCount = 0;
    const rowSignatures = new Set<string>();
    rows.forEach(r => {
      const sig = `${r.Grupo}-${r.CNPJ}-${r.Marca}-${r.Mês}-${r.Razão}-${r.Receita}-${r.Despesa}`;
      if (rowSignatures.has(sig)) {
        duplicateRowsCount++;
      } else {
        rowSignatures.add(sig);
      }
    });
    if (duplicateRowsCount > 0) {
      const dupPct = (duplicateRowsCount / totalRows) * 100;
      score -= Math.min(10, Math.round(dupPct * 0.5));
      report.push(`Ponto de atenção: Detetadas ${duplicateRowsCount} possíveis linhas duplicadas de lançamentos (${dupPct.toFixed(1)}%). Pode ser normal em exportações de ERP. O consultor pode ignorar ou revisar se necessário. Não bloqueia a importação.`);
    }

    score = Math.max(70, Math.min(100, score));
    let label: "Excelente" | "Boa" | "Atenção" | "Crítica" = "Excelente";
    if (score < 80) label = "Atenção";
    else if (score < 90) label = "Boa";

    return { score, label, report };
  }

  public getFilterConfigs(): ClientFilterConfig[] {
    return this.filterConfigs;
  }

  public registerFilterConfig(config: ClientFilterConfig) {
    if (config.sourceColumn.startsWith("__EMPTY") || config.sourceColumn === "") {
      return;
    }
    this.filterConfigs = this.filterConfigs.filter(f => f.sourceColumn !== config.sourceColumn);
    this.filterConfigs.push(config);
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public removeFilterConfig(id: string) {
    this.filterConfigs = this.filterConfigs.filter(f => f.id !== id);
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public saveFilterProfile(profileName: string) {
    const profile: ImportProfile = {
      id: `profile_${Date.now()}`,
      clientName: "Cliente Corporativo",
      profileName,
      mappings: {},
      selectedFilters: [...this.filterConfigs],
      expectedFiles: this.workspace.files.map(f => f.fileName),
      lastApplied: new Date().toISOString()
    };
    this.currentImportProfile = profile;
    try {
      localStorage.setItem("sauron_ds_import_profile", JSON.stringify(profile));
    } catch (e) {
      console.warn("[Sauron Storage] Erro ao salvar sauron_ds_import_profile:", e);
    }
  }

  public getSavedProfile(): ImportProfile | null {
    if (this.currentImportProfile) return this.currentImportProfile;
    const saved = localStorage.getItem("sauron_ds_import_profile");
    return saved ? JSON.parse(saved) : null;
  }

  public getConsultantAdjustments(): ConsultantAdjustment[] {
    return this.consultantAdjustments;
  }

  public addConsultantAdjustment(adj: Omit<ConsultantAdjustment, "id" | "createdAt" | "createdBy">) {
    const fullAdj: ConsultantAdjustment = {
      ...adj,
      id: `adj_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: "Lennon Marcanjo"
    };
    this.consultantAdjustments.push(fullAdj);
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public removeConsultantAdjustment(id: string) {
    this.consultantAdjustments = this.consultantAdjustments.filter(a => a.id !== id);
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  private applyConsultantAdjustments(records: LancamentoFinanceiro[]): LancamentoFinanceiro[] {
    const cloned = records.map(r => ({ ...r }));
    
    this.consultantAdjustments.forEach(adj => {
      if (adj.type === "classificacao" && adj.targetField) {
        cloned.forEach(row => {
          if (this.evaluateRowMatchesFilter(row, adj.targetFilter)) {
            row[adj.targetField!] = adj.value;
          }
        });
      }
    });

    return cloned;
  }

  private evaluateRowMatchesFilter(row: any, filterStr?: string): boolean {
    if (!filterStr) return true;
    const parts = filterStr.split("=");
    if (parts.length !== 2) return false;
    const key = parts[0].trim();
    const val = parts[1].trim();
    return String(row[key]).toLowerCase() === val.toLowerCase();
  }

  public getDataCatalog(): any {
    const activeRecs = this.getActiveRecords();
    const cols = activeRecs.length > 0 ? Object.keys(activeRecs[0]) : [];
    
    const columnsQuality = cols.map(c => {
      const blanks = activeRecs.filter(r => r[c] === undefined || r[c] === null || String(r[c]) === "").length;
      const type = typeof (activeRecs[0]?.[c]);
      return {
        columnName: c,
        dataType: type === "number" ? "Decimal" : "Texto",
        completionRate: activeRecs.length > 0 ? ((activeRecs.length - blanks) / activeRecs.length) * 100 : 0,
        technicalCol: c.startsWith("__EMPTY"),
        example: activeRecs[0]?.[c] || "N/A"
      };
    });

    return {
      activeSource: this.state.activeDataSource,
      recordsCount: activeRecs.length,
      columnsCount: cols.length,
      columns: columnsQuality,
      activeFilesCount: this.workspace.activeFileIds.length,
      versionsCount: this.dataVersions.length,
      qualityScore: this.calculateQualityScore(activeRecs)
    };
  }

  public triggerUpdateEvent() {
    this.cachedActiveRecords = null;
    if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
      const event = new CustomEvent("sauron_datasource_updated", {
        detail: {
          activeDataSource: this.state.activeDataSource,
          approvedByConsultant: this.state.approvedByConsultant
        }
      });
      window.dispatchEvent(event);
    }
  }
}

export const dataSourceManager = new DataSourceManager();
export default dataSourceManager;
