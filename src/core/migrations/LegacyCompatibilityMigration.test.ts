import { beforeEach, describe, expect, it, vi } from "vitest";
import { runLegacyCompatibilityMigration } from "./LegacyCompatibilityMigration";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => Array.from(values.keys())[index] ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  } as Storage;
}

function storage(): Storage {
  return (globalThis as any).localStorage as Storage;
}

describe("legacy compatibility migration", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  it("moves valid legacy metadata once and removes only old keys", () => {
    storage().setItem("sauron_active_dataset", JSON.stringify({
      datasetId: "dataset-real",
      rawStorageRef: "dataset-real",
      sourceName: "real.csv",
    }));
    storage().setItem("sauron_active_company_id", "company-real");
    storage().setItem("up_file_orphan", "queue-only");

    runLegacyCompatibilityMigration();
    runLegacyCompatibilityMigration();

    expect(JSON.parse(storage().getItem("sauron_ds_active_dataset") || "null")).toMatchObject({ datasetId: "dataset-real" });
    expect(storage().getItem("sauron_active_dataset")).toBeNull();
    expect(storage().getItem("sauron_active_company_id")).toBeNull();
    expect(storage().getItem("up_file_orphan")).toBeNull();
    expect(storage().getItem("sauron_migrations_completed_v1")).toBe("1");
  });

  it("does not replace current metadata or remove unrelated records", () => {
    storage().setItem("sauron_ds_active_dataset", JSON.stringify({ datasetId: "current", rawStorageRef: "current" }));
    storage().setItem("sauron_active_dataset", JSON.stringify({ datasetId: "legacy", rawStorageRef: "legacy" }));
    storage().setItem("unrelated", "preserve");

    runLegacyCompatibilityMigration();

    expect(JSON.parse(storage().getItem("sauron_ds_active_dataset") || "null")).toMatchObject({ datasetId: "current" });
    expect(storage().getItem("unrelated")).toBe("preserve");
  });
});
