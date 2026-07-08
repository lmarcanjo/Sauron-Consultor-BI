import { dataSourceManager } from "./dataSourceManager";
import { SpreadsheetFile, SpreadsheetColumn } from "../types/dataSource";

export const SpreadsheetWorkspaceManager = {
  importarPlanilha(file: SpreadsheetFile, mode: "APPEND" | "REPLACE" | "SEPARATE" | "PENDING") {
    // Inject initial status as PENDING_VALIDATION per Sprint Beta directives
    const enhancedFile: SpreadsheetFile = {
      ...file,
      status: "PENDING_VALIDATION",
      approvedByConsultant: false,
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

  substituirPlanilha(oldFileId: string, newFile: SpreadsheetFile) {
    const workspace = dataSourceManager.getWorkspace();
    const oldFile = workspace.files.find(f => f.id === oldFileId);
    
    // Inactivate old file
    if (oldFile) {
      oldFile.status = "INACTIVE";
      oldFile.approvedByConsultant = false;
      workspace.activeFileIds = workspace.activeFileIds.filter(id => id !== oldFileId);
    }

    // Determine version of new file (increment version number)
    const sameNameFiles = workspace.files.filter(f => f.fileName === newFile.fileName);
    const verNum = sameNameFiles.length + 1;
    const currentVersion = `v${verNum}`;

    // Inherit some fields but make it a new version starting at PENDING_VALIDATION
    const enhancedFile: SpreadsheetFile = {
      ...newFile,
      version: currentVersion,
      versao: currentVersion,
      status: "PENDING_VALIDATION",
      approvedByConsultant: false,
    };

    dataSourceManager.addSpreadsheetFile(enhancedFile, "APPEND");
  },

  consolidarPlanilhas(fileIds: string[], targetFileName: string): SpreadsheetFile | null {
    const workspace = dataSourceManager.getWorkspace();
    const filesToConsolidate = workspace.files.filter(f => fileIds.includes(f.id));
    if (filesToConsolidate.length === 0) return null;

    // Merge rows
    const consolidatedRows: any[] = [];
    const allSheetsNames = new Set<string>();
    let totalCols = 0;

    filesToConsolidate.forEach(file => {
      file.sheets.forEach(sheet => {
        allSheetsNames.add(sheet.sheetName);
        consolidatedRows.push(...sheet.rows);
      });
      totalCols = Math.max(totalCols, file.totalColumns);
    });

    const fileId = `consolidated_${Date.now()}`;
    const consolidatedFile: SpreadsheetFile = {
      id: fileId,
      fileName: targetFileName || "Planilhas Consolidadas",
      nome: targetFileName || "Planilhas Consolidadas",
      importedAt: new Date().toISOString(),
      dataImportacao: new Date().toISOString(),
      importedBy: "Lennon Marcanjo",
      usuario: "Lennon Marcanjo",
      status: "PENDING_VALIDATION",
      approvedByConsultant: false,
      totalRows: consolidatedRows.length,
      totalColumns: totalCols,
      totalAbas: allSheetsNames.size,
      version: "v1",
      versao: "v1",
      sheets: [
        {
          id: `sheet_con_${Date.now()}`,
          fileId: fileId,
          sheetName: "Dados Consolidados",
          rows: consolidatedRows,
          columns: []
        }
      ]
    };

    dataSourceManager.addSpreadsheetFile(consolidatedFile, "APPEND");
    return consolidatedFile;
  },

  ativarPlanilha(fileId: string) {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (file) {
      file.status = "ACTIVE";
      // To strictly follow approval flow, we let the status be active,
      // but the reports will only be fed if approvedByConsultant === true
      if (!workspace.activeFileIds.includes(fileId)) {
        workspace.activeFileIds.push(fileId);
      }
      
      // Update global approvedByConsultant if this file is approved
      const anyApprovedActive = workspace.files.some(f => 
        workspace.activeFileIds.includes(f.id) && f.approvedByConsultant === true
      );
      dataSourceManager.setApproved(anyApprovedActive);
      
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
      
      const anyApprovedActive = workspace.files.some(f => 
        workspace.activeFileIds.includes(f.id) && f.approvedByConsultant === true
      );
      dataSourceManager.setApproved(anyApprovedActive);
      
      dataSourceManager.setActiveSource("SPREADSHEET_DATA");
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
      dataSourceManager.setApproved(true);
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
      
      const anyApprovedActive = workspace.files.some(f => 
        workspace.activeFileIds.includes(f.id) && f.approvedByConsultant === true
      );
      dataSourceManager.setApproved(anyApprovedActive);
      
      dataSourceManager.setActiveSource("SPREADSHEET_DATA");
      dataSourceManager.saveToStorage();
      dataSourceManager.triggerUpdateEvent();
    }
  },

  avancarStatus(fileId: string) {
    const workspace = dataSourceManager.getWorkspace();
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) return;

    if (file.status === "PENDING_VALIDATION") {
      file.status = "PENDING_MAPPING";
    } else if (file.status === "PENDING_MAPPING") {
      file.status = "PENDING_APPROVAL";
    } else if (file.status === "PENDING_APPROVAL") {
      this.aprovarPlanilha(fileId);
    }
    dataSourceManager.saveToStorage();
    dataSourceManager.triggerUpdateEvent();
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
    return file ? `Arquivo: ${file.fileName} | Versão: ${file.version} | Importado por: ${file.importedBy} em ${new Date(file.importedAt).toLocaleString()}` : "Origem não encontrada";
  }
};
