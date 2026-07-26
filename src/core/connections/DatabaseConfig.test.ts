import { describe, expect, it } from "vitest";
import { normalizeDatabaseConfig } from "./DatabaseConfig";

describe("normalizeDatabaseConfig", () => {
  it("normalizes the persisted dbType contract without losing the selected table", () => {
    const result = normalizeDatabaseConfig({ dbType: "mysql", host: "10.0.0.1", port: "3306", database: "consultoria", selectedTable: "vendas" });
    expect(result).toEqual({
      success: true,
      config: expect.objectContaining({ type: "mysql", port: 3306, table: "vendas", database: "consultoria", mappings: {} }),
    });
  });

  it("rejects conflicting type fields instead of choosing one silently", () => {
    expect(normalizeDatabaseConfig({ type: "mysql", dbType: "postgres" })).toEqual({
      success: false,
      stage: "configuration",
      message: "A configuração informa tipos de banco conflitantes.",
    });
  });

  it("allows zero semantic mappings while preserving the physical query contract", () => {
    const result = normalizeDatabaseConfig({ type: "mysql", tableName: "IMP_VENDAS", mappings: {} });
    expect(result.success).toBe(true);
    if (result.success) expect(result.config.mappings).toEqual({});
  });
});
