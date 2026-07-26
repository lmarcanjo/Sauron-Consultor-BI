import { beforeEach, describe, expect, it, vi } from "vitest";
import { chaosProfilingRepository, ChaosProfilingRepository, confirmDatasetView, createDatasetView, profileChaosSource } from "./index";

function source() {
  return profileChaosSource({
    sourceId: "source-persisted",
    sourceType: "csv",
    groupId: "group-persisted",
    sourceName: "fonte.csv",
    physicalContainers: [{
      id: "dados",
      name: "Dados",
      type: "sheet",
      rowCount: 2,
      columns: ["A", "B"],
      records: [
        { rowIndex: 0, values: { A: "Nome", B: "Valor" } },
        { rowIndex: 1, values: { A: "Ana", B: 10 } },
      ],
    }],
  }, { now: "2026-07-23T12:00:00.000Z" });
}

describe("ChaosProfilingRepository", () => {
  beforeEach(() => {
    const values: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values[key] || null,
      setItem: (key: string, value: string) => { values[key] = value; },
      removeItem: (key: string) => { delete values[key]; },
    });
    chaosProfilingRepository.clear();
  });

  it("persists the profile and restores it without re-running profiling", async () => {
    const profile = source();
    await chaosProfilingRepository.saveProfile(profile);
    const reloadedRepository = new ChaosProfilingRepository();
    const restored = await reloadedRepository.getProfile("source-persisted");
    expect(restored?.profileId).toBe(profile.profileId);
    expect(restored?.sourceId).toBe("source-persisted");
    expect(restored?.sampledRecords).toBe(2);
  });

  it("persists block/suggestion decisions and view lifecycle separately", async () => {
    const profile = source();
    await chaosProfilingRepository.saveProfile(profile);
    const block = profile.detectedBlocks[0];
    if (block) await chaosProfilingRepository.updateBlockStatus(profile.profileId, block.blockId, "CONFIRMED", "user-1");
    const suggestion = profile.semanticSuggestions[0];
    if (suggestion) await chaosProfilingRepository.updateSuggestionStatus(profile.profileId, suggestion.id, "IGNORED", "user-1");
    const draft = createDatasetView({
      profile,
      containerIds: ["dados"],
      blockIds: block ? [block.blockId] : [],
      selectedColumns: ["A", "B"],
      selectedRowsRule: "Linhas selecionadas pelo consultor",
      now: "2026-07-23T12:01:00.000Z",
    });
    await chaosProfilingRepository.saveView(draft);
    expect((await chaosProfilingRepository.getLatestDraft(profile.sourceId))?.datasetViewId).toBe(draft.datasetViewId);
    const confirmed = confirmDatasetView(draft, "user-1", "2026-07-23T12:02:00.000Z");
    await chaosProfilingRepository.saveView(confirmed);
    expect((await chaosProfilingRepository.getConfirmedView(profile.sourceId))?.status).toBe("CONFIRMED");
    expect((await chaosProfilingRepository.listDecisions(profile.profileId)).length).toBeGreaterThanOrEqual(1);
  });
});
