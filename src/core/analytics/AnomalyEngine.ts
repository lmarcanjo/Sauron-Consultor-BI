import { AnalysisContext, Anomaly } from './types';

export class AnomalyEngine {
  detect(context: AnalysisContext): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    // Detect margem negativa
    const margem = context.kpis.find(k => k.name === 'Margem')?.value || 0;
    if (margem < 0) {
        anomalies.push({
            type: 'Margem Negativa',
            severity: 'high',
            entity: 'Empresa',
            evidence: `Margem: ${margem}%`,
            impactEstimated: 10000,
            possibleCause: 'Custos operacionais elevados ou precificação errada',
            recommendation: 'Revisar estrutura de custos e precificação',
            origin: 'KPI'
        });
    }

    // Detect despesa anormal
    context.costCenters.forEach(cc => {
        if (cc.expenses > 1000000) {
            anomalies.push({
                type: 'Despesa Anormal',
                severity: 'high',
                entity: cc.name,
                evidence: `Valor: ${cc.expenses}`,
                impactEstimated: cc.expenses,
                possibleCause: 'Falha em alocação ou despesa não planejada',
                recommendation: 'Auditar lançamentos deste centro de custo',
                origin: 'CostCenter'
            });
        }
    });

    return anomalies;
  }
}
