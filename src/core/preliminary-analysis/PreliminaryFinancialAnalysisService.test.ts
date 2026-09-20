/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, beforeEach } from "vitest";

// Mock localStorage globally for Node.js environment in Vitest
const store: Record<string, string> = {};
if (typeof global.localStorage === "undefined") {
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  };
}

import { PreliminaryFinancialAnalysisService } from "./PreliminaryFinancialAnalysisService";
import { InMemoryPreliminaryFinancialAnalysisRepository } from "./PreliminaryFinancialAnalysisRepository";
import { PreliminaryDatasetReader, PreliminaryDatasetSnapshot } from "./PreliminaryDatasetReader";
import { WorkspaceRepository } from "../../modules/consultant-workspace/WorkspaceRepository";
import { PlatformUser } from "../identity/types";

class MockDatasetReader implements PreliminaryDatasetReader {
  public data: PreliminaryDatasetSnapshot = {
    columns: ["Emissão", "Pessoa", "Conta Contábil", "Valor", "Valor Pago", "Saldo"],
    rows: [
      { "Emissão": 46168, Pessoa: "AMS EUROPEAN", "Conta Contábil": "VENDA DE MAMAO", Valor: "7500,89", "Valor Pago": "0", Saldo: "7500,89" },
      { "Emissão": 46169, Pessoa: "AMS EUROPEAN", "Conta Contábil": "VENDA DE MAMAO", Valor: "2499,11", "Valor Pago": "2000", Saldo: "499,11" },
    ],
    fileName: "Consulta Financeiro Topp.xls",
    fingerprint: "fingerprint_topp",
    rowCount: 2,
    columnCount: 6,
  };

  async readDataset(): Promise<PreliminaryDatasetSnapshot> {
    return this.data;
  }
}

describe("PreliminaryFinancialAnalysisService Tests", () => {
  const currentUser: PlatformUser = {
    id: "usr_consultant_a",
    role: "CONSULTANT",
    profile: {
      id: "prof_a",
      fullName: "Consultant A",
      email: "consultant@asterion.com",
    },
  };

  const otherUser: PlatformUser = {
    id: "usr_consultant_b",
    role: "CONSULTANT",
    profile: {
      id: "prof_b",
      fullName: "Consultant B",
      email: "consultant_b@asterion.com",
    },
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("calculates totals, resolved fields and checks authorization correctly", async () => {
    const repo = new InMemoryPreliminaryFinancialAnalysisRepository();
    const reader = new MockDatasetReader();
    const workspaceRepo = new WorkspaceRepository();

    // Seed test Client and Engagement
    await workspaceRepo.saveClient({
      id: "client_1",
      legalName: "Cliente Teste",
      document: "12.345.678/0001-90",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedConsultantId: "usr_consultant_a",
    });

    await workspaceRepo.saveProject({
      id: "eng_1",
      client: "Cliente Teste",
      clientId: "client_1",
      group: "Grupo Teste",
      segment: "Serviços",
      companies: ["cmp_1"],
      brands: [],
      cnpjs: [],
      dbConnections: [],
      spreadsheets: [],
      importProfile: null,
      filters: [],
      kpis: [],
      dashboards: [],
      presentations: [],
      actionPlans: [],
      meetings: [],
      observations: "",
      history: [],
      auditLog: [],
      lastUpdated: new Date().toISOString(),
      isArchived: false,
      assignedConsultantId: "usr_consultant_a",
    });

    const service = new PreliminaryFinancialAnalysisService(repo, reader, workspaceRepo);

    // 1. Run analysis for authorized user
    const artifact = await service.analyze(
      {
        engagementId: "eng_1",
        dataSourceId: "ds_1",
        workbookId: "wb_1",
        containerId: "sheet_1",
      },
      currentUser
    );

    expect(artifact).not.toBeNull();
    expect(artifact.status).toBe("COMPLETED");
    expect(artifact.dataRowCount).toBe(2);

    // Check value totals calculated
    const valTotal = artifact.metrics.find(m => m.code === "VALUE_TOTAL")?.value;
    const paidTotal = artifact.metrics.find(m => m.code === "PAID_VALUE_TOTAL")?.value;
    const balanceTotal = artifact.metrics.find(m => m.code === "BALANCE_TOTAL")?.value;

    expect(valTotal).toBeCloseTo(10000.00);
    expect(paidTotal).toBeCloseTo(2000.00);
    expect(balanceTotal).toBeCloseTo(8000.00);

    // Check field resolution mapping
    expect(artifact.fieldUsages["value"]).toBe("Valor");
    expect(artifact.fieldUsages["paid_value"]).toBe("Valor Pago");
    expect(artifact.fieldUsages["balance"]).toBe("Saldo");

    // 2. Invalidate behavior
    await service.invalidate(artifact.artifactId, "New file uploaded", currentUser);
    const updatedArt = await service.getArtifactById(artifact.artifactId, currentUser);
    expect(updatedArt?.status).toBe("INVALIDATED");

    // 3. Rejection for other user
    await expect(service.getArtifactById(artifact.artifactId, otherUser)).rejects.toThrow(
      /Acesso negado/i
    );
  });
});
