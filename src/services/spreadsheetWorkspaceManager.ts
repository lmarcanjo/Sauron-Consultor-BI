import { dataSourceManager } from "./dataSourceManager";
import { SpreadsheetFile, SpreadsheetColumn } from "../types/dataSource";

export const SpreadsheetWorkspaceManager = {
  importarPlanilha(file: SpreadsheetFile, mode: "APPEND" | "REPLACE" | "SEPARATE" | "PENDING") {
    const enhancedFile: SpreadsheetFile = {
      ...file,
      status: mode === "PENDING" ? "PENDING_APPROVAL" : (mode === "SEPARATE" ? "INACTIVE" : "ACTIVE"),
      approvedByConsultant: mode === "PENDING" ? false : true,
    };
    dataSourceManager.addSpreadsheetFile(enhancedFile, mode);
  },

  anexarPlanilha(file: SpreadsheetFile) {
    this.importarPlanilha(file, "APPEND");
  },

  substituirBase(file: SpreadsheetFile) {
    this.importarPlanilha(file, "REPLACE");
  },

  criarWorkspaceSeparado(file: SpreadsheetFile) {
    this.importarPlanilha(file, "SEPARATE");
  },

  ativarPlanilha(fileId: string) {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (file) {
      file.status = "ACTIVE";
      file.approvedByConsultant = true;
      if (!workspace.activeFileIds.includes(fileId)) {
        workspace.activeFileIds.push(fileId);
      }
      dataSourceManager.setActiveSource("SPREADSHEET_DATA");
      dataSourceManager.saveToStorage();
      dataSourceManager.triggerUpdateEvent();
    }
  },

  desativarPlanilha(fileId: string) {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (file) {
      file.status = "INACTIVE";
      workspace.activeFileIds = workspace.activeFileIds.filter(id => id !== fileId);
      if (workspace.activeFileIds.length === 0) {
        dataSourceManager.setActiveSource("DEMO_DATA");
      } else {
        dataSourceManager.setActiveSource("SPREADSHEET_DATA");
      }
      dataSourceManager.saveToStorage();
      dataSourceManager.triggerUpdateEvent();
    }
  },

  excluirPlanilha(fileId: string) {
    dataSourceManager.deleteSpreadsheetFile(fileId);
  },

  aprovarPlanilha(fileId: string) {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (file) {
      file.status = "ACTIVE";
      file.approvedByConsultant = true;
      if (!workspace.activeFileIds.includes(fileId)) {
        workspace.activeFileIds.push(fileId);
      }
      dataSourceManager.setActiveSource("SPREADSHEET_DATA");
      dataSourceManager.saveToStorage();
      dataSourceManager.triggerUpdateEvent();
    }
  },

  reprovarPlanilha(fileId: string) {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (file) {
      file.status = "ERROR";
      file.approvedByConsultant = false;
      workspace.activeFileIds = workspace.activeFileIds.filter(id => id !== fileId);
      if (workspace.activeFileIds.length === 0) {
        dataSourceManager.setActiveSource("DEMO_DATA");
      } else {
        dataSourceManager.setActiveSource("SPREADSHEET_DATA");
      }
      dataSourceManager.saveToStorage();
      dataSourceManager.triggerUpdateEvent();
    }
  },

  verAbas(fileId: string): string[] {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    return file ? file.sheets.map(s => s.sheetName) : [];
  },

  verColunas(fileId: string, sheetName: string): SpreadsheetColumn[] {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) return [];
    const sheet = file.sheets.find(s => s.sheetName === sheetName);
    return sheet ? sheet.columns : [];
  },

  verLinhas(fileId: string, sheetName: string): Record<string, any>[] {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) return [];
    const sheet = file.sheets.find(s => s.sheetName === sheetName);
    return sheet ? sheet.rows : [];
  },

  verQualidade(fileId: string): any {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) return null;
    const allRows: any[] = [];
    file.sheets.forEach(s => allRows.push(...s.rows));
    return dataSourceManager.calculateQualityScore(allRows);
  },

  verOrigem(fileId: string): string {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    return file ? `Arquivo: ${file.fileName} | Importado por: ${file.importedBy} em ${new Date(file.importedAt).toLocaleString()}` : "Origem não encontrada";
  }
};
