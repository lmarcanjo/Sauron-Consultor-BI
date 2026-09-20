import { SemanticConfirmationArtifact } from './SemanticConfirmationContracts';
import { LocalSemanticConfirmationRepository } from './LocalSemanticConfirmationRepository';

export interface ISemanticConfirmationRepository {
  saveVersion(artifact: SemanticConfirmationArtifact): Promise<void>;
  findById(artifactId: string): Promise<SemanticConfirmationArtifact | null>;
  findLatestBySemanticArtifact(semanticArtifactId: string): Promise<SemanticConfirmationArtifact | null>;
  findLatestByDataSource(dataSourceId: string): Promise<SemanticConfirmationArtifact | null>;
  findHistoryByDataSource(dataSourceId: string): Promise<SemanticConfirmationArtifact[]>;
  findByEngagement(engagementId: string): Promise<SemanticConfirmationArtifact[]>;
  findBySchemaVersion(dataSourceId: string, schemaVersionNumber: number): Promise<SemanticConfirmationArtifact | null>;
}

export class InMemorySemanticConfirmationRepository implements ISemanticConfirmationRepository {
  private artifacts: SemanticConfirmationArtifact[] = [];

  public async saveVersion(artifact: SemanticConfirmationArtifact): Promise<void> {
    const existingIndex = this.artifacts.findIndex(a => a.artifactId === artifact.artifactId);
    if (existingIndex >= 0) {
      this.artifacts[existingIndex] = artifact;
    } else {
      this.artifacts.push(artifact);
    }
  }

  public async findById(artifactId: string): Promise<SemanticConfirmationArtifact | null> {
    return this.artifacts.find(a => a.artifactId === artifactId) || null;
  }

  public async findLatestBySemanticArtifact(semanticArtifactId: string): Promise<SemanticConfirmationArtifact | null> {
    const matches = this.artifacts.filter(a => a.semanticArtifactId === semanticArtifactId);
    if (matches.length === 0) return null;
    return matches.reduce((latest, current) => (current.version > latest.version ? current : latest), matches[0]);
  }

  public async findLatestByDataSource(dataSourceId: string): Promise<SemanticConfirmationArtifact | null> {
    const matches = this.artifacts.filter(a => a.dataSourceId === dataSourceId);
    if (matches.length === 0) return null;
    return matches.reduce((latest, current) => (current.version > latest.version ? current : latest), matches[0]);
  }

  public async findHistoryByDataSource(dataSourceId: string): Promise<SemanticConfirmationArtifact[]> {
    return this.artifacts.filter(a => a.dataSourceId === dataSourceId).sort((a, b) => b.version - a.version);
  }

  public async findByEngagement(engagementId: string): Promise<SemanticConfirmationArtifact[]> {
    return this.artifacts.filter(a => a.engagementId === engagementId);
  }

  public async findBySchemaVersion(dataSourceId: string, schemaVersionNumber: number): Promise<SemanticConfirmationArtifact | null> {
    const matches = this.artifacts.filter(a => a.dataSourceId === dataSourceId && a.schemaVersionNumber === schemaVersionNumber);
    if (matches.length === 0) return null;
    return matches.reduce((latest, current) => (current.version > latest.version ? current : latest), matches[0]);
  }

  public clear(): void {
    this.artifacts = [];
  }
}

export const semanticConfirmationRepository: ISemanticConfirmationRepository = new LocalSemanticConfirmationRepository();
