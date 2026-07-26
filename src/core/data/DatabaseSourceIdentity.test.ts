import { describe, expect, it } from "vitest";
import { stableDatabaseSourceId } from "./DataActivation";
import { NormalizedDatabaseConfig } from "../connections/DatabaseConfig";

const config: NormalizedDatabaseConfig = {
  type: "mysql",
  host: "10.12.22.14",
  port: 3306,
  user: "consultoria",
  database: "consultoria",
  ssl: false,
  table: "vendas",
  query: "",
  mappings: {},
};

describe("canonical SQL source identity", () => {
  it("is stable for the same table and context", () => {
    const context = { scope: "COMPANY" as const, groupId: "group-a", companyId: "company-a", workbookIds: [], datasetIds: [] };
    expect(stableDatabaseSourceId(config, context)).toBe(stableDatabaseSourceId(config, context));
  });

  it("does not mix the same table between companies", () => {
    const first = { scope: "COMPANY" as const, groupId: "group-a", companyId: "company-a", workbookIds: [], datasetIds: [] };
    const second = { ...first, companyId: "company-b" };
    expect(stableDatabaseSourceId(config, first)).not.toBe(stableDatabaseSourceId(config, second));
  });
});
