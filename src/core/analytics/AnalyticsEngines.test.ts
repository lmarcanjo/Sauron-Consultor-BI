import { describe, it, expect } from 'vitest';
import { RecommendationEngine } from './RecommendationEngine';
import { TrendEngine } from './TrendEngine';
import { BenchmarkEngine } from './BenchmarkEngine';
import { AnomalyEngine } from './AnomalyEngine';
import { NarrativeEngine } from './NarrativeEngine';
import { AnalysisContext } from './types';

const mockContext: AnalysisContext = {
    period: { current: 'Junho', previous: 'Maio' },
    client: 'Cliente Teste',
    segment: 'Concessionária Popular',
    company: 'Empresa A',
    cnpj: '00.000.000/0001-00',
    dre: [{ account: 'Despesas Administrativas', value: 150000, period: 'Junho', category: 'expense' }],
    kpis: [
        { id: '1', name: 'Receita', value: 150000, unit: 'R$', target: 200000 },
        { id: '2', name: 'Margem', value: 12, unit: '%', target: 20 }
    ],
    targets: [],
    entries: [],
    filters: [],
    costCenters: [{ id: 'cc1', name: 'ADM', expenses: 150000 }],
    comparatives: [{ entityId: 'e1', entityName: 'Loja 1', value: 200, period: 'Junho' }]
};

describe('Analytics Engines', () => {
  it('deve gerar recomendação para margem baixa', () => {
    const engine = new RecommendationEngine();
    const result = engine.analyze(mockContext);
    expect(result.length).toBe(1);
    expect(result[0].problem).toContain('Margem');
  });

  it('deve calcular tendência de queda', () => {
    const engine = new TrendEngine();
    const result = engine.calculateTrends({
        ...mockContext,
        kpis: [{ id: '1', name: 'Margem', value: 10, unit: '%', target: 15 }],
        targets: [{ id: '1', name: 'Margem', value: 15, unit: '%', target: 15 }]
    });
    expect(result[0].direction).toBe('decline');
    expect(result[0].variationPercent).toBeLessThan(0);
  });

  it('deve detectar anomalia de despesa', () => {
    const engine = new AnomalyEngine();
    const result = engine.detect({ ...mockContext, costCenters: [{ id: 'cc2', name: 'Extra', expenses: 2000000 }] });
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('Despesa Anormal');
  });

  it('deve gerar resumo executivo', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate(mockContext);
    expect(result.summary).toContain('Junho');
    expect(result.summary).toContain('Cliente Teste');
  });
});
