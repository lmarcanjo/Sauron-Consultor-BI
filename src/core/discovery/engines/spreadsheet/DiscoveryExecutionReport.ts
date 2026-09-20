import { DiscoveryArtifact } from '../../sdk/DiscoveryContracts';

export interface DiscoveryExecutionReport {
  artifactId: string;
  executionDurationMs: number;
  containersFoundCount: number;
  columnsFoundCount: number;
  relationshipsDetectedCount: number;
  warningsCount: number;
  suggestionsCount: number;
  qualityScore: number;
  summary: string;
}

export class DiscoveryReportGenerator {
  public static generate(artifact: DiscoveryArtifact): DiscoveryExecutionReport {
    return {
      artifactId: artifact.artifactId,
      executionDurationMs: artifact.metadata.executionDurationMs,
      containersFoundCount: artifact.containers.length,
      columnsFoundCount: artifact.statistics.totalColumnsCount,
      relationshipsDetectedCount: artifact.relationships.length,
      warningsCount: artifact.warnings.length,
      suggestionsCount: artifact.suggestions.length,
      qualityScore: artifact.statistics.qualityScore,
      summary: `Descoberta concluída: ${artifact.containers.length} containers, ${artifact.statistics.totalColumnsCount} colunas e ${artifact.relationships.length} relacionamentos físicos identificados.`
    };
  }
}
