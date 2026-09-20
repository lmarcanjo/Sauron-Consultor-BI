import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';
import { QualityArtifact, QualityMetricsSummary } from './QualityContracts';
import { QualityMetricsCalculator } from './QualityMetricsCalculator';
import { QualityAlertBuilder } from './QualityAlertBuilder';
import { TechnicalRecommendationBuilder } from './TechnicalRecommendationBuilder';
import { auditEngine } from '../audit/AuditEngine';
import { dispatchPlatformEvent } from '../events/PlatformEvents';

export class DataQualityEngine {
  public evaluateQuality(discoveryArtifact: DiscoveryArtifact): QualityArtifact {
    if (!discoveryArtifact || !discoveryArtifact.containers) {
      throw new Error("Um DiscoveryArtifact válido é obrigatório para o DataQualityEngine.");
    }

    const containerMetrics = discoveryArtifact.containers.map(container =>
      QualityMetricsCalculator.calculateContainerMetric(container)
    );

    let totalColumns = 0;
    let totalRowsEvaluated = 0;
    let emptyColumnsCount = 0;
    let constantColumnsCount = 0;
    let mixedTypeColumnsCount = 0;

    let completenessSum = 0;
    let consistencySum = 0;
    let uniquenessSum = 0;

    for (const cm of containerMetrics) {
      totalColumns += cm.totalColumns;
      totalRowsEvaluated += cm.totalRows;
      completenessSum += cm.completenessPercentage;
      consistencySum += cm.consistencyPercentage;
      uniquenessSum += cm.uniquenessPercentage;

      for (const col of cm.columnMetrics) {
        if (col.isEmpty) emptyColumnsCount++;
        if (col.isConstant) constantColumnsCount++;
        if (col.hasMixedTypes) mixedTypeColumnsCount++;
      }
    }

    const containerCount = containerMetrics.length || 1;
    const completenessScore = Math.round(completenessSum / containerCount);
    const consistencyScore = Math.round(consistencySum / containerCount);
    const uniquenessScore = Math.round(uniquenessSum / containerCount);
    const densityScore = completenessScore;

    // Score de Qualidade Global (Média Ponderada)
    const overallQualityScore = Math.round(
      completenessScore * 0.4 +
      consistencyScore * 0.4 +
      uniquenessScore * 0.2
    );

    const metricsSummary: QualityMetricsSummary = {
      overallQualityScore,
      completenessScore,
      consistencyScore,
      uniquenessScore,
      densityScore,
      totalContainers: containerMetrics.length,
      totalColumns,
      totalRowsEvaluated,
      emptyColumnsCount,
      constantColumnsCount,
      mixedTypeColumnsCount
    };

    const alerts = QualityAlertBuilder.build(containerMetrics);
    const recommendations = TechnicalRecommendationBuilder.build(containerMetrics);

    const qualityArtifact: QualityArtifact = {
      artifactId: `qual_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      discoveryArtifactId: discoveryArtifact.artifactId,
      dataSourceId: discoveryArtifact.dataSourceId,
      engagementId: discoveryArtifact.engagementId,
      metricsSummary,
      containerMetrics,
      alerts,
      recommendations,
      evaluatedAt: new Date().toISOString()
    };

    // Auditoria e Evento Factual de Plataforma
    auditEngine.logEvent("DATA_SOURCE_DISCOVERY_COMPLETED", `Avaliação de Qualidade concluída pelo DataQualityEngine para a fonte ${discoveryArtifact.dataSourceId} (Score Global: ${overallQualityScore})`, "INFO", {});
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: discoveryArtifact.dataSourceId, qualityArtifactId: qualityArtifact.artifactId, action: "QUALITY_EVALUATED" });

    return qualityArtifact;
  }
}
