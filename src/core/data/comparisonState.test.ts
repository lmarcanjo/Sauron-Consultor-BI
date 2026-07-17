import { describe, expect, it } from "vitest";
import { resolveComparison } from "./comparisonState";

describe("comparison state", () => {
  it("keeps a single period or entity in an explicit empty state", () => {
    const result = resolveComparison({ value: 10 }, null);

    expect(result.hasComparison).toBe(false);
    expect(result.left).toEqual({ value: 10 });
    expect(result.right).toBeNull();
    expect(result.message).toMatch(/Selecione dois/);
  });

  it("allows complete comparison without manufacturing a variation", () => {
    const result = resolveComparison({ value: 10 }, { value: 12 });

    expect(result.hasComparison).toBe(true);
    expect(result.left?.value).toBe(10);
    expect(result.right?.value).toBe(12);
  });
});
