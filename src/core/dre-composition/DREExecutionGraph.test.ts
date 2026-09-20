import { describe, it, expect } from 'vitest';
import { DREExecutionGraphBuilder, DRETopologicalSorter } from './DREExecutionGraphBuilder';
import { DREExecutionGraphValidator } from './DREExecutionGraphValidator';
import { DREExecutionCoordinator } from './DREExecutionCoordinator';
import { DREExecutionInvalidationEngine } from './DREExecutionInvalidationEngine';
import { InMemoryDREExecutionCache } from './InMemoryDREExecutionCache';
import { DREExecutionGraphService } from './DREExecutionGraphService';
import { InMemoryDREExecutionGraphRepository, InMemoryDREExecutionTraceRepository } from './DREExecutionGraphRepository';

describe('Sprint 4.6 — DRE Execution Graph & Dependency Engine Unit Tests', () => {
  const dummyPolicy: any = { policyId: 'policy_v3', version: '3.0.0' };
  
  const dummyDREArtifact: any = {
    artifactId: 'dre_1',
    engagementId: 'eng_1',
    dataSourceIds: ['ds_1'],
    schemaVersionReferences: [1],
    policyId: 'policy_v3',
    policyVersion: '3.0.0',
    periods: [{ periodId: 'per_1', periodType: 'MONTH', startDate: '2026-01-01', endDate: '2026-01-31', label: 'Jan 2026' }],
    metadata: { currencyCode: 'BRL' },
    lines: [
      { lineId: 'l1', lineCode: 'REV_A', normalizedName: 'Receita A', statementGroup: 'GROSS_INFLOW', totalValue: 150000 },
      { lineId: 'l2', lineCode: 'DED_B', normalizedName: 'Dedução B', statementGroup: 'DEDUCTION', totalValue: -150000 },
      { lineId: 'l3', lineCode: 'COST_C', normalizedName: 'Custo C', statementGroup: 'DIRECT_COST', totalValue: -60000 }
    ],
    subtotals: [],
    limitations: []
  };

  const dummyTrust: any = { artifactId: 'trust_1', overallState: 'AUTHORIZED', usageAssessments: [{ usageType: 'FINANCIAL_ANALYSIS', status: 'AUTHORIZED' }] };
  const dummyClass: any = { artifactId: 'class_1', status: 'CONFIRMED', classificationDecisions: [], unresolvedClassifications: [], limitations: [] };

  it('1. Construção e Validação do Grafo Canônico V3', () => {
    const graph = DREExecutionGraphBuilder.build(dummyPolicy, dummyDREArtifact, dummyTrust, dummyClass);
    expect(graph.graphStatus).toBe('VALID');
    expect(graph.nodes.length).toBeGreaterThan(10);
    expect(graph.edges.length).toBeGreaterThan(10);

    const validation = DREExecutionGraphValidator.validate(graph, dummyPolicy);
    expect(validation.isValid).toBe(true);
  });

  it('2. Ordenação Topológica Determinística e Detecção de Ciclos', () => {
    const graph = DREExecutionGraphBuilder.build(dummyPolicy, dummyDREArtifact, dummyTrust, dummyClass);
    const order = DRETopologicalSorter.sort(graph.nodes, graph.edges);
    expect(order.length).toBe(graph.nodes.length);

    // Testar indução de ciclo
    const cyclicEdges = [
      ...graph.edges,
      {
        edgeId: 'cycle_edge',
        sourceNodeId: 'subtotal_net_inflow',
        targetNodeId: 'formula_total_gross_inflow',
        edgeType: 'SUBTOTAL_TO_FORMULA' as const,
        required: true,
        dependencyRole: 'CYCLE_INDUCTOR',
        periodId: 'per_1',
        currencyCode: 'BRL',
        provenance: { policyId: 'policy_v3', policyVersion: '3.0.0' },
        fingerprint: 'cycle'
      }
    ];

    expect(() => DRETopologicalSorter.sort(graph.nodes, cyclicEdges)).toThrow('EXECUTION_GRAPH_CYCLE_DETECTED');
  });

  it('3. Execução Governada via Coordinator', () => {
    const graph = DREExecutionGraphBuilder.build(dummyPolicy, dummyDREArtifact, dummyTrust, dummyClass);
    const trace = DREExecutionCoordinator.execute(graph, (f, inp) => 10, (n) => [10]);
    expect(trace.nodeExecutions.length).toBe(graph.nodes.length);
    expect(trace.blockedNodes.length).toBe(0);
  });

  it('4. Invalidação Seletiva por Ramo Afetado', () => {
    const adj = new Map<string, string[]>();
    adj.set('TOTAL_GROSS_INFLOW', ['NET_INFLOW']);
    adj.set('TOTAL_DEDUCTIONS', ['NET_INFLOW']);
    adj.set('NET_INFLOW', ['GROSS_RESULT']);
    adj.set('TOTAL_DIRECT_COST', ['GROSS_RESULT']);
    adj.set('GROSS_RESULT', []);

    // Se mudou DEDUCTION, deve invalidar NET_INFLOW e GROSS_RESULT, mas preservar TOTAL_GROSS_INFLOW e TOTAL_DIRECT_COST
    const res = DREExecutionInvalidationEngine.invalidate(['TOTAL_DEDUCTIONS'], adj, 'Alteração de Deduções');
    expect(res.directlyInvalidatedNodeIds).toContain('TOTAL_DEDUCTIONS');
    expect(res.transitivelyInvalidatedNodeIds).toContain('NET_INFLOW');
    expect(res.transitivelyInvalidatedNodeIds).toContain('GROSS_RESULT');
    expect(res.preservedNodeIds).toContain('TOTAL_GROSS_INFLOW');
  });

  it('5. Integração com Repositório e Serviço de Grafo', async () => {
    const graphRepo = new InMemoryDREExecutionGraphRepository();
    const traceRepo = new InMemoryDREExecutionTraceRepository();
    const service = new DREExecutionGraphService(graphRepo, traceRepo);

    const graph = await service.buildAndSaveGraph(dummyPolicy, dummyDREArtifact, dummyTrust, dummyClass);
    expect(graph.artifactId).toBeDefined();

    const trace = await service.executeGraph(graph);
    expect(trace.traceId).toBeDefined();

    const latestGraph = await graphRepo.findLatestByDREArtifact(dummyDREArtifact.artifactId);
    expect(latestGraph?.artifactId).toBe(graph.artifactId);
  });
});
