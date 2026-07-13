import { describe, expect, it } from "vitest";
import { businessHierarchyEngine } from "./BusinessHierarchyEngine";
import "./index";

describe("BusinessHierarchyEngine Unit Tests", () => {
  it("retrieves the hierarchy levels of the automotive domain", () => {
    const h = businessHierarchyEngine.getHierarchy("automotive");
    expect(h).not.toBeNull();
    expect(h?.levels).toEqual(["Grupo", "Marca", "Concessionária", "Departamento"]);
  });

  it("retrieves the hierarchy levels of the agribusiness domain", () => {
    const h = businessHierarchyEngine.getHierarchy("agribusiness");
    expect(h).not.toBeNull();
    expect(h?.levels).toEqual(["Grupo", "Empresa", "Fazenda", "Packing", "Talhão"]);
  });

  it("retrieves the hierarchy levels of the construction domain", () => {
    const h = businessHierarchyEngine.getHierarchy("construction");
    expect(h).not.toBeNull();
    expect(h?.levels).toEqual(["Grupo", "Empresa", "Obra", "Etapa"]);
  });

  it("returns null for non-existing domain", () => {
    const h = businessHierarchyEngine.getHierarchy("invalid-domain");
    expect(h).toBeNull();
  });
});
