import { AnalysisContext, Recommendation } from './types';

export class RecommendationEngine {
  analyze(context: AnalysisContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Example deterministic logic
    context.kpis.forEach(kpi => {
        if (kpi.value < 0) {
            recommendations.push({
                problem: `KPI ${kpi.name} negativo`,
                opportunity: `Melhorar eficiência de ${kpi.name}`,
                recommendation: `Revisar custos associados ao ${kpi.name}`,
                priority: 'high',
                impactExpected: 'Aumento de margem',
                justification: 'KPI negativo impacta diretamente o resultado.'
            });
        }
    });

    return recommendations;
  }
}
