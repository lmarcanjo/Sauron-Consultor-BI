import { BusinessArtifact } from '../business-insight/BusinessArtifactContracts';
import { PersistenceManager, persistenceManager } from '../persistence/PersistenceManager';

export interface IBusinessArtifactRepository {
  saveVersion(artifact: BusinessArtifact): Promise<void>;
  findById(artifactId: string): Promise<BusinessArtifact | null>;
  findLatestByEngineAndScope(engineId: string, scopeId: string): Promise<BusinessArtifact | null>;
  findByEngagement(engagementId: string): Promise<readonly BusinessArtifact[]>;
  findByTrustArtifact(trustArtifactId: string): Promise<readonly BusinessArtifact[]>;
  findHistory(engineId: string, scopeId: string): Promise<readonly BusinessArtifact[]>;
  invalidate(artifactId: string, reason: string): Promise<void>;
}

export class LocalBusinessArtifactRepository implements IBusinessArtifactRepository {
  private readonly persistence: PersistenceManager;
  private readonly storagePrefix = 'asterion_business_v1_';
  private readonly indexKey = 'asterion_business_v1_all_artifacts_index';
  private readonly invalidationKey = 'asterion_business_v1_invalidations';

  constructor(persistence?: PersistenceManager) {
    this.persistence = persistence || persistenceManager;
  }

  public async saveVersion(artifact: BusinessArtifact): Promise<void> {
    const key = `${this.storagePrefix}${artifact.engineId}_${artifact.analysisScope.scopeId}_history`;
    const existingHistory = (await this.persistence.get<BusinessArtifact[]>(key)) || [];
    
    // Adiciona nova versão sem sobrescrever anteriores
    const updatedHistory = [...existingHistory, artifact];
    await this.persistence.set(key, updatedHistory);

    // Atualiza ponteiro da versão mais recente
    const latestKey = `${this.storagePrefix}${artifact.engineId}_${artifact.analysisScope.scopeId}_latest`;
    await this.persistence.set(latestKey, artifact);

    // Armazena por id individual
    const byIdKey = `${this.storagePrefix}id_${artifact.artifactId}`;
    await this.persistence.set(byIdKey, artifact);

    // Atualiza o índice global de artifacts
    const allIds = (await this.persistence.get<string[]>(this.indexKey)) || [];
    if (!allIds.includes(artifact.artifactId)) {
      await this.persistence.set(this.indexKey, [...allIds, artifact.artifactId]);
    }
  }

  public async findById(artifactId: string): Promise<BusinessArtifact | null> {
    const byIdKey = `${this.storagePrefix}id_${artifactId}`;
    const artifact = await this.persistence.get<BusinessArtifact>(byIdKey);
    if (artifact) return artifact;

    // Fallback: varre todas as chaves salvas no repositório
    const allIds = (await this.persistence.get<string[]>(this.indexKey)) || [];
    for (const id of allIds) {
      const art = await this.persistence.get<BusinessArtifact>(`${this.storagePrefix}id_${id}`);
      if (art && art.artifactId === artifactId) {
        return art;
      }
    }
    return null;
  }

  public async findLatestByEngineAndScope(engineId: string, scopeId: string): Promise<BusinessArtifact | null> {
    const latestKey = `${this.storagePrefix}${engineId}_${scopeId}_latest`;
    return (await this.persistence.get<BusinessArtifact>(latestKey)) || null;
  }

  public async findByEngagement(engagementId: string): Promise<readonly BusinessArtifact[]> {
    const allIds = (await this.persistence.get<string[]>(this.indexKey)) || [];
    const results: BusinessArtifact[] = [];

    for (const id of allIds) {
      const art = await this.persistence.get<BusinessArtifact>(`${this.storagePrefix}id_${id}`);
      if (art && art.engagementId === engagementId) {
        results.push(art);
      }
    }

    return Object.freeze(results);
  }

  public async findByTrustArtifact(trustArtifactId: string): Promise<readonly BusinessArtifact[]> {
    const allIds = (await this.persistence.get<string[]>(this.indexKey)) || [];
    const results: BusinessArtifact[] = [];

    for (const id of allIds) {
      const art = await this.persistence.get<BusinessArtifact>(`${this.storagePrefix}id_${id}`);
      if (art && art.trustArtifactIds && art.trustArtifactIds.includes(trustArtifactId)) {
        results.push(art);
      }
    }

    return Object.freeze(results);
  }

  public async findHistory(engineId: string, scopeId: string): Promise<readonly BusinessArtifact[]> {
    const key = `${this.storagePrefix}${engineId}_${scopeId}_history`;
    return (await this.persistence.get<BusinessArtifact[]>(key)) || [];
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const invalidations = (await this.persistence.get<Record<string, { invalidatedAt: string; reason: string }>>(this.invalidationKey)) || {};
    invalidations[artifactId] = {
      invalidatedAt: new Date().toISOString(),
      reason
    };
    await this.persistence.set(this.invalidationKey, invalidations);
  }
}

export const businessArtifactRepository = new LocalBusinessArtifactRepository();

