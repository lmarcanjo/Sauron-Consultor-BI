/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("Recovery Gate guards", () => {
  it("mantém o importador sob o contexto canônico", () => {
    const importer = read("src/components/spreadsheet/SimpleSpreadsheetImporter.tsx");
    expect(importer).toContain("importContextService");
    expect(importer).not.toMatch(/EnterpriseRepository|enterpriseRepository\.getAll|sauron_enterprises/);
  });

  it("não permite que a prova principal de MVP faça seed da estrutura", () => {
    const e2e = read("tests/e2e/mvp-core-delivery.spec.ts");
    expect(e2e).not.toMatch(/seedEnterprises|sauron_enterprises|localStorage\.setItem/);
    expect(e2e).toContain("createCanonicalClientEngagementStructure");
  });

  it("mantém a exigência de Engajamento na criação de DataSource", () => {
    const service = read("src/core/datasource/DataSourceService.ts");
    expect(service).toContain("engagementId: string;");
    expect(service).toContain("EngagementId é obrigatório");
  });

  it("Recovery Gate MVP-1.2 Guard: Enforce single CTA for analysis across all tabs/components", () => {
    const panel = read("src/components/ChaosProfilingPanel.tsx");
    // Button must be labeled ANALISAR DADOS and match test id
    expect(panel).toContain('data-testid="chaos-analyze"');
    expect(panel).toContain("ANALISAR DADOS");
    expect(panel).not.toContain("Analisar estrutura");
  });

  it("Recovery Gate MVP-1.2 Guard: Confirm PRELIMINARY never calls certified/LLM workflows", () => {
    const service = read("src/core/preliminary-analysis/PreliminaryFinancialAnalysisService.ts");
    // Ensure isolation from certified DRE, reconciliation or LLM confirmation systems
    expect(service).not.toContain("SemanticConfirmationService");
    expect(service).not.toContain("dreReconciliationArtifactRepository");
    expect(service).not.toContain("DreCompositionService");
  });

  it("Recovery Gate MVP-1.2 Guard: Verify no direct repository usage inside the UI components", () => {
    const componentDir = path.join(root, "src/components");
    const files = fs.readdirSync(componentDir);
    for (const file of files) {
      if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        const content = read(path.join("src/components", file));
        expect(content, `Component ${file} must not import preliminaryFinancialAnalysisRepository directly`).not.toContain("preliminaryFinancialAnalysisRepository");
        expect(content, `Component ${file} must not import LocalPreliminaryFinancialAnalysisRepository directly`).not.toContain("LocalPreliminaryFinancialAnalysisRepository");
      }
    }
  });
});
