import { describe, expect, it } from "vitest";
import automotivePack from "./automotive";

describe("AutomotivePack Unit Tests", () => {
  it("verifies manifest metadata", () => {
    expect(automotivePack.manifest.id).toBe("automotive");
    expect(automotivePack.manifest.name).toBe("Automotivo");
    expect(automotivePack.manifest.subdomains).toContain("oficina");
  });

  it("verifies vocabulary terms are registered", () => {
    const terms = automotivePack.vocabulary.terms.map(t => t.term);
    expect(terms).toContain("Concessionária");
    expect(terms).toContain("Consultor de vendas");
    expect(terms).toContain("Oficina");
    expect(terms).toContain("F&I");
  });

  it("verifies hierarchy levels are correct", () => {
    expect(automotivePack.hierarchy.levels).toEqual(["Grupo", "Marca", "Concessionária", "Departamento"]);
  });

  it("verifies kpis are defined", () => {
    const ticketKpi = automotivePack.kpis.find(k => k.code === "TICKET_MEDIO");
    expect(ticketKpi).toBeDefined();
    expect(ticketKpi?.unit).toBe("currency");
  });

  it("runs automotive rule validation", () => {
    const rule = automotivePack.rules.find(r => r.id === "fi_penetration_limit");
    expect(rule).toBeDefined();

    const sampleRecords = [
      { FI: 5000, Veiculos: 25000 },
      { FI: 30000, Veiculos: 20000 }
    ];

    const validationResult = rule!.validate(sampleRecords);
    expect(validationResult[0].valid).toBe(true);
    expect(validationResult[1].valid).toBe(false);
    expect(validationResult[1].message).toContain("superior a vendas de veículos");
  });
});
