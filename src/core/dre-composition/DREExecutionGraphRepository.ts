import { DREExecutionGraphArtifact, DREExecutionTraceArtifact } from './DREExecutionGraphContracts';

export interface IDREExecutionGraphRepository {
  saveVersion(graph: DREExecutionGraphArtifact): Promise<void>;
  findById(artifactId: string): Promise<DREExecutionGraphArtifact | undefined>;
  findLatestByDREArtifact(dreArtifactId: string): Promise<DREExecutionGraphArtifact | undefined>;
  findHistory(dreArtifactId: string): Promise<readonly DREExecutionGraphArtifact[]>;
}

export interface IDREExecutionTraceRepository {
  save(trace: DREExecutionTraceArtifact): Promise<void>;
  findById(traceId: string): Promise<DREExecutionTraceArtifact | undefined>;
  findLatestByGraph(graphArtifactId: string): Promise<DREExecutionTraceArtifact | undefined>;
}

export class InMemoryDREExecutionGraphRepository implements IDREExecutionGraphRepository {
  private readonly graphs = new Map<string, DREExecutionGraphArtifact>();

  public async saveVersion(graph: DREExecutionGraphArtifact): Promise<void> {
    this.graphs.set(graph.artifactId, graph);
  }

  public async findById(artifactId: string): Promise<DREExecutionGraphArtifact | undefined> {
    return this.graphs.get(artifactId);
  }

  public async findLatestByDREArtifact(dreArtifactId: string): Promise<DREExecutionGraphArtifact | undefined> {
    return Array.from(this.graphs.values())
      .filter(g => g.dreArtifactId === dreArtifactId)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
  }

  public async findHistory(dreArtifactId: string): Promise<readonly DREExecutionGraphArtifact[]> {
    return Array.from(this.graphs.values())
      .filter(g => g.dreArtifactId === dreArtifactId)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }
}

export class InMemoryDREExecutionTraceRepository implements IDREExecutionTraceRepository {
  private readonly traces = new Map<string, DREExecutionTraceArtifact>();

  public async save(trace: DREExecutionTraceArtifact): Promise<void> {
    this.traces.set(trace.traceId, trace);
  }

  public async findById(traceId: string): Promise<DREExecutionTraceArtifact | undefined> {
    return this.traces.get(traceId);
  }

  public async findLatestByGraph(graphArtifactId: string): Promise<DREExecutionTraceArtifact | undefined> {
    return Array.from(this.traces.values())
      .filter(t => t.graphArtifactId === graphArtifactId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  }
}
