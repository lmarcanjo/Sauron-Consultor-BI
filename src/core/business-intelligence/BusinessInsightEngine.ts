import { BusinessMetric } from "./BusinessMetricTypes";

/**
 * @deprecated [LEGADO] Este tipo pertence ao namespace legado src/core/business-intelligence/.
 * O namespace canônico para novos motores de inteligência é src/core/business-insight/.
 */
export interface BusinessMetricInsight {
  metricId: string;
  severity: "info" | "warning" | "critical";
  message: string;
  evidence: string[];
}

/**
 * @deprecated [LEGADO] Esta função pertence ao namespace legado src/core/business-intelligence/.
 * Novos motores de análise devem implementar IAsterionBusinessInsightEngine no namespace src/core/business-insight/.
 */
export function buildMetricInsights(metrics: BusinessMetric[]): BusinessMetricInsight[] {
  return metrics.flatMap(metric => {
    const insights: BusinessMetricInsight[] = [];

    if (metric.status === "pending") {
      insights.push({
        metricId: metric.id,
        severity: "warning",
        message: `${metric.label} está pendente de configuração.`,
        evidence: metric.diagnostics.warnings,
      });
    }

    if (metric.status === "insufficient_data") {
      insights.push({
        metricId: metric.id,
        severity: "warning",
        message: `${metric.label} não possui dados suficientes para cálculo.`,
        evidence: [...metric.diagnostics.warnings, ...metric.diagnostics.errors],
      });
    }

    if (metric.status === "ready" && metric.rowsSampled === 0) {
      insights.push({
        metricId: metric.id,
        severity: "critical",
        message: `${metric.label} está pronta, mas sem linhas amostradas registradas.`,
        evidence: ["Verificar rowProvider/lineage da métrica."],
      });
    }

    if (metric.status === "ready" && metric.lineage.rowAccess.strategy === "preview") {
      insights.push({
        metricId: metric.id,
        severity: "info",
        message: `${metric.label} foi calculada usando preview; para fechamento final, usar leitura paginada ou backend.`,
        evidence: [`Estratégia de leitura: ${metric.lineage.rowAccess.strategy}.`],
      });
    }

    return insights;
  });
}
