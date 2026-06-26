import { AnalysisContext, BenchmarkResult } from './types';

export class BenchmarkEngine {
  compare(context: AnalysisContext): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];
    
    // Logic for comparing entities
    const total = context.comparatives.reduce((acc, curr) => acc + curr.value, 0);
    const avg = context.comparatives.length > 0 ? total / context.comparatives.length : 0;
    
    context.comparatives.forEach(c => {
        results.push({
            entityId: c.entityId,
            benchmarkValue: c.value,
            averageValue: avg,
            difference: c.value - avg,
            status: c.value > avg ? 'above' : 'below'
        });
    });

    return results;
  }
}
