import { DiscoveryContainer, DiscoveryStatistics } from '../../sdk/DiscoveryContracts';

export class DiscoveryStatisticsBuilder {
  public static calculate(containers: DiscoveryContainer[]): DiscoveryStatistics {
    let totalColumnsCount = 0;
    let totalEstimatedRows = 0;
    let totalNullsCount = 0;
    let totalCellCount = 0;
    let totalDistinctValues = 0;

    for (const container of containers) {
      totalEstimatedRows += container.rowCountEstimate;
      totalColumnsCount += container.columns.length;

      for (const col of container.columns) {
        totalNullsCount += col.nullsCount || 0;
        totalDistinctValues += col.distinctValuesCount || 0;
        totalCellCount += container.rowCountEstimate;
      }
    }

    const nullPercentageOverall = totalCellCount > 0 ? (totalNullsCount / totalCellCount) * 100 : 0;

    // QualityScore estrutural puro: penaliza proporcionalmente o percentual de nulos e colunas nulas
    let qualityScore = 100 - Math.min(100, Math.round(nullPercentageOverall * 0.8));

    return {
      totalContainersCount: containers.length,
      totalColumnsCount,
      totalEstimatedRows,
      nullPercentageOverall: Math.round(nullPercentageOverall * 100) / 100,
      distinctValuesEstimate: totalDistinctValues,
      qualityScore
    };
  }
}
