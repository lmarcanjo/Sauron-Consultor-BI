import { DREReconciliationArtifact, DREReconciliationError } from './DREReconciliationContracts';
import { persistenceManager } from '../persistence/PersistenceManager';

export interface IDREReconciliationArtifactRepository {
  saveVersion(artifact: DREReconciliationArtifact): Promise<void>;
  findById(artifactId: string): Promise<DREReconciliationArtifact | null>;
  findLatestByDREArtifact(dreArtifactId: string): Promise<DREReconciliationArtifact | null>;
  findLatestByEngagementAndScope(engagementId: string, scopeId: string): Promise<DREReconciliationArtifact | null>;
  findByTrustArtifact(trustArtifactId: string): Promise<readonly DREReconciliationArtifact[]>;
  findHistory(engagementId: string, scopeId: string): Promise<readonly DREReconciliationArtifact[]>;
  invalidate(artifactId: string, reason: string): Promise<void>;
}

export class LocalDREReconciliationArtifactRepository implements IDREReconciliationArtifactRepository {
  private readonly STORAGE_KEY_PREFIX = 'asterion_dre_rec_';

  public async saveVersion(artifact: DREReconciliationArtifact): Promise<void> {
    if (!artifact || !artifact.artifactId) {
      throw new DREReconciliationError('INVALID_ARTIFACT', 'Artefato de reconciliação inválido para salvamento.');
    }
    const key = `${this.STORAGE_KEY_PREFIX}${artifact.artifactId}`;
    await persistenceManager.set(key, artifact);

    // Atualizar ponteiro de latest por engagement e scope
    const latestKey = `${this.STORAGE_KEY_PREFIX}latest_${artifact.engagementId}_${artifact.dataSourceIds[0]}`;
    await persistenceManager.set(latestKey, artifact.artifactId);

    // Atualizar ponteiro por DREArtifact
    const dreKey = `${this.STORAGE_KEY_PREFIX}dre_${artifact.dreArtifactId}`;
    await persistenceManager.set(dreKey, artifact.artifactId);
  }

  public async findById(artifactId: string): Promise<DREReconciliationArtifact | null> {
    const key = `${this.STORAGE_KEY_PREFIX}${artifactId}`;
    return persistenceManager.get<DREReconciliationArtifact>(key);
  }

  public async findLatestByDREArtifact(dreArtifactId: string): Promise<DREReconciliationArtifact | null> {
    const dreKey = `${this.STORAGE_KEY_PREFIX}dre_${dreArtifactId}`;
    const id = await persistenceManager.get<string>(dreKey);
    if (!id) return null;
    return this.findById(id);
  }

  public async findLatestByEngagementAndScope(engagementId: string, scopeId: string): Promise<DREReconciliationArtifact | null> {
    const latestKey = `${this.STORAGE_KEY_PREFIX}latest_${engagementId}_${scopeId}`;
    const id = await persistenceManager.get<string>(latestKey);
    if (!id) return null;
    return this.findById(id);
  }

  public async findByTrustArtifact(trustArtifactId: string): Promise<readonly DREReconciliationArtifact[]> {
    const history = await this.findHistory(trustArtifactId, trustArtifactId);
    return history.filter(item => item.trustArtifactId === trustArtifactId);
  }

  public async findHistory(engagementId: string, scopeId: string): Promise<readonly DREReconciliationArtifact[]> {
    const latest = await this.findLatestByEngagementAndScope(engagementId, scopeId);
    return latest ? [latest] : [];
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const artifact = await this.findById(artifactId);
    if (artifact) {
      const updated: DREReconciliationArtifact = {
        ...artifact,
        reconciliationStatus: 'INVALIDATED',
        limitations: [...artifact.limitations, `INVALIDATED: ${reason}`]
      };
      await this.saveVersion(updated);
    }
  }
}

export class InMemoryDREReconciliationArtifactRepository implements IDREReconciliationArtifactRepository {
  private readonly items = new Map<string, DREReconciliationArtifact>();

  public async saveVersion(artifact: DREReconciliationArtifact): Promise<void> {
    this.items.set(artifact.artifactId, artifact);
  }

  public async findById(artifactId: string): Promise<DREReconciliationArtifact | null> {
    return this.items.get(artifactId) || null;
  }

  public async findLatestByDREArtifact(dreArtifactId: string): Promise<DREReconciliationArtifact | null> {
    const matching = Array.from(this.items.values()).filter(a => a.dreArtifactId === dreArtifactId);
    if (matching.length === 0) return null;
    return matching.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
  }

  public async findLatestByEngagementAndScope(engagementId: string, scopeId: string): Promise<DREReconciliationArtifact | null> {
    const matching = Array.from(this.items.values()).filter(a => a.engagementId === engagementId && a.dataSourceIds.includes(scopeId));
    if (matching.length === 0) return null;
    return matching.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
  }

  public async findByTrustArtifact(trustArtifactId: string): Promise<readonly DREReconciliationArtifact[]> {
    return Array.from(this.items.values()).filter(a => a.trustArtifactId === trustArtifactId);
  }

  public async findHistory(engagementId: string, scopeId: string): Promise<readonly DREReconciliationArtifact[]> {
    return Array.from(this.items.values())
      .filter(a => a.engagementId === engagementId && a.dataSourceIds.includes(scopeId))
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const item = this.items.get(artifactId);
    if (item) {
      this.items.set(artifactId, {
        ...item,
        reconciliationStatus: 'INVALIDATED',
        limitations: [...item.limitations, `INVALIDATED: ${reason}`]
      });
    }
  }
}

export const dreReconciliationArtifactRepository = new LocalDREReconciliationArtifactRepository();
