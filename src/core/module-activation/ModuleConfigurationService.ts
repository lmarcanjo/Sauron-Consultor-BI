import type { ModuleId, ModuleConfigurationRecord } from './ModuleActivationContracts';
import type { PreliminaryFinancialAnalysisArtifact } from '../preliminary-analysis/PreliminaryFinancialAnalysisContracts';
import { moduleConfigurationRepository, IModuleConfigurationRepository } from './ModuleConfigurationRepository';

export interface SaveModuleConfigurationInput {
  moduleId: ModuleId;
  engagementId: string;
  dataSourceId: string;
  schemaVersionNumber: number;
  selectedFields: readonly string[];
  selectedMetrics: readonly string[];
  selectedDimensions: readonly string[];
  selectedFilters?: Record<string, string>;
  createdBy: string;
  sourceFingerprint: string;
}

export interface ModuleConfigurationContext {
  moduleId: ModuleId;
  engagementId: string;
  dataSourceId: string;
  schemaVersionNumber: number;
  sourceFingerprint: string;
}

export function buildModuleConfigurationFingerprint(context: ModuleConfigurationContext): string {
  return [
    context.moduleId,
    context.engagementId,
    context.dataSourceId,
    String(context.schemaVersionNumber),
    context.sourceFingerprint,
  ].join('|');
}

export class ModuleConfigurationService {
  constructor(private readonly repository: IModuleConfigurationRepository = moduleConfigurationRepository) {}

  public async getValidConfiguration(
    context: ModuleConfigurationContext
  ): Promise<ModuleConfigurationRecord | null> {
    const current = await this.repository.findByModule(context.moduleId, context.engagementId);
    if (!current) return null;

    const fingerprint = buildModuleConfigurationFingerprint(context);
    const valid = current.status === 'ACTIVE'
      && current.dataSourceId === context.dataSourceId
      && current.schemaVersionNumber === context.schemaVersionNumber
      && current.fingerprint === fingerprint;

    if (!valid && current.status === 'ACTIVE') {
      await this.repository.invalidate(context.moduleId, context.engagementId, 'Fonte, schema ou Engajamento alterado.');
    }
    return valid ? current : null;
  }

  public async saveConfiguration(input: SaveModuleConfigurationInput): Promise<ModuleConfigurationRecord> {
    const now = new Date().toISOString();
    const existing = await this.repository.findByModule(input.moduleId, input.engagementId);
    const record: ModuleConfigurationRecord = {
      configurationId: existing?.configurationId || `module_config_${Date.now()}_${input.moduleId.toLowerCase()}`,
      moduleId: input.moduleId,
      engagementId: input.engagementId,
      dataSourceId: input.dataSourceId,
      schemaVersionNumber: input.schemaVersionNumber,
      selectedFields: [...new Set(input.selectedFields)],
      selectedMetrics: [...new Set(input.selectedMetrics)],
      selectedDimensions: [...new Set(input.selectedDimensions)],
      selectedFilters: { ...(input.selectedFilters || {}) },
      createdBy: existing?.createdBy || input.createdBy,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      fingerprint: buildModuleConfigurationFingerprint({
        moduleId: input.moduleId,
        engagementId: input.engagementId,
        dataSourceId: input.dataSourceId,
        schemaVersionNumber: input.schemaVersionNumber,
        sourceFingerprint: input.sourceFingerprint,
      }),
      status: 'ACTIVE',
    };
    await this.repository.save(record);
    return record;
  }

  public async invalidateForContextChange(moduleId: ModuleId, engagementId: string, reason: string): Promise<void> {
    await this.repository.invalidate(moduleId, engagementId, reason);
  }
}

export function moduleConfigurationContextFromArtifact(
  moduleId: ModuleId,
  artifact: PreliminaryFinancialAnalysisArtifact,
): ModuleConfigurationContext {
  const structuralFingerprint = JSON.stringify({
    containerId: artifact.containerId,
    columns: artifact.physicalFields.map(field => ({
      name: field.physicalName,
      index: field.physicalColumnIndex,
    })),
  });
  return {
    moduleId,
    engagementId: artifact.engagementId,
    dataSourceId: artifact.dataSourceId,
    schemaVersionNumber: artifact.schemaVersionNumber,
    sourceFingerprint: structuralFingerprint,
  };
}

export const moduleConfigurationService = new ModuleConfigurationService();
