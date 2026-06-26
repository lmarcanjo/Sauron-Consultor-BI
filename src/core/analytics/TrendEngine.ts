import { AnalysisContext, Trend } from './types';

export class TrendEngine {
  calculateTrends(context: AnalysisContext): Trend[] {
    const trends: Trend[] = [];
    
    context.kpis.forEach(kpi => {
        const target = context.targets.find(t => t.id === kpi.id);
        const previousValue = target ? target.value : kpi.value; // Simplified previousValue logic
        const currentValue = kpi.value;
        const variationPercent = ((currentValue - previousValue) / previousValue) * 100;
        
        trends.push({
            metric: kpi.name,
            previousValue,
            currentValue,
            variationPercent,
            direction: variationPercent > 0 ? 'growth' : (variationPercent < 0 ? 'decline' : 'stable'),
            severity: Math.abs(variationPercent) > 20 ? 'high' : 'low'
        });
    });

    return trends;
  }
}
