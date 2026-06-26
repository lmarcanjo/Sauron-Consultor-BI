import { AnalysisContext, ExecutiveSummary } from './types';

export class NarrativeEngine {
  generate(context: AnalysisContext): ExecutiveSummary {
    const kpis = context.kpis.map(k => `${k.name}: ${k.value}${k.unit}`).join(', ');
    
    return {
        summary: `Resumo executivo: Os indicadores atuais são: ${kpis}. Recomendamos atenção aos pontos críticos identificados.`
    };
  }
}
