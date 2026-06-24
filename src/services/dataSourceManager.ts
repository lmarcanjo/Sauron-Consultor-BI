/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../types";
import { 
  ActiveDataSource, 
  DataSourceState, 
  SpreadsheetWorkspace, 
  SpreadsheetFile, 
  ClientFilterConfig, 
  ConsultantAdjustment, 
  DataVersion, 
  ImportProfile 
} from "../types/dataSource";
import { gerarDadosSimulados } from "../data/demoData";

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
    return (
      r.Grupo === "Grupo Topázio" ||
      r.Grupo === "Ficticio" ||
      r.Origem === "Simulado" ||
      (r.id && String(r.id).startsWith("sim_")) ||
      (r.Empresa && String(r.Empresa).includes("Topázio")) ||
      (r.Razão && String(r.Razão).includes("Topázio"))
    );
  };

  const mockRecords = records.filter(isMock);
  const cleanRecords = records.filter(r => !isMock(r));

  if (mockRecords.length > 0) {
    const errorMsg = `[Sauron Audit] Violação Crítica de Integridade: Dados simulados/fictícios (Grupo Topázio/Simulado) foram detectados em uma fonte de dados real (${activeDataSource})! Operação abortada para evitar contaminação de relatórios executivos.`;
    console.error(errorMsg);

    // Register audit log in localStorage
    if (typeof localStorage !== "undefined") {
      try {
        const savedLogs = localStorage.getItem("sauron_audit_logs");
        const logs = savedLogs ? JSON.parse(savedLogs) : [];
        logs.push({
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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

// In-memory or localStorage-backed store for B2B SaaS consistency
class DataSourceManager {
  private state: DataSourceState;
  private workspace: SpreadsheetWorkspace;
  private databaseRecords: LancamentoFinanceiro[] = [];
  private consultantAdjustments: ConsultantAdjustment[] = [];
  private filterConfigs: ClientFilterConfig[] = [];
  private dataVersions: DataVersion[] = [];
  private currentImportProfile: ImportProfile | null = null;
  private cachedActiveRecords: LancamentoFinanceiro[] | null = null;

  constructor() {
    // Check if running in a browser environment
    const hasLocalStorage = typeof localStorage !== "undefined";

    // 1. Initialize State from LocalStorage or Defaults
    const savedState = hasLocalStorage ? localStorage.getItem("sauron_ds_state") : null;
    this.state = savedState
      ? JSON.parse(savedState)
      : {
          activeDataSource: "DEMO_DATA",
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
    
    // Load database cache if available
    const savedDbData = hasLocalStorage ? localStorage.getItem("sauron_ds_db_data") : null;
    this.databaseRecords = savedDbData ? JSON.parse(savedDbData) : [];
  }

  // --- PERSISTENCE ---
  public saveToStorage() {
    const hasLocalStorage = typeof localStorage !== "undefined";
    this.state.lastUpdatedAt = new Date().toISOString();
    if (hasLocalStorage) {
      try {
        // Safe write for state
        try {
          localStorage.setItem("sauron_ds_state", JSON.stringify(this.state));
        } catch (e) {
          console.error("[Sauron Storage] Erro ao salvar sauron_ds_state:", e);
        }

        // Safe write for adjustments
        try {
          localStorage.setItem("sauron_ds_adjustments", JSON.stringify(this.consultantAdjustments));
        } catch (e) {
          console.error("[Sauron Storage] Erro ao salvar sauron_ds_adjustments:", e);
        }

        // Safe write for filters
        try {
          localStorage.setItem("sauron_ds_filters", JSON.stringify(this.filterConfigs));
        } catch (e) {
          console.error("[Sauron Storage] Erro ao salvar sauron_ds_filters:", e);
        }

        // Safe write for versions with intelligent pruning on quota exceedance
        try {
          // Pre-emptively clear data for DISCARDED versions to save a lot of space
          this.dataVersions.forEach(v => {
            if (v.status === "DISCARDED") {
              v.data = [];
            }
          });

          localStorage.setItem("sauron_ds_versions", JSON.stringify(this.dataVersions));
        } catch (versionsError) {
          console.warn("[Sauron Storage] Falha ao salvar versões completas devido a limite de cota.", versionsError);
          // Fallback 1: Keep data only for OFFICIAL or the most recent version
          const lightVersions = this.dataVersions.map((v, idx) => {
            const isLatestOrOfficial = v.status === "OFFICIAL" || idx === this.dataVersions.length - 1;
            return {
              ...v,
              data: isLatestOrOfficial ? v.data : []
            };
          });
          try {
            localStorage.setItem("sauron_ds_versions", JSON.stringify(lightVersions));
            console.log("[Sauron Storage] Versões reduzidas salvas com sucesso.");
          } catch (e2) {
            console.error("[Sauron Storage] Mesmo as versões reduzidas excederam a cota. Salvando apenas metadados.", e2);
            const metadataOnlyVersions = this.dataVersions.map(v => ({
              ...v,
              data: []
            }));
            try {
              localStorage.setItem("sauron_ds_versions", JSON.stringify(metadataOnlyVersions));
            } catch (e3) {
              console.error("[Sauron Storage] Falha crítica ao salvar histórico de versões.", e3);
            }
          }
        }
        
        // Safe write for workspace
        try {
          localStorage.setItem("sauron_ds_workspace", JSON.stringify(this.workspace));
        } catch (workspaceError) {
          console.warn("[Sauron Storage] Falha ao salvar workspace completo no localStorage devido ao limite de cota.", workspaceError);
          // If quota exceeded, try to persist a lighter version of workspace
          const lightWorkspace = {
            ...this.workspace,
            files: this.workspace.files.map(file => ({
              ...file,
              sheets: file.sheets.map(sheet => {
                const isActive = this.workspace.activeFileIds.includes(file.id);
                return {
                  ...sheet,
                  rows: isActive ? sheet.rows.slice(0, 500) : [] // Cap rows to keep backup small
                };
              })
            }))
          };
          try {
            localStorage.setItem("sauron_ds_workspace", JSON.stringify(lightWorkspace));
            console.log("[Sauron Storage] Workspace reduzido salvo com sucesso.");
          } catch (e2) {
            console.error("[Sauron Storage] Mesmo o workspace reduzido excedeu a cota. Removendo dados de linha do localStorage.", e2);
            const metadataOnlyWorkspace = {
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
              localStorage.setItem("sauron_ds_workspace", JSON.stringify(metadataOnlyWorkspace));
            } catch (e3) {
              console.error("[Sauron Storage] Falha crítica ao salvar metadados do workspace.", e3);
            }
          }
        }
      } catch (globalError) {
        console.error("[Sauron Storage] Erro global ao salvar dados de configuração no localStorage:", globalError);
      }
    }
  }

  // --- SOURCE ACCESSORS ---
  public getActiveSource(): ActiveDataSource {
    return this.state.activeDataSource;
  }

  public setActiveSource(source: ActiveDataSource) {
    this.state.activeDataSource = source;
    // Auto-approve demo data, but require manual approval for real files if not already approved
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

  // --- QUERY SECURITY / PROTECTIONS ---
  public assertNoMockDataWhenRealSource(activeDataSource: ActiveDataSource, records: LancamentoFinanceiro[]): LancamentoFinanceiro[] {
    return assertNoMockDataWhenRealSource(records, activeDataSource);
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
    if (this.cachedActiveRecords) {
      return this.cachedActiveRecords;
    }
    let rawRecords: LancamentoFinanceiro[] = [];

    switch (this.state.activeDataSource) {
      case "DEMO_DATA":
        rawRecords = gerarDadosSimulados();
        break;

      case "SPREADSHEET_DATA":
        // Fetch rows only from ACTIVE files
        const activeFiles = this.workspace.files.filter((f) => 
          this.workspace.activeFileIds.includes(f.id) && f.status === "ACTIVE"
        );
        activeFiles.forEach((file) => {
          file.sheets.forEach((sheet) => {
            rawRecords.push(...(sheet.rows as LancamentoFinanceiro[]));
          });
        });
        break;

      case "DATABASE_DATA":
        rawRecords = this.databaseRecords;
        break;

      case "CONSULTANT_DATA":
        // Mix active spreadsheet/database data with consultant specific records, or let consultant design scenarios.
        // Primarily returns raw records with consultant adjustments applied.
        const baseSource = this.databaseRecords.length > 0 ? this.databaseRecords : this.getActiveRecordsForSource("SPREADSHEET_DATA");
        rawRecords = this.applyConsultantAdjustments(baseSource);
        break;

      case "MIXED_APPROVED_DATA":
        // Combine active spreadsheet with database
        const dbRecs = this.assertNoMockDataWhenRealSource("DATABASE_DATA", this.databaseRecords);
        const ssRecs = this.assertNoMockDataWhenRealSource("SPREADSHEET_DATA", this.getActiveRecordsForSource("SPREADSHEET_DATA"));
        rawRecords = [...dbRecs, ...ssRecs];
        break;
    }

    // Safety assert to ensure we don't leak "Grupo Topázio" mock records when using real data
    this.cachedActiveRecords = this.assertNoMockDataWhenRealSource(this.state.activeDataSource, rawRecords);
    return this.cachedActiveRecords;
  }

  private getActiveRecordsForSource(source: "SPREADSHEET_DATA" | "DATABASE_DATA"): LancamentoFinanceiro[] {
    const raw: LancamentoFinanceiro[] = [];
    if (source === "SPREADSHEET_DATA") {
      const activeFiles = this.workspace.files.filter((f) => 
        this.workspace.activeFileIds.includes(f.id) && f.status === "ACTIVE"
      );
      activeFiles.forEach((file) => {
        file.sheets.forEach((sheet) => {
          raw.push(...(sheet.rows as LancamentoFinanceiro[]));
        });
      });
    } else {
      raw.push(...this.databaseRecords);
    }
    return raw;
  }

  // --- SPREADSHEET WORKSPACE OPERATIONS ---
  public getWorkspace(): SpreadsheetWorkspace {
    return this.workspace;
  }

  public addSpreadsheetFile(file: SpreadsheetFile, mode: "APPEND" | "REPLACE" | "SEPARATE" | "PENDING") {
    if (mode === "REPLACE") {
      this.workspace.files = [file];
      this.workspace.activeFileIds = [file.id];
    } else if (mode === "APPEND") {
      this.workspace.files.push(file);
      this.workspace.activeFileIds.push(file.id);
    } else if (mode === "SEPARATE") {
      this.workspace.files.push({ ...file, status: "INACTIVE" });
    } else {
      this.workspace.files.push({ ...file, status: "PENDING_APPROVAL" });
    }

    this.workspace.updatedAt = new Date().toISOString();
    
    // Automatically switch active source to SPREADSHEET_DATA on import
    this.state.activeDataSource = "SPREADSHEET_DATA";
    this.state.approvedByConsultant = false; // require approval for reports

    // Version this import
    const allImportedRows: LancamentoFinanceiro[] = [];
    file.sheets.forEach(s => allImportedRows.push(...(s.rows as LancamentoFinanceiro[])));
    this.createNewVersion("SPREADSHEET", file.fileName, allImportedRows);

    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public deleteSpreadsheetFile(fileId: string) {
    this.workspace.files = this.workspace.files.filter((f) => f.id !== fileId);
    this.workspace.activeFileIds = this.workspace.activeFileIds.filter((id) => id !== fileId);
    this.workspace.updatedAt = new Date().toISOString();
    
    if (this.workspace.activeFileIds.length === 0) {
      // Fallback to DEMO if no files are imported/active
      this.state.activeDataSource = "DEMO_DATA";
      this.state.approvedByConsultant = true;
    }
    
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  public toggleSpreadsheetFile(fileId: string) {
    const isCurrentlyActive = this.workspace.activeFileIds.includes(fileId);
    if (isCurrentlyActive) {
      this.workspace.activeFileIds = this.workspace.activeFileIds.filter((id) => id !== fileId);
      // update status flag
      const file = this.workspace.files.find(f => f.id === fileId);
      if (file) file.status = "INACTIVE";
    } else {
      this.workspace.activeFileIds.push(fileId);
      const file = this.workspace.files.find(f => f.id === fileId);
      if (file) file.status = "ACTIVE";
    }
    this.workspace.updatedAt = new Date().toISOString();
    
    if (this.workspace.activeFileIds.length > 0) {
      this.state.activeDataSource = "SPREADSHEET_DATA";
    } else {
      this.state.activeDataSource = "DEMO_DATA";
    }
    
    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  // --- DATABASE CACHE STORAGE ---
  public syncDatabaseRecords(records: LancamentoFinanceiro[], sourceName: string) {
    // Sanitize to make sure we don't store mock data in real db records
    this.databaseRecords = this.assertNoMockDataWhenRealSource("DATABASE_DATA", records);
    try {
      localStorage.setItem("sauron_ds_db_data", JSON.stringify(this.databaseRecords));
    } catch (e) {
      console.warn("[Sauron Storage] Erro ao salvar sauron_ds_db_data no localStorage (limite excedido):", e);
    }
    
    this.state.activeDataSource = "DATABASE_DATA";
    this.state.approvedByConsultant = false; // require approval to use in dashboards

    // Create importation version
    this.createNewVersion("DATABASE", sourceName, this.databaseRecords);

    this.saveToStorage();
    this.triggerUpdateEvent();
  }

  // --- VERSIONING OPERATIONS ---
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
      data: data
    };
    
    this.dataVersions.push(newVersion);
    this.saveToStorage();
  }

  public rollbackToVersion(versionId: string) {
    const ver = this.dataVersions.find(v => v.versionId === versionId);
    if (!ver) return;

    // Reset status and load rows
    this.dataVersions.forEach(v => {
      if (v.versionId === versionId) {
        v.status = "OFFICIAL";
      } else {
        v.status = "DISCARDED";
      }
    });

    if (ver.source === "SPREADSHEET") {
      this.state.activeDataSource = "SPREADSHEET_DATA";
      // Formulate a virtual single file spreadsheet workspace containing these rows
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

  // --- DATA QUALITY CALCULATORS ---
  public calculateQualityScore(rows: any[]): { score: number; label: "Excelente" | "Boa" | "Atenção" | "Crítica"; report: string[] } {
    if (!rows || rows.length === 0) {
      return { score: 100, label: "Excelente", report: ["Base limpa ou vazia."] };
    }

    let score = 100;
    const report: string[] = [];
    const total = rows.length;
    
    // 1. Check for empty rows or critical blank fields
    const criticalFields = ["Grupo", "CNPJ", "Marca", "Empresa", "Mês", "Receita"];
    const blankCounts: Record<string, number> = {};
    criticalFields.forEach(f => { blankCounts[f] = 0; });
    
    let emptyColumnsCount = 0;
    let duplicateRows = 0;
    const rowSignatures = new Set<string>();

    rows.forEach((r, idx) => {
      // Signature for duplicate detection
      const sig = `${r.Grupo}-${r.CNPJ}-${r.Marca}-${r.Mês}-${r.Razão}-${r.Receita}-${r.Despesa}`;
      if (rowSignatures.has(sig)) {
        duplicateRows++;
      } else {
        rowSignatures.add(sig);
      }

      criticalFields.forEach(f => {
        if (r[f] === undefined || r[f] === null || String(r[f]).trim() === "") {
          blankCounts[f]++;
        }
      });
    });

    // Score deduction rules
    criticalFields.forEach(f => {
      if (blankCounts[f] > 0) {
        const pct = (blankCounts[f] / total) * 100;
        score -= Math.min(20, Math.round(pct * 1.5));
        report.push(`Coluna '${f}' possui ${blankCounts[f]} registros vazios (${pct.toFixed(1)}%).`);
      }
    });

    if (duplicateRows > 0) {
      const pct = (duplicateRows / total) * 100;
      score -= Math.min(15, Math.round(pct * 1.2));
      report.push(`Detetadas ${duplicateRows} possíveis linhas duplicadas (${pct.toFixed(1)}%).`);
    }

    // Check for weird col names
    const keys = Object.keys(rows[0] || {});
    const techCols = keys.filter(k => k.startsWith("__EMPTY") || k.toLowerCase().includes("vazio"));
    if (techCols.length > 0) {
      score -= 10;
      report.push(`Aviso: Detetadas ${techCols.length} colunas sem cabeçalho amigável (Ex: ${techCols.join(", ")}).`);
    }

    score = Math.max(0, Math.min(100, score));
    let label: "Excelente" | "Boa" | "Atenção" | "Crítica" = "Excelente";
    if (score < 40) label = "Crítica";
    else if (score < 70) label = "Atenção";
    else if (score < 90) label = "Boa";

    return { score, label, report };
  }

  // --- CLIENT FILTER MANAGER ---
  public getFilterConfigs(): ClientFilterConfig[] {
    return this.filterConfigs;
  }

  public registerFilterConfig(config: ClientFilterConfig) {
    // Block tech/empty column filters
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

  // --- CONSULTANT DATA ACTIONS (SEPARATE LAYER) ---
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
    // Make copy
    const cloned = records.map(r => ({ ...r }));
    
    // For classifications / adjustments, apply overlays safely without modifying raw records
    this.consultantAdjustments.forEach(adj => {
      if (adj.type === "classificacao" && adj.targetField) {
        cloned.forEach(row => {
          // e.g. if row satisfies a filter "Marca=Jeep", set field
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

  // --- DATA CATALOG BUILDER ---
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

  // --- EVENT TRIGGERING FOR REACT ---
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
