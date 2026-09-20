/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreliminaryFinancialAnalysisArtifact } from "./PreliminaryFinancialAnalysisContracts";
import { persistenceManager } from "../persistence/PersistenceManager";

export interface IPreliminaryFinancialAnalysisRepository {
  saveVersion(artifact: PreliminaryFinancialAnalysisArtifact): Promise<void>;
  findById(artifactId: string): Promise<PreliminaryFinancialAnalysisArtifact | null>;
  findLatestByDataSource(dataSourceId: string): Promise<PreliminaryFinancialAnalysisArtifact | null>;
  findLatestByEngagement(engagementId: string): Promise<PreliminaryFinancialAnalysisArtifact | null>;
  findHistoryByDataSource(dataSourceId: string): Promise<readonly PreliminaryFinancialAnalysisArtifact[]>;
  invalidate(artifactId: string, reason: string): Promise<void>;
}

export class LocalPreliminaryFinancialAnalysisRepository implements IPreliminaryFinancialAnalysisRepository {
  private readonly STORAGE_KEY_PREFIX = "asterion_prelim_analysis_";

  public async saveVersion(artifact: PreliminaryFinancialAnalysisArtifact): Promise<void> {
    if (!artifact || !artifact.artifactId) {
      throw new Error("Artefato de análise preliminar inválido para salvamento.");
    }
    
    // Save the specific versioned artifact
    const key = `${this.STORAGE_KEY_PREFIX}${artifact.artifactId}`;
    await persistenceManager.set(key, artifact);

    // Update history tracking list for this datasource
    const historyKey = `${this.STORAGE_KEY_PREFIX}history_${artifact.dataSourceId}`;
    const existingHistoryIds = await persistenceManager.get<string[]>(historyKey) || [];
    if (!existingHistoryIds.includes(artifact.artifactId)) {
      existingHistoryIds.push(artifact.artifactId);
      await persistenceManager.set(historyKey, existingHistoryIds);
    }

    // Update pointers for latest
    const latestDsKey = `${this.STORAGE_KEY_PREFIX}latest_ds_${artifact.dataSourceId}`;
    await persistenceManager.set(latestDsKey, artifact.artifactId);

    const latestEngKey = `${this.STORAGE_KEY_PREFIX}latest_eng_${artifact.engagementId}`;
    await persistenceManager.set(latestEngKey, artifact.artifactId);
  }

  public async findById(artifactId: string): Promise<PreliminaryFinancialAnalysisArtifact | null> {
    const key = `${this.STORAGE_KEY_PREFIX}${artifactId}`;
    return await persistenceManager.get<PreliminaryFinancialAnalysisArtifact>(key);
  }

  public async findLatestByDataSource(dataSourceId: string): Promise<PreliminaryFinancialAnalysisArtifact | null> {
    const latestDsKey = `${this.STORAGE_KEY_PREFIX}latest_ds_${dataSourceId}`;
    const id = await persistenceManager.get<string>(latestDsKey);
    if (!id) return null;
    return await this.findById(id);
  }

  public async findLatestByEngagement(engagementId: string): Promise<PreliminaryFinancialAnalysisArtifact | null> {
    const latestEngKey = `${this.STORAGE_KEY_PREFIX}latest_eng_${engagementId}`;
    const id = await persistenceManager.get<string>(latestEngKey);
    if (!id) return null;
    return await this.findById(id);
  }

  public async findHistoryByDataSource(dataSourceId: string): Promise<readonly PreliminaryFinancialAnalysisArtifact[]> {
    const historyKey = `${this.STORAGE_KEY_PREFIX}history_${dataSourceId}`;
    const ids = await persistenceManager.get<string[]>(historyKey) || [];
    const list: PreliminaryFinancialAnalysisArtifact[] = [];
    for (const id of ids) {
      const art = await this.findById(id);
      if (art) list.push(art);
    }
    // Return sorted newest first
    return list.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const artifact = await this.findById(artifactId);
    if (artifact) {
      const updated: PreliminaryFinancialAnalysisArtifact = {
        ...artifact,
        status: "INVALIDATED",
        limitations: [...artifact.limitations, { code: "ARTIFACT_INVALIDATED", message: `INVALIDATED: ${reason}`, severity: "CRITICAL" }]
      };
      await this.saveVersion(updated);
    }
  }
}

export class InMemoryPreliminaryFinancialAnalysisRepository implements IPreliminaryFinancialAnalysisRepository {
  private readonly items = new Map<string, PreliminaryFinancialAnalysisArtifact>();
  private readonly history = new Map<string, string[]>();

  public async saveVersion(artifact: PreliminaryFinancialAnalysisArtifact): Promise<void> {
    this.items.set(artifact.artifactId, JSON.parse(JSON.stringify(artifact)));
    const ids = this.history.get(artifact.dataSourceId) || [];
    if (!ids.includes(artifact.artifactId)) {
      ids.push(artifact.artifactId);
      this.history.set(artifact.dataSourceId, ids);
    }
  }

  public async findById(artifactId: string): Promise<PreliminaryFinancialAnalysisArtifact | null> {
    const item = this.items.get(artifactId);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async findLatestByDataSource(dataSourceId: string): Promise<PreliminaryFinancialAnalysisArtifact | null> {
    const matching = Array.from(this.items.values()).filter(a => a.dataSourceId === dataSourceId);
    if (matching.length === 0) return null;
    return matching.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
  }

  public async findLatestByEngagement(engagementId: string): Promise<PreliminaryFinancialAnalysisArtifact | null> {
    const matching = Array.from(this.items.values()).filter(a => a.engagementId === engagementId);
    if (matching.length === 0) return null;
    return matching.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
  }

  public async findHistoryByDataSource(dataSourceId: string): Promise<readonly PreliminaryFinancialAnalysisArtifact[]> {
    const ids = this.history.get(dataSourceId) || [];
    const list: PreliminaryFinancialAnalysisArtifact[] = [];
    for (const id of ids) {
      const art = this.items.get(id);
      if (art) list.push(JSON.parse(JSON.stringify(art)));
    }
    return list.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  public async invalidate(artifactId: string, reason: string): Promise<void> {
    const item = this.items.get(artifactId);
    if (item) {
      item.status = "INVALIDATED";
      item.limitations.push({ code: "ARTIFACT_INVALIDATED", message: `INVALIDATED: ${reason}`, severity: "CRITICAL" });
      this.items.set(artifactId, item);
    }
  }
}

export const preliminaryFinancialAnalysisRepository = new LocalPreliminaryFinancialAnalysisRepository();
