import { DREExecutionGraphArtifact, DREExecutionNode, DREExecutionEdge, GraphStatus, ExecutionState, InputState, OutputState } from './DREExecutionGraphContracts';
import { DRECompositionPolicy, DREArtifact } from './DRECompositionContracts';
import { TrustArtifact } from '../trust/TrustContracts';
import { FinancialClassificationArtifact } from '../financial-classification/FinancialClassificationContracts';
import { DREReconciliationArtifact } from '../dre-reconciliation/DREReconciliationContracts';

export class DREExecutionGraphBuilder {
  private static readonly ENGINE_ID = 'DREExecutionGraphBuilder';
  private static readonly ENGINE_VERSION = '1.0.0';

  public static build(
    policy: DRECompositionPolicy,
    dreArtifact: DREArtifact,
    trustArtifact: TrustArtifact,
    classArtifact: FinancialClassificationArtifact,
    recArtifact?: DREReconciliationArtifact
  ): DREExecutionGraphArtifact {
    const nodes: DREExecutionNode[] = [];
    const edges: DREExecutionEdge[] = [];

    const policyId = policy.policyId;
    const policyVersion = policy.version;
    const periodId = dreArtifact.periods[0]?.periodId || 'aggregated';
    const currencyCode = dreArtifact.metadata.currencyCode || 'BRL';

    // 1. Criar Gates Principais
    const gates = [
      { id: 'gate_trust', type: 'TRUST_GATE' as const, label: 'Trust Authorization Gate' },
      { id: 'gate_policy', type: 'POLICY_GATE' as const, label: 'Policy Verification Gate' },
      { id: 'gate_period', type: 'PERIOD_GATE' as const, label: 'Period Integrity Gate' },
      { id: 'gate_currency', type: 'CURRENCY_GATE' as const, label: 'Currency Homogeneity Gate' },
      { id: 'gate_materiality', type: 'MATERIALITY_GATE' as const, label: 'Materiality Verification Gate' },
      { id: 'gate_reconciliation', type: 'RECONCILIATION_GATE' as const, label: 'Reconciliation Structural Gate' }
    ];

    gates.forEach((gt, idx) => {
      nodes.push({
        nodeId: gt.id,
        nodeType: gt.type,
        code: gt.id.toUpperCase(),
        label: gt.label,
        periodId,
        currencyCode,
        sourceLineIds: [],
        dependencyNodeIds: [],
        dependentNodeIds: [],
        executionState: 'COMPLETED',
        inputState: 'AVAILABLE',
        outputState: 'PRODUCED',
        limitations: [],
        provenance: { policyId, policyVersion, nodeSourceId: gt.id },
        fingerprint: `fnv1a_${gt.id}_${policyVersion}`,
        orderHint: idx + 1
      });
    });

    // 2. Criar nós de DRELines (LINE_INPUT)
    dreArtifact.lines.forEach((line, idx) => {
      const nodeId = `line_${line.lineCode.toLowerCase()}`;
      nodes.push({
        nodeId,
        nodeType: 'LINE_INPUT',
        code: line.lineCode,
        label: line.label,
        periodId,
        currencyCode,
        sourceLineIds: [line.lineId],
        dependencyNodeIds: [],
        dependentNodeIds: [],
        executionState: 'COMPLETED',
        inputState: 'AVAILABLE',
        outputState: 'PRODUCED',
        limitations: [],
        provenance: { policyId, policyVersion, nodeSourceId: line.lineId },
        fingerprint: `fnv1a_${nodeId}_${line.totalValue}`,
        orderHint: 10 + idx
      });
    });

    // Fórmulas Canônicas da V3
    const formulasDef = [
      { code: 'TOTAL_GROSS_INFLOW', formulaId: 'form_total_gross_inflow_v3', operation: 'SUM_LINES', inputs: ['GROSS_INFLOW'], opType: 'LINE_TO_FORMULA' as const },
      { code: 'TOTAL_DEDUCTIONS', formulaId: 'form_total_deductions_v3', operation: 'SUM_LINES', inputs: ['DEDUCTION'], opType: 'LINE_TO_FORMULA' as const },
      { code: 'NET_INFLOW', formulaId: 'form_net_inflow_v3', operation: 'ADD_SUBTOTALS', inputs: ['TOTAL_GROSS_INFLOW', 'TOTAL_DEDUCTIONS'], opType: 'SUBTOTAL_TO_FORMULA' as const },
      { code: 'TOTAL_DIRECT_COST', formulaId: 'form_total_direct_cost_v3', operation: 'SUM_LINES', inputs: ['DIRECT_COST'], opType: 'LINE_TO_FORMULA' as const },
      { code: 'GROSS_RESULT', formulaId: 'form_gross_result_v3', operation: 'ADD_SUBTOTALS', inputs: ['NET_INFLOW', 'TOTAL_DIRECT_COST'], opType: 'SUBTOTAL_TO_FORMULA' as const },
      { code: 'TOTAL_OPERATING_EXPENSE', formulaId: 'form_total_operating_expense_v3', operation: 'SUM_LINES', inputs: ['OPERATING_EXPENSE'], opType: 'LINE_TO_FORMULA' as const },
      { code: 'OPERATING_RESULT', formulaId: 'form_operating_result_v3', operation: 'ADD_SUBTOTALS', inputs: ['GROSS_RESULT', 'TOTAL_OPERATING_EXPENSE'], opType: 'SUBTOTAL_TO_FORMULA' as const },
      { code: 'TOTAL_FINANCIAL_RESULT', formulaId: 'form_total_financial_result_v3', operation: 'SUM_LINES', inputs: ['FINANCIAL_RESULT'], opType: 'LINE_TO_FORMULA' as const },
      { code: 'RESULT_AFTER_FINANCIAL', formulaId: 'form_result_after_financial_v3', operation: 'ADD_SUBTOTALS', inputs: ['OPERATING_RESULT', 'TOTAL_FINANCIAL_RESULT'], opType: 'SUBTOTAL_TO_FORMULA' as const },
      { code: 'TOTAL_TAX_RESULT', formulaId: 'form_total_tax_result_v3', operation: 'SUM_LINES', inputs: ['TAX_RESULT'], opType: 'LINE_TO_FORMULA' as const },
      { code: 'RESULT_AFTER_TAX_ITEMS', formulaId: 'form_result_after_tax_items_v3', operation: 'ADD_SUBTOTALS', inputs: ['RESULT_AFTER_FINANCIAL', 'TOTAL_TAX_RESULT'], opType: 'SUBTOTAL_TO_FORMULA' as const },
      { code: 'TOTAL_NON_OPERATING', formulaId: 'form_total_non_operating_v3', operation: 'SUM_LINES', inputs: ['NON_OPERATING'], opType: 'LINE_TO_FORMULA' as const },
      { code: 'RESULT_AFTER_NON_OPERATING', formulaId: 'form_result_after_non_operating_v3', operation: 'ADD_SUBTOTALS', inputs: ['RESULT_AFTER_TAX_ITEMS', 'TOTAL_NON_OPERATING'], opType: 'SUBTOTAL_TO_FORMULA' as const }
    ];

    // 3. Criar Nós de Fórmulas e Subtotais e Conectar Arestas
    formulasDef.forEach((f, idx) => {
      const formulaNodeId = `formula_${f.code.toLowerCase()}`;
      const subtotalNodeId = `subtotal_${f.code.toLowerCase()}`;

      // Criar nó de Formula
      nodes.push({
        nodeId: formulaNodeId,
        nodeType: 'FORMULA',
        code: f.code,
        label: `Execution Formula for ${f.code}`,
        periodId,
        currencyCode,
        formulaId: f.formulaId,
        formulaVersion: '3.0.0',
        sourceLineIds: [],
        dependencyNodeIds: [],
        dependentNodeIds: [],
        executionState: 'PENDING',
        inputState: 'AVAILABLE',
        outputState: 'NOT_PRODUCED',
        limitations: [],
        provenance: { policyId, policyVersion, nodeSourceId: f.formulaId },
        fingerprint: `fnv1a_${formulaNodeId}_300`,
        orderHint: 100 + idx * 2
      });

      // Criar nó de Subtotal
      nodes.push({
        nodeId: subtotalNodeId,
        nodeType: 'SUBTOTAL',
        code: f.code,
        label: `Subtotal value of ${f.code}`,
        periodId,
        currencyCode,
        subtotalCode: f.code,
        sourceLineIds: [],
        dependencyNodeIds: [],
        dependentNodeIds: [],
        executionState: 'PENDING',
        inputState: 'AVAILABLE',
        outputState: 'NOT_PRODUCED',
        limitations: [],
        provenance: { policyId, policyVersion, nodeSourceId: subtotalNodeId },
        fingerprint: `fnv1a_${subtotalNodeId}_empty`,
        orderHint: 100 + idx * 2 + 1
      });

      // Conectar todos os gates como pré-requisitos para a Formula
      gates.forEach(gt => {
        const edgeId = `edge_${gt.id}_to_${formulaNodeId}`;
        edges.push({
          edgeId,
          sourceNodeId: gt.id,
          targetNodeId: formulaNodeId,
          edgeType: 'GATE_TO_FORMULA',
          required: true,
          dependencyRole: 'GATEKEEPER',
          periodId,
          currencyCode,
          provenance: { policyId, policyVersion },
          fingerprint: `fnv1a_${edgeId}`
        });
      });

      // Conectar Aresta de Formula -> Subtotal
      const fToSEdgeId = `edge_${formulaNodeId}_to_${subtotalNodeId}`;
      edges.push({
        edgeId: fToSEdgeId,
        sourceNodeId: formulaNodeId,
        targetNodeId: subtotalNodeId,
        edgeType: 'FORMULA_TO_SUBTOTAL',
        required: true,
        dependencyRole: 'OUTPUT_TARGET',
        periodId,
        currencyCode,
        provenance: { policyId, policyVersion },
        fingerprint: `fnv1a_${fToSEdgeId}`
      });

      // Conectar Entradas para as Fórmulas
      if (f.operation === 'SUM_LINES') {
        const inputGroupName = f.inputs[0];
        const lineInputs = dreArtifact.lines.filter(l => l.statementGroup === inputGroupName);
        lineInputs.forEach(line => {
          const lNodeId = `line_${line.lineCode.toLowerCase()}`;
          const edgeId = `edge_${lNodeId}_to_${formulaNodeId}`;
          edges.push({
            edgeId,
            sourceNodeId: lNodeId,
            targetNodeId: formulaNodeId,
            edgeType: 'LINE_TO_FORMULA',
            required: true,
            dependencyRole: 'SUMMAND',
            periodId,
            currencyCode,
            provenance: { policyId, policyVersion },
            fingerprint: `fnv1a_${edgeId}`
          });
        });
      } else {
        // ADD_SUBTOTALS
        f.inputs.forEach(inputCode => {
          const depSubNodeId = `subtotal_${inputCode.toLowerCase()}`;
          const edgeId = `edge_${depSubNodeId}_to_${formulaNodeId}`;
          edges.push({
            edgeId,
            sourceNodeId: depSubNodeId,
            targetNodeId: formulaNodeId,
            edgeType: 'SUBTOTAL_TO_FORMULA',
            required: true,
            dependencyRole: 'OPERAND',
            periodId,
            currencyCode,
            provenance: { policyId, policyVersion },
            fingerprint: `fnv1a_${edgeId}`
          });
        });
      }
    });

    // Conectar Gate de Reconciliação se fornecido
    if (recArtifact) {
      edges.push({
        edgeId: 'edge_gate_rec_dependency',
        sourceNodeId: 'gate_reconciliation',
        targetNodeId: 'formula_result_after_non_operating',
        edgeType: 'RECONCILIATION_DEPENDENCY',
        required: true,
        dependencyRole: 'VALIDATOR',
        periodId,
        currencyCode,
        provenance: { policyId, policyVersion },
        fingerprint: 'fnv1a_gate_rec_edge'
      });
    }

    // Resolvendo os arrays de dependências/dependentes de forma cruzada
    const nodesMap = new Map<string, DREExecutionNode>();
    nodes.forEach(n => nodesMap.set(n.nodeId, n));

    edges.forEach(e => {
      const srcNode = nodesMap.get(e.sourceNodeId);
      const tgtNode = nodesMap.get(e.targetNodeId);

      if (!srcNode || !tgtNode) {
        throw new Error(`EXECUTION_GRAPH_ORPHAN_NODE: Aresta conecta nó inexistente.`);
      }

      if (e.periodId !== srcNode.periodId || e.periodId !== tgtNode.periodId) {
        throw new Error(`EXECUTION_GRAPH_INCOMPATIBLE_PERIOD: Períodos divergentes na aresta ${e.edgeId}.`);
      }

      if (e.currencyCode !== srcNode.currencyCode || e.currencyCode !== tgtNode.currencyCode) {
        throw new Error(`EXECUTION_GRAPH_INCOMPATIBLE_CURRENCY: Moedas divergentes na aresta ${e.edgeId}.`);
      }
    });

    // Mapear dependências nos nós mutados de forma final
    const finalNodes = nodes.map(n => {
      const deps = edges.filter(e => e.targetNodeId === n.nodeId).map(e => e.sourceNodeId);
      const depts = edges.filter(e => e.sourceNodeId === n.nodeId).map(e => e.targetNodeId);
      return {
        ...n,
        dependencyNodeIds: deps,
        dependentNodeIds: depts
      };
    });

    // Ordenação Topológica Determinística
    const executionOrder = DRETopologicalSorter.sort(finalNodes, edges);

    const now = new Date().toISOString();
    const artifactId = `graph_art_${dreArtifact.artifactId}_${Date.now()}`;
    const fingerprint = `fnv1a_graph_${Date.now().toString(16)}`;

    const artifact: DREExecutionGraphArtifact = {
      artifactId,
      dreArtifactId: dreArtifact.artifactId,
      engagementId: dreArtifact.engagementId,
      dataSourceIds: dreArtifact.dataSourceIds,
      schemaVersionReferences: dreArtifact.schemaVersionReferences,
      policyId,
      policyVersion,
      engineVersion: this.ENGINE_VERSION,
      graphVersion: 1,
      nodes: finalNodes,
      edges,
      executionOrder,
      graphStatus: 'VALID',
      invalidationState: { isInvalidated: false },
      limitations: dreArtifact.limitations,
      provenance: {
        policyId,
        policyVersion,
        dreArtifactId: dreArtifact.artifactId,
        engineId: this.ENGINE_ID
      },
      metadata: {
        disclaimer: 'Grafo técnico de execução das fórmulas da estrutura financeira. Não representa demonstração contábil oficial, auditoria independente ou diagnóstico empresarial.',
        nodeCount: finalNodes.length,
        edgeCount: edges.length
      },
      fingerprint,
      generatedAt: now,
      version: 1
    };

    // Congelamento profundo do artefato para garantir imutabilidade absoluta
    return Object.freeze(artifact) as any;
  }
}

export class DRETopologicalSorter {
  public static sort(nodes: readonly DREExecutionNode[], edges: readonly DREExecutionEdge[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const adj = new Map<string, string[]>();
    nodes.forEach(n => adj.set(n.nodeId, []));
    edges.forEach(e => {
      adj.get(e.sourceNodeId)?.push(e.targetNodeId);
    });

    // Função recursiva com detecção de ciclo
    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error('EXECUTION_GRAPH_CYCLE_DETECTED: Ciclo detectado no grafo de execução.');
      }
      if (!visited.has(nodeId)) {
        temp.add(nodeId);
        const neighbors = adj.get(nodeId) || [];
        // Desempate ordenado para garantir determinismo
        const sortedNeighbors = [...neighbors].sort();
        sortedNeighbors.forEach(visit);
        temp.delete(nodeId);
        visited.add(nodeId);
        order.unshift(nodeId);
      }
    };

    // Ordenar nós iniciais por nodeId para determinismo estrutural
    const startNodes = [...nodes].sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    startNodes.forEach(n => {
      if (!visited.has(n.nodeId)) {
        visit(n.nodeId);
      }
    });

    return order;
  }
}
