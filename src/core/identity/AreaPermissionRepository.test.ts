/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it } from "vitest";
import { areaPermissionRepository } from "./AreaPermissionRepository";

const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
};

describe("AreaPermissionRepository", () => {
  beforeEach(() => {
    Object.keys(storage).forEach(key => delete storage[key]);
    global.localStorage = localStorageMock as any;
  });

  it("keeps grants isolated by company context", () => {
    areaPermissionRepository.grant("user-1", "area-1", ["VIEW"], { groupId: "group-1", companyId: "company-a" });
    areaPermissionRepository.grant("user-1", "area-1", ["EDIT"], { groupId: "group-1", companyId: "company-b" });

    expect(areaPermissionRepository.toPermissionStrings("user-1", { groupId: "group-1", companyId: "company-a" }))
      .toEqual(["VIEW_AREA:area-1"]);
    expect(areaPermissionRepository.toPermissionStrings("user-1", { groupId: "group-1", companyId: "company-b" }))
      .toEqual(["EDIT_AREA:area-1"]);
  });

  it("revokes only the selected context", () => {
    areaPermissionRepository.grant("user-1", "area-1", ["VIEW"], { groupId: "group-1", companyId: "company-a" });
    areaPermissionRepository.grant("user-1", "area-1", ["VIEW"], { groupId: "group-1", companyId: "company-b" });
    areaPermissionRepository.revokeAllForArea("area-1", { groupId: "group-1", companyId: "company-a" });

    expect(areaPermissionRepository.toPermissionStrings("user-1", { groupId: "group-1", companyId: "company-a" })).toEqual([]);
    expect(areaPermissionRepository.toPermissionStrings("user-1", { groupId: "group-1", companyId: "company-b" }))
      .toEqual(["VIEW_AREA:area-1"]);
  });
});
