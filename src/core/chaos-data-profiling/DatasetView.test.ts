import { describe, expect, it } from "vitest";
import { confirmDatasetView, createDatasetView, profileChaosSource } from "./index";

describe("DatasetView", () => {
  it("starts as a draft and becomes confirmed only by explicit consultant action", () => {
    const profile = profileChaosSource({
      sourceId: "source-view",
      sourceType: "csv",
      groupId: "group-view",
      sourceName: "dados.csv",
      physicalContainers: [{ id: "table", name: "dados", type: "table", columns: ["A", "B"], records: [{ rowIndex: 0, values: { A: 1, B: "x" } }] }],
    });
    const draft = createDatasetView({
      profile,
      containerIds: ["table"],
      blockIds: profile.detectedBlocks.map(block => block.blockId),
      selectedColumns: ["A", "B"],
      selectedRowsRule: "only DATA rows",
      now: "2026-07-23T12:00:00.000Z",
    });
    expect(draft.status).toBe("DRAFT");
    expect(draft.physicalToLogicalMapping).toEqual({ A: "A", B: "B" });

    const confirmed = confirmDatasetView(draft, "consultor-1", "2026-07-23T12:01:00.000Z");
    expect(confirmed.status).toBe("CONFIRMED");
    expect(confirmed.confirmedBy).toBe("consultor-1");
    expect(draft.status).toBe("DRAFT");
  });
});
