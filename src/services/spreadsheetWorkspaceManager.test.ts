import { describe, it, expect, beforeEach } from "vitest";
import { dataSourceManager } from "./dataSourceManager";
import { SpreadsheetWorkspaceManager } from "./spreadsheetWorkspaceManager";
import { SpreadsheetFile } from "../types/dataSource";

describe("SpreadsheetWorkspaceManager Suite", () => {
  beforeEach(() => {
    // Reset workspace before each test
    dataSourceManager.setActiveSource("DEMO_DATA");
    dataSourceManager.setApproved(true);
  });

  it("should successfully manage, query, and trace spreadsheet files inside the workspace", () => {
    const fileId = "test_file_001";
    const sampleFile: SpreadsheetFile = {
      id: fileId,
      fileName: "faturamento_q1.xlsx",
      importedAt: new Date().toISOString(),
      importedBy: "Lennon Marcanjo",
      status: "PENDING_VALIDATION",
      totalRows: 1,
      totalColumns: 2,
      approvedByConsultant: false,
      sheets: [
        {
          id: "sheet_q1",
          fileId: fileId,
          sheetName: "Janeiro",
          rows: [
            { id: "row_1", Grupo: "Grupo Alfa S/A", CNPJ: "12.345.678/0001-90", Marca: "Alfa Fiat", Empresa: "Alfa Filial 1", Mês: "Janeiro", Receita: 15000 }
          ],
          columns: [{ name: "Grupo", type: "string", hasEmptyValues: false }, { name: "Receita", type: "number", hasEmptyValues: false }]
        }
      ]
    };

    // Add file using the correct method
    SpreadsheetWorkspaceManager.substituirBase(sampleFile);

    // Retrieve sheets via SpreadsheetWorkspaceManager helper
    const sheets = SpreadsheetWorkspaceManager.verAbas(fileId);
    expect(sheets).toContain("Janeiro");

    // Fetch workspace files directly from dataSourceManager
    const workspace = dataSourceManager.getWorkspace();
    const retrievedFile = workspace.files.find(f => f.id === fileId);
    expect(retrievedFile).toBeDefined();
    expect(retrievedFile?.fileName).toBe("faturamento_q1.xlsx");
    expect(retrievedFile?.status).toBe("ACTIVE"); // SubstituirBase activates by default

    // Assert traceability
    const originLabel = SpreadsheetWorkspaceManager.verOrigem(fileId);
    expect(originLabel).toContain("faturamento_q1.xlsx");
    expect(originLabel).toContain("Lennon Marcanjo");
  });
});
