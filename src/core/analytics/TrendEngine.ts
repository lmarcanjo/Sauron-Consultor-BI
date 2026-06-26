import { AnalysisContext, Trend } from './types';

export class TrendEngine {
  calculateTrends(context: AnalysisContext): Trend[] {
    const trends: Trend[] = [];
    
    // Deterministic trend logic based on period data
    context.kpis.forEach(kpi => {
        trends.push({
            entityId: kpi.id,
            metric: kpi.name,
            period: 'monthly',
            direction: kpi.value > 100 ? 'growth' : 'decline',
            value: kpi.value
        });
    });

    return trends;
  }
}
