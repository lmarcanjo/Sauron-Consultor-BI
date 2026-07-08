import { AnalysisContext, Recommendation } from './types';

export class RecommendationEngine {
  analyze(context: AnalysisContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Se margem caiu e despesa administrativa subiu
    const margem = context.kpis.find(k => k.name === 'Margem')?.value || 0;
    const despesasAdm = context.dre.find(d => d.account === 'Despesas Administrativas')?.value || 0;
    
    if (margem < 15 && despesasAdm > 100000) {
        recommendations.push({
            problem: 'Margem baixa com despesas administrativas elevadas',
            evidence: `Margem: ${margem}%, Despesas: ${despesasAdm}`,
            action: 'Revisar contratos recorrentes e política de gastos.',
            priority: 'high',
            impactExpected: 'Aumento de 2-3 p.p. na margem',
            responsible: 'Diretoria',
            deadline: '30 dias',
            origin: 'DRE/KPI'
        });
    }

    return recommendations;
  }
}
