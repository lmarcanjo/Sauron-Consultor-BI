/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyBlueprintSafely,
  computeBlueprintDiff,
  getBlueprintSnapshotHistory,
  getLastBlueprintSnapshot,
  rollbackBlueprintApplication,
} from "./BlueprintDiffService";
import { BLUEPRINTS } from "./ProjectDNA";
import { consultingModelRepository, ConsultingModelConfiguration } from "./ConsultingModelRepository";

const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => Object.keys(storage).forEach(key => delete storage[key]),
};

function makeConfig(overrides: Partial<ConsultingModelConfiguration> = {}): ConsultingModelConfiguration {
  return {
    workspaceId: "workspace_blueprint_test",
    groupId: "group_blueprint_test",
    companyId: "company_blueprint_test",
    enabledModules: [],
    businessAreas: [],
    selectedFields: {},
    customMetrics: [],
    displayDictionary: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("BlueprintDiffService", () => {
  beforeEach(() => {
    Object.keys(storage).forEach(key => delete storage[key]);
    global.localStorage = localStorageMock as any;
    global.window = { localStorage: localStorageMock, dispatchEvent: () => true } as any;
  });

  it("applies only selected areas and does not share blueprint references", () => {
    const blueprint = BLUEPRINTS[0];
    const current = makeConfig();
    const diff = computeBlueprintDiff(blueprint, current);
    const selected = diff.areasToAdd.slice(0, 1).map(area => area.areaId);
    const result = applyBlueprintSafely({
      blueprint,
      currentConfig: current,
      diff,
      selection: { includeAreaIds: selected, overwriteConflicts: false },
    });

    expect(result.nextConfig.businessAreas).toHaveLength(1);
    result.nextConfig.businessAreas[0].relatedFields.push("local-only");
    expect(blueprint.businessAreas[0].relatedFields).not.toContain("local-only");
    expect(result.nextConfig.enabledModules).toEqual(expect.arrayContaining(selected));
  });

  it("does not overwrite a conflicting area without explicit confirmation", () => {
    const blueprint = BLUEPRINTS[0];
    const current = makeConfig({
      appliedBlueprintId: "previous-blueprint",
      businessAreas: [{
        ...blueprint.businessAreas[0],
        name: "Nome escolhido",
      }],
    });
    const diff = computeBlueprintDiff(blueprint, current);
    expect(diff.areasConflicting.map(area => area.areaId)).toContain(blueprint.businessAreas[0].id);

    const kept = applyBlueprintSafely({
      blueprint,
      currentConfig: current,
      diff,
      selection: { includeAreaIds: [blueprint.businessAreas[0].id], overwriteConflicts: false },
    });
    expect(kept.nextConfig.businessAreas[0].name).toBe("Nome escolhido");

    const replaced = applyBlueprintSafely({
      blueprint,
      currentConfig: current,
      diff,
      selection: { includeAreaIds: [blueprint.businessAreas[0].id], overwriteConflicts: true },
    });
    expect(replaced.nextConfig.businessAreas[0].name).toBe(blueprint.businessAreas[0].name);
  });

  it("keeps bounded snapshots and restores the exact pre-apply configuration", async () => {
    const blueprint = BLUEPRINTS[0];
    const current = makeConfig();
    const diff = computeBlueprintDiff(blueprint, current);
    const result = applyBlueprintSafely({
      blueprint,
      currentConfig: current,
      diff,
      selection: { includeAreaIds: diff.areasToAdd.map(area => area.areaId), overwriteConflicts: false },
    });

    const snapshot = getLastBlueprintSnapshot(current.workspaceId, current.companyId);
    expect(snapshot?.snapshotId).toBe(result.snapshotId);
    expect(getBlueprintSnapshotHistory(current.workspaceId, current.companyId)).toHaveLength(1);

    const save = vi.spyOn(consultingModelRepository, "saveConfiguration").mockResolvedValue();
    const restored = await rollbackBlueprintApplication(current.workspaceId, current.companyId, result.snapshotId);
    expect(restored).toEqual(current);
    expect(save).toHaveBeenCalledWith(current);
    expect(getLastBlueprintSnapshot(current.workspaceId, current.companyId)).toBeNull();
    save.mockRestore();
  });
});
