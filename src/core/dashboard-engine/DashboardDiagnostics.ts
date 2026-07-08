import { BusinessMetric } from "../business-intelligence";
import { ModuleName } from "../data/moduleMapping";
import { DashboardBlock, DashboardDiagnostics } from "./DashboardTypes";

export function buildBlockDiagnostics(params: Partial<DashboardDiagnostics>): DashboardDiagnostics {
  return {
    confidence: params.confidence ?? 0,
    warnings: params.warnings || [],
    errors: params.errors || [],
    missingMappings: params.missingMappings || [],
    missingColumns: params.missingColumns || [],
    source: params.source || "BusinessIntelligenceEngine",
  };
}

export function buildDiagnosticsFromMetrics(metrics: BusinessMetric[]): DashboardDiagnostics {
  if (metrics.length === 0) {
    return buildBlockDiagnostics({
      confidence: 0,
      warnings: ["Nenhuma métrica disponível para o bloco."],
    });
  }

  const averageConfidence = metrics.reduce((sum, metric) => sum + metric.diagnostics.confidence, 0) / metrics.length;

  return buildBlockDiagnostics({
    confidence: averageConfidence,
    warnings: metrics.flatMap(metric => metric.diagnostics.warnings),
    errors: metrics.flatMap(metric => metric.diagnostics.errors),
    missingMappings: uniqueModules(metrics.flatMap(metric => metric.diagnostics.missingMappings)),
    missingColumns: unique(metrics.flatMap(metric => metric.diagnostics.missingColumns)),
  });
}

export function buildDashboardDiagnostics(blocks: DashboardBlock[]): DashboardDiagnostics {
  const readyBlocks = blocks.filter(block => block.status === "ready").length;
  const confidence = blocks.length > 0 ? readyBlocks / blocks.length : 0;

  return buildBlockDiagnostics({
    confidence,
    warnings: blocks.flatMap(block => block.diagnostics.warnings),
    errors: blocks.flatMap(block => block.diagnostics.errors),
    missingMappings: uniqueModules(blocks.flatMap(block => block.diagnostics.missingMappings)),
    missingColumns: unique(blocks.flatMap(block => block.diagnostics.missingColumns)),
    source: "BusinessIntelligenceEngine",
  });
}

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function uniqueModules(values: ModuleName[]): ModuleName[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}
