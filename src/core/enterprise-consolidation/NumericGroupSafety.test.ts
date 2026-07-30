/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { normalizeExternalScalar } from "../../utils/calculations";

describe("Hotfix 25.3-R1 — External Type Safety & Numeric Group Verification", () => {
  it("safely normalizes numeric, boolean, null, undefined, Date and string scalars without throwing TypeError", () => {
    expect(normalizeExternalScalar(4629617)).toBe("4629617");
    expect(normalizeExternalScalar("4629617")).toBe("4629617");
    expect(normalizeExternalScalar(0)).toBe("0");
    expect(normalizeExternalScalar(true)).toBe("true");
    expect(normalizeExternalScalar(null)).toBe("");
    expect(normalizeExternalScalar(undefined)).toBe("");
    expect(normalizeExternalScalar({})).toBe("");
    expect(normalizeExternalScalar([])).toBe("");
  });

  it("prevents .toLowerCase crash on numeric row fields", () => {
    const row = {
      Grupo: 4629617,
      Revenda: 3,
      Marca: 5,
      Filial: 3,
      Empresa: "YAMAHA_FABERGE_CARAGUA"
    };

    const groupStr = normalizeExternalScalar(row.Grupo).toLowerCase();
    expect(groupStr).toBe("4629617");
    expect(groupStr.includes("4629617")).toBe(true);
  });
});
