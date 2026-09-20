import { ContainerQualityMetric, TechnicalRecommendation } from './QualityContracts';

export class TechnicalRecommendationBuilder {
  public static build(containers: ContainerQualityMetric[]): TechnicalRecommendation[] {
    const recommendations: TechnicalRecommendation[] = [];

    for (const container of containers) {
      for (const col of container.columnMetrics) {
        if (col.hasMixedTypes) {
          recommendations.push({
            id: `rec_fix_type_${container.containerId}_${col.columnName}`,
            type: 'TYPE_SANITIZATION',
            description: `Sanitizar valores não numéricos/texto ruidoso na coluna "${col.columnName}".`,
            targetRef: `${container.containerId}.${col.columnName}`,
            suggestedAction: 'CAST_OR_CONVERT_NOISE',
            impactScore: 85
          });
        }

        if (col.nullsPercentage > 20 && !col.isEmpty) {
          recommendations.push({
            id: `rec_fill_nulls_${container.containerId}_${col.columnName}`,
            type: 'NULL_HANDLING',
            description: `A coluna "${col.columnName}" possui ${col.nullsPercentage}% de nulos. Definir valor default ou regra de imputação.`,
            targetRef: `${container.containerId}.${col.columnName}`,
            suggestedAction: 'PROVIDE_DEFAULT_VALUE',
            impactScore: 60
          });
        }
      }
    }

    return recommendations;
  }
}
