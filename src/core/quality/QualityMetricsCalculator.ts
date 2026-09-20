import { DiscoveryContainer, DiscoveryColumn } from '../discovery/sdk/DiscoveryContracts';
import { ColumnQualityMetric, ContainerQualityMetric } from './QualityContracts';

export class QualityMetricsCalculator {
  public static calculateColumnMetric(col: DiscoveryColumn, totalRows: number): ColumnQualityMetric {
    const nullsCount = col.nullsCount || 0;
    const distinctValuesCount = col.distinctValuesCount || 0;
    const totalValues = totalRows > 0 ? totalRows : col.sampleValues.length;

    const nullsPercentage = totalValues > 0 ? (nullsCount / totalValues) * 100 : 0;
    const densityPercentage = Math.max(0, 100 - nullsPercentage);
    const uniquenessPercentage = totalValues > 0 ? (distinctValuesCount / totalValues) * 100 : 0;
    const duplicationPercentage = Math.max(0, 100 - uniquenessPercentage);

    const isEmpty = col.inferredType === 'EMPTY' || nullsCount === totalValues;
    const isConstant = distinctValuesCount === 1 && totalValues > 1;
    const hasMixedTypes = col.inferredType === 'MIXED';

    // Score de qualidade por coluna (0-100)
    let qualityScore = 100;
    if (isEmpty) qualityScore = 0;
    else {
      qualityScore -= nullsPercentage * 0.5; // Penalidade proporcional a nulos
      if (hasMixedTypes) qualityScore -= 30; // Penalidade por tipos misturados
      if (isConstant) qualityScore -= 10;    // Penalidade menor por coluna constante
    }

    return {
      columnName: col.name,
      inferredType: col.inferredType,
      totalValues,
      nullsCount,
      nullsPercentage: Math.round(nullsPercentage * 100) / 100,
      distinctValuesCount,
      uniquenessPercentage: Math.round(uniquenessPercentage * 100) / 100,
      duplicationPercentage: Math.round(duplicationPercentage * 100) / 100,
      densityPercentage: Math.round(densityPercentage * 100) / 100,
      isConstant,
      isEmpty,
      hasMixedTypes,
      qualityScore: Math.max(0, Math.round(qualityScore))
    };
  }

  public static calculateContainerMetric(container: DiscoveryContainer): ContainerQualityMetric {
    const columnMetrics = container.columns.map(col =>
      this.calculateColumnMetric(col, container.rowCountEstimate)
    );

    if (columnMetrics.length === 0) {
      return {
        containerId: container.id,
        containerName: container.name,
        totalRows: container.rowCountEstimate,
        totalColumns: 0,
        completenessPercentage: 0,
        consistencyPercentage: 0,
        uniquenessPercentage: 0,
        columnMetrics: [],
        qualityScore: 0
      };
    }

    const avgCompleteness = columnMetrics.reduce((acc, c) => acc + c.densityPercentage, 0) / columnMetrics.length;
    const avgConsistency = columnMetrics.reduce((acc, c) => acc + (c.hasMixedTypes ? 50 : 100), 0) / columnMetrics.length;
    const avgUniqueness = columnMetrics.reduce((acc, c) => acc + c.uniquenessPercentage, 0) / columnMetrics.length;
    const avgQualityScore = columnMetrics.reduce((acc, c) => acc + c.qualityScore, 0) / columnMetrics.length;

    return {
      containerId: container.id,
      containerName: container.name,
      totalRows: container.rowCountEstimate,
      totalColumns: container.columns.length,
      completenessPercentage: Math.round(avgCompleteness * 100) / 100,
      consistencyPercentage: Math.round(avgConsistency * 100) / 100,
      uniquenessPercentage: Math.round(avgUniqueness * 100) / 100,
      columnMetrics,
      qualityScore: Math.round(avgQualityScore)
    };
  }
}
