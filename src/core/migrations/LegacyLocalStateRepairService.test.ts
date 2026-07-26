import { beforeEach, describe, expect, it, vi } from "vitest";
import { LegacyLocalStateRepairService } from "./LegacyLocalStateRepairService";

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

describe("LegacyLocalStateRepairService canonical data-state cleanup", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  it("removes DataSourceManager state without removing canonical metadata", async () => {
    localStorage.setItem("sauron_ds_state", JSON.stringify({ activeDataSource: "DATABASE_DATA" }));
    localStorage.setItem("sauron_ds_db_data", JSON.stringify([{ id: 1, value: 10 }]));
    localStorage.setItem("sauron_ds_versions", JSON.stringify([{ id: "legacy-version" }]));
    localStorage.setItem("sauron_ds_active_dataset", JSON.stringify({
      datasetId: "dataset-canonical",
      rawStorageRef: "dataset-canonical",
      sourceName: "source.csv",
    }));

    const service = new LegacyLocalStateRepairService();
    const first = await service.repair();
    const second = await service.repair();

    expect(localStorage.getItem("sauron_ds_state")).toBeNull();
    expect(localStorage.getItem("sauron_ds_db_data")).toBeNull();
    expect(localStorage.getItem("sauron_ds_versions")).toBeNull();
    expect(JSON.parse(localStorage.getItem("sauron_ds_active_dataset") || "null")).toMatchObject({ datasetId: "dataset-canonical" });
    expect(first.repairedKeys).toEqual(expect.arrayContaining(["sauron_ds_state", "sauron_ds_db_data", "sauron_ds_versions"]));
    expect(second.idempotent).toBe(true);
  });
});
