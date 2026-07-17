import { describe, expect, it } from "vitest";
import { getMetricDefinition, metricKeyFor } from "./MetricRegistry";

describe("Metric Registry", () => {
  it("keeps aliases on stable keys", () => {
    expect(metricKeyFor("totalVendido")).toBe("revenue");
    expect(metricKeyFor("receitaCandidata")).toBe("revenue");
    expect(metricKeyFor("despesaCandidata")).toBe("expense");
    expect(metricKeyFor("resultadoLiquido")).toBe("net_result");
  });

  it("exposes format and producer metadata", () => {
    expect(getMetricDefinition("revenue")).toMatchObject({
      format: "currency",
      unit: "BRL",
      producer: "BusinessMetricCalculator",
    });
  });
});
