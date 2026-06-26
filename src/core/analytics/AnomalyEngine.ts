import { AnalysisContext, Anomaly } from './types';

export class AnomalyEngine {
  detect(context: AnalysisContext): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    // Detect anomalies in expenses
    context.costCenters.forEach(cc => {
        if (cc.expenses > 1000000) {
            anomalies.push({
                description: `Despesa anormal no centro de custo ${cc.name}`,
                severity: 'high',
                impact: 'Alto impacto no resultado',
                evidence: `Valor de ${cc.expenses}`,
                possibleCause: 'Falha em alocação ou despesa não planejada'
            });
        }
    });

    return anomalies;
  }
}
