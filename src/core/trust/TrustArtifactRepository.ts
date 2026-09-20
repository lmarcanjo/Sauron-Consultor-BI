import { TrustArtifact } from './TrustContracts';
import { PersistenceManager, LocalProvider, MemoryProvider, IPersistenceProvider } from '../persistence/PersistenceManager';

export interface ITrustArtifactRepository {
  saveVersion(artifact: TrustArtifact): Promise<void>;
  findById(artifactId: string): Promise<TrustArtifact | null>;
  findLatestByDataSource(dataSourceId: string): Promise<TrustArtifact | null>;
  findHistoryByDataSource(dataSourceId: string): Promise<TrustArtifact[]>;
  findByEngagement(engagementId: string): Promise<TrustArtifact[]>;
  findBySchemaVersion(dataSourceId: string, schemaVersionNumber: number): Promise<TrustArtifact | null>;
  invalidateForNewSchema(dataSourceId: string, newSchemaVersionNumber: number): Promise<void>;
  clear(): void;
}

export class LocalTrustArtifactRepository implements ITrustArtifactRepository {
  private readonly PREFIX = 'asterion_trust_v1_';
  private readonly persistenceManager: PersistenceManager;

  constructor(customProvider?: IPersistenceProvider) {
    this.persistenceManager = new PersistenceManager(customProvider || (typeof window === 'undefined' ? new MemoryProvider() : new LocalProvider()));
  }

  public async saveVersion(artifact: TrustArtifact): Promise<void> {
    const keyHistory = `${this.PREFIX}ds_${artifact.dataSourceId}`;
    const history = await this.findHistoryByDataSource(artifact.dataSourceId);

    const existingIndex = history.findIndex(a => a.artifactId === artifact.artifactId);
    if (existingIndex >= 0) {
      history[existingIndex] = artifact;
    } else {
      history.push(artifact);
    }

    history.sort((a, b) => b.version - a.version);
    await this.persistenceManager.set(keyHistory, history);

    const keyDirect = `${this.PREFIX}art_${artifact.artifactId}`;
    await this.persistenceManager.set(keyDirect, artifact);
  }

  public async findById(artifactId: string): Promise<TrustArtifact | null> {
    const keyDirect = `${this.PREFIX}art_${artifactId}`;
    return await this.persistenceManager.get<TrustArtifact>(keyDirect);
  }

  public async findLatestByDataSource(dataSourceId: string): Promise<TrustArtifact | null> {
    const history = await this.findHistoryByDataSource(dataSourceId);
    return history.length > 0 ? history[0] : null;
  }

  public async findHistoryByDataSource(dataSourceId: string): Promise<TrustArtifact[]> {
    const keyHistory = `${this.PREFIX}ds_${dataSourceId}`;
    const history = await this.persistenceManager.get<TrustArtifact[]>(keyHistory);
    return history || [];
  }

  public async findByEngagement(engagementId: string): Promise<TrustArtifact[]> {
    const allKeys = (await this.persistenceManager.keys()).filter(k => k.startsWith(`${this.PREFIX}ds_`));
    const results: TrustArtifact[] = [];

    for (const key of allKeys) {
      const history = await this.persistenceManager.get<TrustArtifact[]>(key);
      if (history) {
        const matches = history.filter(a => a.engagementId === engagementId);
        results.push(...matches);
      }
    }

    return results;
  }

  public async findBySchemaVersion(dataSourceId: string, schemaVersionNumber: number): Promise<TrustArtifact | null> {
    const history = await this.findHistoryByDataSource(dataSourceId);
    return history.find(a => a.schemaVersionNumber === schemaVersionNumber) || null;
  }

  public async invalidateForNewSchema(dataSourceId: string, newSchemaVersionNumber: number): Promise<void> {
    const history = await this.findHistoryByDataSource(dataSourceId);
    let modified = false;

    for (let i = 0; i < history.length; i++) {
      if (history[i].schemaVersionNumber < newSchemaVersionNumber && history[i].trustAssessment.overallState !== 'INVALIDATED') {
        const updated: TrustArtifact = {
          ...history[i],
          trustAssessment: {
            ...history[i].trustAssessment,
            overallState: 'INVALIDATED',
            primaryBlockingReason: `Avaliação invalidada devido ao registro do novo schema V${newSchemaVersionNumber}.`
          }
        };
        history[i] = updated;
        await this.persistenceManager.set(`${this.PREFIX}art_${updated.artifactId}`, updated);
        modified = true;
      }
    }

    if (modified) {
      await this.persistenceManager.set(`${this.PREFIX}ds_${dataSourceId}`, history);
    }
  }

  public clear(): void {
    this.persistenceManager.clear();
  }
}

export const trustArtifactRepository: ITrustArtifactRepository = new LocalTrustArtifactRepository();
