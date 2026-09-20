import { SemanticConfirmationArtifact } from './SemanticConfirmationContracts';
import { ISemanticConfirmationRepository } from './SemanticConfirmationRepository';
import { PersistenceManager } from '../../persistence/PersistenceManager';

export class LocalSemanticConfirmationRepository implements ISemanticConfirmationRepository {
  private readonly storageKeyPrefix = 'asterion_sem_conf_v1_';
  private persistenceManager: PersistenceManager;

  constructor(persistenceManager?: PersistenceManager) {
    this.persistenceManager = persistenceManager || new PersistenceManager();
  }

  private getKeyForDataSource(dataSourceId: string): string {
    return `${this.storageKeyPrefix}ds_${dataSourceId}`;
  }

  private getKeyForArtifact(artifactId: string): string {
    return `${this.storageKeyPrefix}art_${artifactId}`;
  }

  public async saveVersion(artifact: SemanticConfirmationArtifact): Promise<void> {
    if (!artifact || !artifact.artifactId || !artifact.dataSourceId) {
      throw new Error('[LocalSemanticConfirmationRepository] Artefato de confirmação inválido para salvamento.');
    }

    // Carrega histórico existente para a fonte
    const history = await this.findHistoryByDataSource(artifact.dataSourceId);
    
    // Atualiza ou insere a versão sem destruir o histórico
    const existingIndex = history.findIndex(a => a.artifactId === artifact.artifactId && a.version === artifact.version);
    let updatedHistory: SemanticConfirmationArtifact[];

    if (existingIndex >= 0) {
      updatedHistory = [...history];
      updatedHistory[existingIndex] = artifact;
    } else {
      // Se for uma nova versão do mesmo artefato principal, coloca a nova versão no topo
      const sameArtifactIndex = history.findIndex(a => a.artifactId === artifact.artifactId);
      if (sameArtifactIndex >= 0) {
        const filtered = history.filter(a => a.artifactId !== artifact.artifactId);
        updatedHistory = [artifact, ...filtered];
      } else {
        updatedHistory = [artifact, ...history];
      }
    }

    // Persiste histórico atualizado para o DataSource
    await this.persistenceManager.set(this.getKeyForDataSource(artifact.dataSourceId), updatedHistory);
    // Persiste ponteiro direto pelo artifactId
    await this.persistenceManager.set(this.getKeyForArtifact(artifact.artifactId), artifact);
    // Persiste ponteiro para o último por semanticArtifactId
    await this.persistenceManager.set(`${this.storageKeyPrefix}sem_${artifact.semanticArtifactId}`, artifact);
  }

  public async findById(artifactId: string): Promise<SemanticConfirmationArtifact | null> {
    if (!artifactId) return null;
    return await this.persistenceManager.get<SemanticConfirmationArtifact>(this.getKeyForArtifact(artifactId));
  }

  public async findLatestBySemanticArtifact(semanticArtifactId: string): Promise<SemanticConfirmationArtifact | null> {
    if (!semanticArtifactId) return null;
    const direct = await this.persistenceManager.get<SemanticConfirmationArtifact>(`${this.storageKeyPrefix}sem_${semanticArtifactId}`);
    if (direct) return direct;

    const keys = await this.persistenceManager.keys();
    const matches: SemanticConfirmationArtifact[] = [];

    for (const key of keys) {
      if (key.startsWith(this.storageKeyPrefix + 'ds_')) {
        const history = await this.persistenceManager.get<SemanticConfirmationArtifact[]>(key);
        if (history && Array.isArray(history)) {
          const matching = history.filter(a => a.semanticArtifactId === semanticArtifactId);
          matches.push(...matching);
        }
      }
    }

    if (matches.length === 0) return null;
    return matches.reduce((latest, current) => (current.version > latest.version ? current : latest), matches[0]);
  }

  public async findLatestByDataSource(dataSourceId: string): Promise<SemanticConfirmationArtifact | null> {
    const history = await this.findHistoryByDataSource(dataSourceId);
    if (history.length === 0) return null;
    return history.reduce((latest, current) => (current.version > latest.version ? current : latest), history[0]);
  }

  public async findHistoryByDataSource(dataSourceId: string): Promise<SemanticConfirmationArtifact[]> {
    if (!dataSourceId) return [];
    const history = await this.persistenceManager.get<SemanticConfirmationArtifact[]>(this.getKeyForDataSource(dataSourceId));
    if (!history || !Array.isArray(history)) return [];
    return [...history].sort((a, b) => b.version - a.version);
  }

  public async findByEngagement(engagementId: string): Promise<SemanticConfirmationArtifact[]> {
    if (!engagementId) return [];
    const keys = await this.persistenceManager.keys();
    const results: SemanticConfirmationArtifact[] = [];

    for (const key of keys) {
      if (key.startsWith(this.storageKeyPrefix + 'ds_')) {
        const history = await this.persistenceManager.get<SemanticConfirmationArtifact[]>(key);
        if (history && Array.isArray(history)) {
          results.push(...history.filter(a => a.engagementId === engagementId));
        }
      }
    }

    return results.sort((a, b) => b.version - a.version);
  }

  public async findBySchemaVersion(dataSourceId: string, schemaVersionNumber: number): Promise<SemanticConfirmationArtifact | null> {
    const history = await this.findHistoryByDataSource(dataSourceId);
    const matches = history.filter(a => a.schemaVersionNumber === schemaVersionNumber);
    if (matches.length === 0) return null;
    return matches.reduce((latest, current) => (current.version > latest.version ? current : latest), matches[0]);
  }

  public async clear(): Promise<void> {
    await this.persistenceManager.clear();
  }
}

export const localSemanticConfirmationRepository = new LocalSemanticConfirmationRepository();
