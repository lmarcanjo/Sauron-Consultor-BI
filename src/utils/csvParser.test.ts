import { describe, expect, it } from "vitest";
import { parseCSV } from "./csvParser";

describe("parseCSV data-first", () => {
  it("preserva colunas físicas sem criar campos semânticos", () => {
    const result = parseCSV("A001,B002\nlinha,42");

    expect(result.missingFields).toEqual([]);
    expect(result.data[0]).toMatchObject({ A001: "linha", B002: "42" });
    expect(result.data[0]).not.toHaveProperty("Grupo");
    expect(result.data[0]).not.toHaveProperty("Receita");
  });
});
