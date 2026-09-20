import { DREArtifact } from './DRECompositionContracts';

export interface IDREArtifactRepository {
  saveVersion(artifact: DREArtifact): Promise<void>;
  findById(artifactId: string): Promise<DREArtifact | null>;
  findLatestByEngagementAndScope(engagementId: string, scopeId: string): Promise<DREArtifact | null>;
  findByClassificationArtifact(financialClassificationArtifactId: string): Promise<readonly DREArtifact[]>;
  findByTrustArtifact(trustArtifactId: string): Promise<readonly DREArtifact[]>;
  findHistory(dataSourceId: string, scopeId: string): Promise<readonly DREArtifact[]>;
  invalidate(artifactId: string, reason: string): Promise<void>;
  supersede(oldArtifactId: string, newArtifactId: string): Promise<void>;
  clearAll(): Promise<void>;
}

export class InMemoryDREArtifactRepository implements IDREArtifactRepository {
  private store: Record<string, DREArtifact> = {};

  public async saveVersion(artifact: DREArtifact): Promise<void> {
    this.store[artifact.artifactId] = artifact;
  }

  public async findById(artifactId: string): Promise<DREArtifact | null> {
    return this.store[artifactId] || null;
  }

  public async findLatestByEngagementAndScope(engagementId: string, scopeId: string): Promise<DREArtifact | null> {
    const history = await this.findHistory(scopeId, scopeId);
    return history.length > 0 ? history[0] : null;
  }

  public async findByClassificationArtifact(financialClassificationArtifactId: string): Promise<readonly DREArtifact[]> {
    return Object.values(this.store).filter(a => a.financialClassificationArtifactIds.includes(financialClassificationArtifactId));
  }

  public async findByTrustArtifact(trustArtifactId: string): Promise<readonly DREArtifact[]> {
    return Object.values(this.store).filter(a => a.trustArtifactIds.includes(trustArtifactId));
  }

  public async findHistory(dataSourceId: string, scopeId: string): Promise<readonly DREArtifact[]> {
    return Object.values(this.store)
      .filter(a => a.dataSourceIds.includes(dataSourceId) && a.organizationalScope.scopeId === scopeId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const artifact = this.store[artifactId];
    if (artifact) {
      this.store[artifactId] = {
        ...artifact,
        status: 'INVALIDATED',
        invalidatedAt: new Date().toISOString(),
        invalidationReason: reason,
        limitations: [...artifact.limitations, `Invalidação: ${reason}`]
      };
    }
  }

  public async supersede(oldArtifactId: string, newArtifactId: string): Promise<void> {
    const oldArt = this.store[oldArtifactId];
    if (oldArt) {
      this.store[oldArtifactId] = {
        ...oldArt,
        status: 'SUPERSEDED'
      };
    }
  }

  public async clearAll(): Promise<void> {
    this.store = {};
  }
}

export class LocalDREArtifactRepository implements IDREArtifactRepository {
  private readonly STORAGE_KEY = 'asterion_dre_composition_artifacts_v1';

  private getStore(): Record<string, DREArtifact> {
    if (typeof localStorage === 'undefined') {
      throw new Error('[LocalDREArtifactRepository] localStorage não está disponível neste ambiente runtime.');
    }
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private setStore(store: Record<string, DREArtifact>): void {
    if (typeof localStorage === 'undefined') {
      throw new Error('[LocalDREArtifactRepository] localStorage não está disponível neste ambiente runtime.');
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
  }

  public async saveVersion(artifact: DREArtifact): Promise<void> {
    const store = this.getStore();
    store[artifact.artifactId] = artifact;
    this.setStore(store);
  }

  public async findById(artifactId: string): Promise<DREArtifact | null> {
    const store = this.getStore();
    return store[artifactId] || null;
  }

  public async findLatestByEngagementAndScope(engagementId: string, scopeId: string): Promise<DREArtifact | null> {
    const history = await this.findHistory(scopeId, scopeId);
    return history.length > 0 ? history[0] : null;
  }

  public async findByClassificationArtifact(financialClassificationArtifactId: string): Promise<readonly DREArtifact[]> {
    const store = this.getStore();
    return Object.values(store).filter(a => a.financialClassificationArtifactIds.includes(financialClassificationArtifactId));
  }

  public async findByTrustArtifact(trustArtifactId: string): Promise<readonly DREArtifact[]> {
    const store = this.getStore();
    return Object.values(store).filter(a => a.trustArtifactIds.includes(trustArtifactId));
  }

  public async findHistory(dataSourceId: string, scopeId: string): Promise<readonly DREArtifact[]> {
    const store = this.getStore();
    return Object.values(store)
      .filter(a => a.dataSourceIds.includes(dataSourceId) && a.organizationalScope.scopeId === scopeId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const store = this.getStore();
    const artifact = store[artifactId];
    if (artifact) {
      store[artifactId] = {
        ...artifact,
        status: 'INVALIDATED',
        invalidatedAt: new Date().toISOString(),
        invalidationReason: reason,
        limitations: [...artifact.limitations, `Invalidação: ${reason}`]
      };
      this.setStore(store);
    }
  }

  public async supersede(oldArtifactId: string, newArtifactId: string): Promise<void> {
    const store = this.getStore();
    const oldArt = store[oldArtifactId];
    if (oldArt) {
      store[oldArtifactId] = {
        ...oldArt,
        status: 'SUPERSEDED'
      };
      this.setStore(store);
    }
  }

  public async clearAll(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export const dreArtifactRepository = new LocalDREArtifactRepository();
