import { describe, it, expect, beforeEach } from "vitest";
import { dataSourceManager } from "./dataSourceManager";
import { SpreadsheetWorkspaceManager } from "./spreadsheetWorkspaceManager";
import { SpreadsheetFile } from "../types/dataSource";

describe("SpreadsheetWorkspaceManager & E2E Flow Suite", () => {
  beforeEach(() => {
    // Reset workspace and versions before each test
    dataSourceManager.setActiveSource("DEMO_DATA");
    dataSourceManager.setApproved(true);
    const ws = dataSourceManager.getWorkspace();
    ws.files = [];
    ws.activeFileIds = [];
    
    // Clear versions and cache
    (dataSourceManager as any).dataVersions = [];
    (dataSourceManager as any).cachedActiveRecords = null;
  });

  // Helper to create a clean mock file
  function createMockFile(id: string, name: string): SpreadsheetFile {
    return {
      id,
      fileName: name,
      importedAt: new Date().toISOString(),
      importedBy: "Lennon Marcanjo",
      status: "PENDING_VALIDATION",
      totalRows: 2,
      totalColumns: 4,
      sheets: [
        {
          id: `sheet_${id}`,
          fileId: id,
          sheetName: "Financeiro Q2",
          rows: [
            { id: "row_1", Grupo: "Alfa S/A", CNPJ: "12.345.678/0001-90", Marca: "Alfa Fiat", Empresa: "Alfa Filial 1", Mês: "2026-06", Receita: 25000, Custo: 10000, Despesa: 5000, Lucro: 10000, Margem: 40 },
            { id: "row_2", Grupo: "Alfa S/A", CNPJ: "12.345.678/0001-90", Marca: "Alfa Fiat", Empresa: "Alfa Filial 1", Mês: "2026-06", Receita: 15000, Custo: 5000, Despesa: 2000, Lucro: 8000, Margem: 53.3 }
          ],
          columns: [
            { name: "Grupo", type: "string", hasEmptyValues: false },
            { name: "Receita", type: "number", hasEmptyValues: false },
            { name: "Mês", type: "string", hasEmptyValues: false }
          ]
        }
      ]
    };
  }

  // --- UNIT TESTS ---
  
  it("should support importing a spreadsheet with initial PENDING_VALIDATION status", () => {
    const file = createMockFile("file_01", "q1_billing.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file, "APPEND");
    
    const ws = dataSourceManager.getWorkspace();
    const imported = ws.files.find(f => f.id === "file_01");
    
    expect(imported).toBeDefined();
    expect(imported?.status).toBe("PENDING_VALIDATION");
    expect(imported?.approvedByConsultant).toBe(false);
  });

  it("should support approving a spreadsheet", () => {
    const file = createMockFile("file_02", "q2_billing.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file, "APPEND");
    
    SpreadsheetWorkspaceManager.aprovarPlanilha("file_02");
    
    const ws = dataSourceManager.getWorkspace();
    const approved = ws.files.find(f => f.id === "file_02");
    expect(approved?.status).toBe("ACTIVE");
    expect(approved?.approvedByConsultant).toBe(true);
  });

  it("should support rejecting/reprovar a spreadsheet", () => {
    const file = createMockFile("file_03", "q3_billing.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file, "APPEND");
    
    SpreadsheetWorkspaceManager.reprovarPlanilha("file_03");
    
    const ws = dataSourceManager.getWorkspace();
    const rejected = ws.files.find(f => f.id === "file_03");
    expect(rejected?.status).toBe("ERROR");
    expect(rejected?.approvedByConsultant).toBe(false);
  });

  it("should support activating a spreadsheet", () => {
    const file = createMockFile("file_04", "q4_billing.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file, "APPEND");
    
    SpreadsheetWorkspaceManager.ativarPlanilha("file_04");
    
    const ws = dataSourceManager.getWorkspace();
    const activated = ws.files.find(f => f.id === "file_04");
    expect(activated?.status).toBe("ACTIVE");
    expect(ws.activeFileIds).toContain("file_04");
  });

  it("should support deactivating a spreadsheet", () => {
    const file = createMockFile("file_05", "q5_billing.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file, "APPEND");
    SpreadsheetWorkspaceManager.ativarPlanilha("file_05");
    
    SpreadsheetWorkspaceManager.desativarPlanilha("file_05");
    
    const ws = dataSourceManager.getWorkspace();
    const deactivated = ws.files.find(f => f.id === "file_05");
    expect(deactivated?.status).toBe("INACTIVE");
    expect(ws.activeFileIds).not.toContain("file_05");
  });

  it("should support deleting a spreadsheet", () => {
    const file = createMockFile("file_06", "q6_billing.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file, "APPEND");
    
    SpreadsheetWorkspaceManager.excluirPlanilha("file_06");
    
    const ws = dataSourceManager.getWorkspace();
    const deleted = ws.files.find(f => f.id === "file_06");
    expect(deleted).toBeUndefined();
  });

  it("should version spreadsheet imports incrementally", () => {
    const file1 = createMockFile("file_v1", "sales_history.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file1, "APPEND");
    
    const file2 = createMockFile("file_v2", "sales_history.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file2, "APPEND");

    const ws = dataSourceManager.getWorkspace();
    const f1 = ws.files.find(f => f.id === "file_v1");
    const f2 = ws.files.find(f => f.id === "file_v2");
    
    expect(f1?.version).toBe("v1");
    expect(f2?.version).toBe("v2");
  });

  it("should calculate and generate appropriate quality score labels", () => {
    const file = createMockFile("file_score", "score_calc.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file, "APPEND");
    
    const scoreInfo = SpreadsheetWorkspaceManager.verQualidade("file_score");
    expect(scoreInfo).toBeDefined();
    expect(scoreInfo.score).toBeGreaterThan(0);
    expect(["Excelente", "Boa", "Atenção", "Crítica"]).toContain(scoreInfo.label);
  });

  // --- END-TO-END SIMULATION TESTS ---

  it("should simulate complete E2E workflow securely", () => {
    // 1. Import spreadsheet
    const file = createMockFile("e2e_file", "fluxo_faturamento_anual.xlsx");
    SpreadsheetWorkspaceManager.importarPlanilha(file, "APPEND");

    // 2. See pending status
    const ws = dataSourceManager.getWorkspace();
    const fileInWorkspace = ws.files.find(f => f.id === "e2e_file");
    expect(fileInWorkspace?.status).toBe("PENDING_VALIDATION");
    expect(fileInWorkspace?.approvedByConsultant).toBe(false);

    // 3. Confirm that unapproved sheets DO NOT feed active records
    // Switch active source to SPREADSHEET_DATA
    dataSourceManager.setActiveSource("SPREADSHEET_DATA");
    let activeRecs = dataSourceManager.getActiveRecords();
    // Since our imported file is not approved, active records must be empty!
    expect(activeRecs.length).toBe(0);

    // 4. Approve spreadsheet
    SpreadsheetWorkspaceManager.aprovarPlanilha("e2e_file");
    expect(fileInWorkspace?.status).toBe("ACTIVE");
    expect(fileInWorkspace?.approvedByConsultant).toBe(true);

    // 5. Activate spreadsheet
    SpreadsheetWorkspaceManager.ativarPlanilha("e2e_file");

    // 6. Confirm that now approved sheet successfully feeds active records!
    activeRecs = dataSourceManager.getActiveRecords();
    expect(activeRecs.length).toBe(2);
    expect(activeRecs[0].Receita).toBe(25000);

    // 7. Create a new version (simulate replacement)
    const newVersionFile = createMockFile("e2e_file_v2", "fluxo_faturamento_anual.xlsx");
    // Change a value to track version differences
    newVersionFile.sheets[0].rows[0].Receita = 30000;
    
    SpreadsheetWorkspaceManager.substituirPlanilha("e2e_file", newVersionFile);
    
    // 8. Confirm history has both versions
    const f1 = ws.files.find(f => f.id === "e2e_file");
    const f2 = ws.files.find(f => f.id === "e2e_file_v2");
    expect(f1?.version).toBe("v1");
    expect(f2?.version).toBe("v2");
    // First version becomes inactive after substitution, second starts as PENDING_VALIDATION
    expect(f1?.status).toBe("INACTIVE");
    expect(f2?.status).toBe("PENDING_VALIDATION");
  });
});
