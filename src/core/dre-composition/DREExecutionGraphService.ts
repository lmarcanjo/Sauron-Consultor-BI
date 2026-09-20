import { DREExecutionGraphArtifact, DREExecutionTraceArtifact } from './DREExecutionGraphContracts';
import { IDREExecutionGraphRepository, IDREExecutionTraceRepository } from './DREExecutionGraphRepository';
import { DREExecutionGraphBuilder } from './DREExecutionGraphBuilder';
import { DREExecutionGraphValidator } from './DREExecutionGraphValidator';
import { DREExecutionCoordinator } from './DREExecutionCoordinator';
import { DRECompositionPolicy, DREArtifact } from './DRECompositionContracts';
import { TrustArtifact } from '../trust/TrustContracts';
import { FinancialClassificationArtifact } from '../financial-classification/FinancialClassificationContracts';
import { DREReconciliationArtifact } from '../dre-reconciliation/DREReconciliationContracts';

export class DREExecutionGraphService {
  constructor(
    private readonly graphRepo: IDREExecutionGraphRepository,
    private readonly traceRepo: IDREExecutionTraceRepository
  ) {}

  public async buildAndSaveGraph(
    policy: DRECompositionPolicy,
    dreArtifact: DREArtifact,
    trustArtifact: TrustArtifact,
    classArtifact: FinancialClassificationArtifact,
    recArtifact?: DREReconciliationArtifact
  ): Promise<DREExecutionGraphArtifact> {
    const graph = DREExecutionGraphBuilder.build(policy, dreArtifact, trustArtifact, classArtifact, recArtifact);
    
    const validation = DREExecutionGraphValidator.validate(graph, policy);
    if (!validation.isValid) {
      throw new Error(`EXECUTION_GRAPH_VALIDATION_FAILED: ${validation.issues.join('; ')}`);
    }

    await this.graphRepo.saveVersion(graph);
    return graph;
  }

  public async executeGraph(
    graph: DREExecutionGraphArtifact
  ): Promise<DREExecutionTraceArtifact> {
    const trace = DREExecutionCoordinator.execute(
      graph,
      (formulaId, inputs) => inputs.reduce((a, b) => a + b, 0),
      (nodeId) => [10]
    );

    await this.traceRepo.save(trace);
    return trace;
  }
}
