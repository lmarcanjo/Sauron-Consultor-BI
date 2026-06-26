import { describe, it, expect } from 'vitest';
import { RecommendationEngine } from './RecommendationEngine';
import { TrendEngine } from './TrendEngine';
import { BenchmarkEngine } from './BenchmarkEngine';
import { AnomalyEngine } from './AnomalyEngine';
import { NarrativeEngine } from './NarrativeEngine';
import { AnalysisContext } from './types';

const mockContext: AnalysisContext = {
    kpis: [{ id: '1', name: 'Receita', value: 150, unit: 'R$' }],
    dre: [],
    costCenters: [{ id: 'cc1', name: 'ADM', expenses: 500000 }],
    indicators: [],
    comparatives: [{ entityId: 'e1', entityName: 'Loja 1', value: 200, period: 'Jun' }]
};

describe('Analytics Engines', () => {
  it('deve gerar recomendação', () => {
    const engine = new RecommendationEngine();
    const result = engine.analyze({ ...mockContext, kpis: [{ id: '2', name: 'Margem', value: -5, unit: '%' }] });
    expect(result.length).toBe(1);
    expect(result[0].problem).toContain('Margem');
  });

  it('deve calcular tendência', () => {
    const engine = new TrendEngine();
    const result = engine.calculateTrends(mockContext);
    expect(result.length).toBe(1);
    expect(result[0].direction).toBe('growth');
  });

  it('deve detectar anomalia', () => {
    const engine = new AnomalyEngine();
    const result = engine.detect({ ...mockContext, costCenters: [{ id: 'cc2', name: 'Extra', expenses: 2000000 }] });
    expect(result.length).toBe(1);
    expect(result[0].severity).toBe('high');
  });

  it('deve gerar resumo', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate(mockContext);
    expect(result.summary).toContain('Receita: 150R$');
  });
});
