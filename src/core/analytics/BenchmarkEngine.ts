import { AnalysisContext, BenchmarkResult } from './types';

export class BenchmarkEngine {
  compare(context: AnalysisContext): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];
    
    // Sort to rank
    const sorted = [...context.comparatives].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((acc, curr) => acc + curr.value, 0);
    const avg = sorted.length > 0 ? total / sorted.length : 0;
    
    sorted.forEach((c, index) => {
        results.push({
            entityId: c.entityId,
            benchmarkValue: c.value,
            averageValue: avg,
            difference: c.value - avg,
            status: c.value > avg ? 'above' : 'below',
            ranking: index + 1
        });
    });

    return results;
  }
}
