import { ContainerQualityMetric, QualityAlert } from './QualityContracts';

export class QualityAlertBuilder {
  public static build(containers: ContainerQualityMetric[]): QualityAlert[] {
    const alerts: QualityAlert[] = [];
    const now = new Date().toISOString();

    for (const container of containers) {
      if (container.totalRows === 0) {
        alerts.push({
          id: `alt_empty_cnt_${container.containerId}`,
          code: 'CONTAINER_EMPTY',
          severity: 'CRITICAL',
          message: `O container "${container.containerName}" está sem registros (0 linhas).`,
          containerId: container.containerId,
          detectedAt: now
        });
      }

      for (const col of container.columnMetrics) {
        if (col.isEmpty) {
          alerts.push({
            id: `alt_empty_col_${container.containerId}_${col.columnName}`,
            code: 'COLUMN_FULLY_NULL',
            severity: 'WARNING',
            message: `A coluna "${col.columnName}" no container "${container.containerName}" está 100% nula.`,
            containerId: container.containerId,
            columnName: col.columnName,
            metricsImpacted: ['completenessPercentage', 'densityPercentage'],
            detectedAt: now
          });
        }

        if (col.hasMixedTypes) {
          alerts.push({
            id: `alt_mixed_col_${container.containerId}_${col.columnName}`,
            code: 'COLUMN_MIXED_TYPES',
            severity: 'CRITICAL',
            message: `A coluna "${col.columnName}" no container "${container.containerName}" contém tipos de dados conflitantes.`,
            containerId: container.containerId,
            columnName: col.columnName,
            metricsImpacted: ['consistencyPercentage'],
            detectedAt: now
          });
        }

        if (col.isConstant) {
          alerts.push({
            id: `alt_const_col_${container.containerId}_${col.columnName}`,
            code: 'COLUMN_CONSTANT_VALUE',
            severity: 'INFO',
            message: `A coluna "${col.columnName}" no container "${container.containerName}" contém apenas 1 valor constante.`,
            containerId: container.containerId,
            columnName: col.columnName,
            metricsImpacted: ['uniquenessPercentage'],
            detectedAt: now
          });
        }
      }
    }

    return alerts;
  }
}
