import { describe, expect, it } from "vitest";
import agribusinessPack from "./agribusiness";

describe("AgribusinessPack Unit Tests", () => {
  it("verifies manifest metadata", () => {
    expect(agribusinessPack.manifest.id).toBe("agribusiness");
    expect(agribusinessPack.manifest.name).toBe("Agronegócio");
    expect(agribusinessPack.manifest.subdomains).toContain("lavoura");
  });

  it("verifies vocabulary terms are registered", () => {
    const terms = agribusinessPack.vocabulary.terms.map(t => t.term);
    expect(terms).toContain("Fazenda");
    expect(terms).toContain("Talhão");
    expect(terms).toContain("Safra");
    expect(terms).toContain("Produtor");
  });

  it("verifies hierarchy levels are correct", () => {
    expect(agribusinessPack.hierarchy.levels).toEqual(["Grupo", "Empresa", "Fazenda", "Packing", "Talhão"]);
  });

  it("verifies kpis are defined with correct units", () => {
    const prodKpi = agribusinessPack.kpis.find(k => k.code === "PRODUCTION");
    expect(prodKpi).toBeDefined();
    expect(prodKpi?.unit).toBe("numeric");

    const productivityKpi = agribusinessPack.kpis.find(k => k.code === "PRODUCTIVITY");
    expect(productivityKpi).toBeDefined();
    expect(productivityKpi?.unit).toBe("ratio");
  });

  it("runs agribusiness rule validation", () => {
    const rule = agribusinessPack.rules.find(r => r.id === "productivity_positive");
    expect(rule).toBeDefined();

    const sampleRecords = [
      { Produtividade: 85 },
      { Produtividade: -10 }
    ];

    const validationResult = rule!.validate(sampleRecords);
    expect(validationResult[0].valid).toBe(true);
    expect(validationResult[1].valid).toBe(false);
    expect(validationResult[1].message).toContain("negativa detectada");
  });
});
