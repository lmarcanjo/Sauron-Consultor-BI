import { describe, expect, it } from "vitest";
import { parseNumericValue } from "./activeDatasetView";

describe("activeDatasetView.parseNumericValue", () => {
  it("parses Brazilian decimals and thousand separators from spreadsheet formatted values", () => {
    expect(parseNumericValue("38,07")).toBe(38.07);
    expect(parseNumericValue("38,073")).toBe(38073);
    expect(parseNumericValue("1,904")).toBe(1904);
    expect(parseNumericValue("1.904,55")).toBe(1904.55);
    expect(parseNumericValue("1,904.55")).toBe(1904.55);
  });
});

