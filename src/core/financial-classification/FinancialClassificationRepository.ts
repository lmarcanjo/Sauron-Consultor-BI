import { FinancialClassificationArtifact } from './FinancialClassificationContracts';

export interface IFinancialClassificationRepository {
  saveVersion(artifact: FinancialClassificationArtifact): Promise<void>;
  findById(artifactId: string): Promise<FinancialClassificationArtifact | null>;
  findLatestByDataSourceAndScope(dataSourceId: string, scopeId: string): Promise<FinancialClassificationArtifact | null>;
  findByEngagement(engagementId: string): Promise<readonly FinancialClassificationArtifact[]>;
  findBySemanticConfirmation(semanticConfirmationArtifactId: string): Promise<readonly FinancialClassificationArtifact[]>;
  findByTrustArtifact(trustArtifactId: string): Promise<readonly FinancialClassificationArtifact[]>;
  findHistory(dataSourceId: string, scopeId: string): Promise<readonly FinancialClassificationArtifact[]>;
  invalidate(artifactId: string, reason: string): Promise<void>;
  supersede(oldArtifactId: string, newArtifactId: string): Promise<void>;
  clearAll(): Promise<void>;
}

export class InMemoryFinancialClassificationRepository implements IFinancialClassificationRepository {
  private store: Record<string, FinancialClassificationArtifact> = {};

  public async saveVersion(artifact: FinancialClassificationArtifact): Promise<void> {
    this.store[artifact.artifactId] = artifact;
  }

  public async findById(artifactId: string): Promise<FinancialClassificationArtifact | null> {
    return this.store[artifactId] || null;
  }

  public async findLatestByDataSourceAndScope(dataSourceId: string, scopeId: string): Promise<FinancialClassificationArtifact | null> {
    const history = await this.findHistory(dataSourceId, scopeId);
    return history.length > 0 ? history[0] : null;
  }

  public async findByEngagement(engagementId: string): Promise<readonly FinancialClassificationArtifact[]> {
    return Object.values(this.store).filter(a => a.engagementId === engagementId);
  }

  public async findBySemanticConfirmation(semanticConfirmationArtifactId: string): Promise<readonly FinancialClassificationArtifact[]> {
    return Object.values(this.store).filter(a => a.semanticConfirmationArtifactId === semanticConfirmationArtifactId);
  }

  public async findByTrustArtifact(trustArtifactId: string): Promise<readonly FinancialClassificationArtifact[]> {
    return Object.values(this.store).filter(a => a.trustArtifactId === trustArtifactId);
  }

  public async findHistory(dataSourceId: string, scopeId: string): Promise<readonly FinancialClassificationArtifact[]> {
    return Object.values(this.store)
      .filter(a => a.dataSourceId === dataSourceId && a.scope.scopeId === scopeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const artifact = this.store[artifactId];
    if (artifact) {
      this.store[artifactId] = {
        ...artifact,
        status: 'INVALIDATED',
        invalidatedAt: new Date().toISOString(),
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

export class LocalFinancialClassificationRepository implements IFinancialClassificationRepository {
  private readonly STORAGE_KEY = 'asterion_financial_classification_artifacts_v1';

  private getStore(): Record<string, FinancialClassificationArtifact> {
    if (typeof localStorage === 'undefined') {
      throw new Error('[LocalFinancialClassificationRepository] localStorage não está disponível neste ambiente runtime.');
    }
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private setStore(store: Record<string, FinancialClassificationArtifact>): void {
    if (typeof localStorage === 'undefined') {
      throw new Error('[LocalFinancialClassificationRepository] localStorage não está disponível neste ambiente runtime.');
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
  }

  public async saveVersion(artifact: FinancialClassificationArtifact): Promise<void> {
    const store = this.getStore();
    store[artifact.artifactId] = artifact;
    this.setStore(store);
  }

  public async findById(artifactId: string): Promise<FinancialClassificationArtifact | null> {
    const store = this.getStore();
    return store[artifactId] || null;
  }

  public async findLatestByDataSourceAndScope(dataSourceId: string, scopeId: string): Promise<FinancialClassificationArtifact | null> {
    const history = await this.findHistory(dataSourceId, scopeId);
    if (history.length === 0) return null;
    return history[0];
  }

  public async findByEngagement(engagementId: string): Promise<readonly FinancialClassificationArtifact[]> {
    const store = this.getStore();
    return Object.values(store).filter(a => a.engagementId === engagementId);
  }

  public async findBySemanticConfirmation(semanticConfirmationArtifactId: string): Promise<readonly FinancialClassificationArtifact[]> {
    const store = this.getStore();
    return Object.values(store).filter(a => a.semanticConfirmationArtifactId === semanticConfirmationArtifactId);
  }

  public async findByTrustArtifact(trustArtifactId: string): Promise<readonly FinancialClassificationArtifact[]> {
    const store = this.getStore();
    return Object.values(store).filter(a => a.trustArtifactId === trustArtifactId);
  }

  public async findHistory(dataSourceId: string, scopeId: string): Promise<readonly FinancialClassificationArtifact[]> {
    const store = this.getStore();
    return Object.values(store)
      .filter(a => a.dataSourceId === dataSourceId && a.scope.scopeId === scopeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const store = this.getStore();
    const artifact = store[artifactId];
    if (artifact) {
      store[artifactId] = {
        ...artifact,
        status: 'INVALIDATED',
        invalidatedAt: new Date().toISOString(),
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

export const financialClassificationRepository = new LocalFinancialClassificationRepository();
