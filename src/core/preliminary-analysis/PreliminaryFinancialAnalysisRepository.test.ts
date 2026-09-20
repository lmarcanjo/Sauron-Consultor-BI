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

import { LocalPreliminaryFinancialAnalysisRepository, InMemoryPreliminaryFinancialAnalysisRepository } from "./PreliminaryFinancialAnalysisRepository";
import { PreliminaryFinancialAnalysisArtifact } from "./PreliminaryFinancialAnalysisContracts";

const mockArtifact: PreliminaryFinancialAnalysisArtifact = {
  artifactId: "art_test_123",
  artifactVersion: 1,
  analysisMode: "PRELIMINARY",
  clientId: "client_test",
  engagementId: "eng_test",
  organizationalScope: {
    scopeType: "GROUP",
    targetId: "grp_test",
  },
  dataSourceId: "ds_test",
  workbookId: "wb_test",
  containerId: "sheet_test",
  sourceFileName: "test.xlsx",
  sourceFingerprint: "fingerprint_123",
  schemaVersionNumber: 1,
  
  physicalRowCount: 100,
  headerRowCount: 1,
  dataRowCount: 99,
  validRowCount: 90,
  partiallyValidRowCount: 5,
  excludedRowCount: 4,
  emptyRowCount: 0,
  
  columnCount: 5,
  physicalFields: [],
  fieldUsages: {},
  
  metrics: [],
  groupings: [],
  temporalSeries: [],
  qualityFindings: [],
  limitations: [],
  
  policyId: "policy_v1",
  policyVersion: "1.0.0",
  policyFingerprint: "policy_fp",
  engineVersion: "1.0.0",
  
  provenance: {
    generatedAt: "2026-08-06T12:00:00Z",
    generatedByUserId: "user_test",
    algorithm: "FNV1A_32_DETERMINISTIC",
  },
  fingerprint: "fingerprint_artifact_test",
  generatedAt: "2026-08-06T12:00:00Z",
  generatedByUserId: "user_test",
  status: "COMPLETED",
};

describe("PreliminaryFinancialAnalysisRepository Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("InMemory repository behaves correctly", async () => {
    const repo = new InMemoryPreliminaryFinancialAnalysisRepository();
    await repo.saveVersion(mockArtifact);

    const found = await repo.findById("art_test_123");
    expect(found).not.toBeNull();
    expect(found?.artifactId).toBe("art_test_123");
    expect(found?.status).toBe("COMPLETED");

    await repo.invalidate("art_test_123", "Outdated data");
    const invalidated = await repo.findById("art_test_123");
    expect(invalidated?.status).toBe("INVALIDATED");
  });

  it("Local repository persistency recovery with new instances", async () => {
    // 1. Create instance A
    const repoA = new LocalPreliminaryFinancialAnalysisRepository();
    
    // 2. Save artifact
    await repoA.saveVersion(mockArtifact);

    // 3. Discard instance A and create instance B
    const repoB = new LocalPreliminaryFinancialAnalysisRepository();

    // 4. Retrieve artifact from B
    const retrieved = await repoB.findById("art_test_123");
    
    // 5. Compare retrieved data
    expect(retrieved).not.toBeNull();
    expect(retrieved?.artifactId).toBe(mockArtifact.artifactId);
    expect(retrieved?.fingerprint).toBe(mockArtifact.fingerprint);
    expect(retrieved?.status).toBe(mockArtifact.status);
    expect(retrieved?.physicalRowCount).toBe(mockArtifact.physicalRowCount);

    // 6. Test latest retrieval
    const latest = await repoB.findLatestByEngagement("eng_test");
    expect(latest).not.toBeNull();
    expect(latest?.artifactId).toBe(mockArtifact.artifactId);
  });
});
