import { describe, expect, it } from "vitest";
import { findUnauthorizedDomainVocabulary, scanDomainVocabulary, scanProductionDomainVocabulary } from "./DomainVocabularyScanner";

describe("domain vocabulary scanner", () => {
  it("allows vocabulary inside Domain Packs and reports generic production code", () => {
    const findings = scanDomainVocabulary([
      { file: "src/core/business-domains/automotive/vocabulary.ts", source: "export const term = 'veículo';" },
      { file: "src/components/GenericReport.tsx", source: "const label = 'veículo';" },
    ]);

    expect(findings).toHaveLength(2);
    expect(findings[0].allowed).toBe(true);
    expect(findUnauthorizedDomainVocabulary(findings)).toEqual([
      expect.objectContaining({ file: "src/components/GenericReport.tsx", term: "veículo" }),
    ]);
  });

  it("keeps the existing residual vocabulary visible as tracked debt", () => {
    const findings = scanProductionDomainVocabulary();
    expect(findings.length).toBeGreaterThan(0);
    expect(findUnauthorizedDomainVocabulary(findings)).toEqual([]);
  });
});
