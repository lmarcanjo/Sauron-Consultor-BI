import { AnalysisContext, ExecutiveSummary } from './types';

export class NarrativeEngine {
  generate(context: AnalysisContext): ExecutiveSummary {
    const kpis = context.kpis.map(k => `${k.name} está em ${k.value}${k.unit}`).join(', ');
    
    return {
        summary: `Em ${context.period.current}, analisando o cliente ${context.client} (${context.segment}), observamos: ${kpis}. Recomendamos atenção especial aos pontos críticos identificados.`
    };
  }
}
