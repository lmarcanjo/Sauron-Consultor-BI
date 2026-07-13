import { describe, expect, it } from "vitest";
import { businessVocabularyEngine } from "./BusinessVocabularyEngine";
import "./index";

describe("BusinessVocabularyEngine Unit Tests", () => {
  it("resolves specific domain synonyms", () => {
    // Automotive
    const resolvedAuto1 = businessVocabularyEngine.resolveSynonym("automotive", "Vendedor");
    expect(resolvedAuto1).toBe("Consultor de vendas");

    const resolvedAuto2 = businessVocabularyEngine.resolveSynonym("automotive", "Executivo de vendas");
    expect(resolvedAuto2).toBe("Consultor de vendas");

    // Agribusiness
    const resolvedAgro = businessVocabularyEngine.resolveSynonym("agribusiness", "Cooperado");
    expect(resolvedAgro).toBe("Produtor");

    // Healthcare
    const resolvedHealth = businessVocabularyEngine.resolveSynonym("healthcare", "Cliente");
    expect(resolvedHealth).toBe("Paciente");

    // Construction
    const resolvedConstr = businessVocabularyEngine.resolveSynonym("construction", "Projeto");
    expect(resolvedConstr).toBe("Obra");
  });

  it("falls back to shared vocabulary for universal synonyms", () => {
    const resolvedShared = businessVocabularyEngine.resolveSynonym("automotive", "Holding");
    expect(resolvedShared).toBe("Grupo");
  });

  it("returns input term if synonym not found in domain or shared", () => {
    const resolvedUnknown = businessVocabularyEngine.resolveSynonym("retail", "Abajur");
    expect(resolvedUnknown).toBe("Abajur");
  });

  it("retrieves synonyms list for a primary term", () => {
    const synonyms = businessVocabularyEngine.getSynonyms("automotive", "Consultor de vendas");
    expect(synonyms).toContain("Vendedor");
    expect(synonyms).toContain("Executivo de vendas");
    expect(synonyms).toContain("Consultor");
  });
});
