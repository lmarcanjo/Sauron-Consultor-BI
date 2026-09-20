import { EnterpriseRepository, Enterprise } from "../persistence/EnterpriseRepository";

export type LegacyMigrationStatusName = "CLEAN" | "LEGACY_DETECTED";

export interface LegacyMigrationStatus {
  status: LegacyMigrationStatusName;
  detectedCount: number;
  unresolvedIds: string[];
  storageKey: string;
  message: string;
}

/**
 * Detects unscoped records left by the pre-engagement registry. Detection is
 * intentionally separate from migration: no old organization is silently
 * attached to a consultant or engagement.
 */
export class LegacyEnterpriseMigrationService {
  constructor(private repository: EnterpriseRepository = new EnterpriseRepository()) {}

  async inspect(): Promise<LegacyMigrationStatus> {
    const entities = await this.repository.getAll();
    const legacy = entities.filter(entity => !entity.engagementId);
    return {
      status: legacy.length > 0 ? "LEGACY_DETECTED" : "CLEAN",
      detectedCount: legacy.length,
      unresolvedIds: legacy.map(entity => entity.id),
      storageKey: "sauron_enterprises",
      message: legacy.length > 0
        ? "Registros antigos detectados; associação explícita necessária."
        : "Todos os registros organizacionais possuem Engajamento.",
    };
  }

  async getUnresolvedRecords(): Promise<Enterprise[]> {
    const entities = await this.repository.getAll();
    return entities.filter(entity => !entity.engagementId);
  }
}
