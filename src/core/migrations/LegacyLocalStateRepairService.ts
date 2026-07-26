import { runLegacyCompatibilityMigration } from "./LegacyCompatibilityMigration";
import { enterpriseRepository } from "../persistence/EnterpriseRepository";
import { identityEngine } from "../identity/IdentityEngine";
import { setEnterpriseContext } from "../enterprise-consolidation/EnterpriseContextStore";
import { spreadsheetStorageAdapter } from "../storage/IndexedSpreadsheetStorageAdapter";
import { workbookRepository as libraryWorkbookRepository } from "../workbook-library/WorkbookRepository";
import { activeDatasetStore } from "../data/ActiveDatasetStore";

export type LocalStateRepairStatus = "VALID" | "MIGRATABLE" | "ORPHAN" | "CONFLICT";

export interface LocalStateRepairItem {
  key: string;
  status: LocalStateRepairStatus;
  action: "preserved" | "migrated" | "removed" | "review";
  reason: string;
}

export interface LegacyLocalStateRepairReport {
  inspectedAt: string;
  schemaVersion: number;
  idempotent: boolean;
  items: LocalStateRepairItem[];
  repairedKeys: string[];
  unresolvedKeys: string[];
}

const CURRENT_DATASET_KEY = "sauron_ds_active_dataset";
const CURRENT_CONTEXT_KEY = "sauron_active_enterprise_context";
const STATE_SCHEMA_VERSION_KEY = "sauron_local_state_schema_version";
const STATE_SCHEMA_VERSION = 3;
const WORKSPACE_REGISTRY_KEY = "sauron_workspace_registry";
const LEGACY_KEYS = ["sauron_active_dataset", "active_dataset", "sauron_active_group_id", "sauron_active_company_id", "sauron_active_unit_id"];
const DATASOURCE_MANAGER_KEYS = [
  "sauron_ds_state",
  "sauron_ds_workspace",
  "sauron_ds_adjustments",
  "sauron_ds_filters",
  "sauron_ds_versions",
  "sauron_ds_db_data",
  "sauron_ds_import_profile",
];

function readJson(key: string): Record<string, any> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export class LegacyLocalStateRepairService {
  public async inspect(): Promise<LegacyLocalStateRepairReport> {
    const items: LocalStateRepairItem[] = [];
    if (typeof localStorage === "undefined") {
      return { inspectedAt: new Date().toISOString(), schemaVersion: STATE_SCHEMA_VERSION, idempotent: true, items, repairedKeys: [], unresolvedKeys: [] };
    }

    const schemaVersion = Number(localStorage.getItem(STATE_SCHEMA_VERSION_KEY) || 0);

    const currentDataset = readJson(CURRENT_DATASET_KEY);
    items.push({
      key: CURRENT_DATASET_KEY,
      status: currentDataset?.datasetId ? "VALID" : "ORPHAN",
      action: "preserved",
      reason: currentDataset?.datasetId ? "Fonte atual preservada." : "Não há fonte atual persistida.",
    });

    const context = readJson(CURRENT_CONTEXT_KEY);
    const enterprises = await enterpriseRepository.getAll();
    const entityIds = new Set(enterprises.map(entity => entity.id));
    for (const [field, value] of [["groupId", context?.groupId], ["companyId", context?.companyId], ["unitId", context?.unitId]] as const) {
      if (!value) continue;
      items.push({
        key: `${CURRENT_CONTEXT_KEY}.${field}`,
        status: entityIds.has(value) ? "VALID" : "ORPHAN",
        action: entityIds.has(value) ? "preserved" : "review",
        reason: entityIds.has(value) ? "Contexto encontrado no cadastro." : "A entidade não existe mais; é necessária uma escolha do consultor.",
      });
    }

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (key.startsWith("up_file_")) {
        items.push({ key, status: "MIGRATABLE", action: "removed", reason: "Referência temporária antiga; dados físicos não são removidos." });
      }
    }
    for (const key of LEGACY_KEYS) {
      if (localStorage.getItem(key) !== null) {
        items.push({ key, status: "MIGRATABLE", action: "migrated", reason: "Chave de compatibilidade preservada apenas durante a migração." });
      }
    }
    for (const key of DATASOURCE_MANAGER_KEYS) {
      if (localStorage.getItem(key) !== null) {
        items.push({ key, status: "MIGRATABLE", action: "removed", reason: "Estado duplicado do DataSourceManager será removido; metadata e linhas canônicas permanecem nos repositórios atuais." });
      }
    }

    const unresolvedKeys = items.filter(item => item.status === "ORPHAN" || item.status === "CONFLICT").map(item => item.key);
    return {
      inspectedAt: new Date().toISOString(),
      schemaVersion,
      idempotent: true,
      items,
      repairedKeys: items.filter(item => item.action === "migrated" || item.action === "removed").map(item => item.key),
      unresolvedKeys,
    };
  }

  public async repair(): Promise<LegacyLocalStateRepairReport> {
    const before = await this.inspect();
    const hasLegacyDataSourceState = before.items.some(item => DATASOURCE_MANAGER_KEYS.includes(item.key));
    if (before.schemaVersion >= STATE_SCHEMA_VERSION && !hasLegacyDataSourceState) return before;

    runLegacyCompatibilityMigration();

    const repairedKeys = new Set(before.repairedKeys);
    const addRepair = (key: string, reason: string) => {
      repairedKeys.add(key);
      if (typeof localStorage !== "undefined") {
        // The report is intentionally represented by the same inspectable
        // keys used by the browser. No workbook rows are touched here.
        localStorage.setItem(`${STATE_SCHEMA_VERSION_KEY}:${key}`, reason);
      }
    };

    if (typeof localStorage !== "undefined") {
      for (const key of DATASOURCE_MANAGER_KEYS) {
        if (localStorage.getItem(key) === null) continue;
        localStorage.removeItem(key);
        addRepair(key, "Estado duplicado removido após confirmação dos contratos canônicos; nenhum dado físico foi apagado.");
      }
      const activeDataset = readJson(CURRENT_DATASET_KEY);
      const context = readJson(CURRENT_CONTEXT_KEY);
      const entities = await enterpriseRepository.getAll();
      const groups = entities.filter(entity => entity.type === "Grupo");
      const companies = entities.filter(entity => entity.type === "Empresa");
      const units = entities.filter(entity => entity.type === "Unidade");

      const workspaceRegistry = readJson(WORKSPACE_REGISTRY_KEY);
      if (workspaceRegistry) {
        const rawWorkspaces = workspaceRegistry.workspaces;
        const entries = rawWorkspaces && typeof rawWorkspaces === "object" && !Array.isArray(rawWorkspaces)
          ? Object.entries(rawWorkspaces)
          : [];
        const normalizedWorkspaces = Object.fromEntries(entries.map(([id, value]) => {
          const workspace = value && typeof value === "object" ? value as Record<string, any> : {};
          return [id, {
            ...workspace,
            id: workspace.id || id,
            name: String(workspace.name || "Projeto"),
            businessDomain: workspace.businessDomain || "unknown",
            fingerprints: Array.isArray(workspace.fingerprints) ? workspace.fingerprints : [],
            workbookIds: Array.isArray(workspace.workbookIds) ? workspace.workbookIds : [],
            lastMappingsByModule: workspace.lastMappingsByModule && typeof workspace.lastMappingsByModule === "object" ? workspace.lastMappingsByModule : {},
            acceptedSuggestions: Array.isArray(workspace.acceptedSuggestions) ? workspace.acceptedSuggestions : [],
            ignoredSuggestions: Array.isArray(workspace.ignoredSuggestions) ? workspace.ignoredSuggestions : [],
            createdAt: String(workspace.createdAt || new Date(0).toISOString()),
            updatedAt: String(workspace.updatedAt || new Date(0).toISOString()),
          }];
        }));
        const currentWorkspaceId = workspaceRegistry.currentWorkspaceId && normalizedWorkspaces[workspaceRegistry.currentWorkspaceId]
          ? workspaceRegistry.currentWorkspaceId
          : undefined;
        const normalizedRegistry = { ...workspaceRegistry, workspaces: normalizedWorkspaces, currentWorkspaceId };
        if (JSON.stringify(normalizedRegistry) !== JSON.stringify(workspaceRegistry)) {
          localStorage.setItem(WORKSPACE_REGISTRY_KEY, JSON.stringify(normalizedRegistry));
          addRepair(WORKSPACE_REGISTRY_KEY, "Registro de projetos legado normalizado sem inventar projeto ou fingerprint.");
        }
      }
      let nextContext = context ? { ...context } : null;

      if (nextContext) {
        const company = companies.find(entity => entity.id === nextContext?.companyId) as any;
        const unit = units.find(entity => entity.id === nextContext?.unitId) as any;
        const parentCompany = unit?.parentId ? companies.find(entity => entity.id === unit.parentId) as any : company;
        const parentGroupId = parentCompany?.parentId || groups.find(entity => (entity as any).companyIds?.includes(parentCompany?.id))?.id;
        if (parentCompany?.id && nextContext.companyId !== parentCompany.id) {
          nextContext.companyId = parentCompany.id;
          addRepair(`${CURRENT_CONTEXT_KEY}.companyId`, "Empresa recuperada a partir da unidade.");
        }
        if (parentGroupId && nextContext.groupId !== parentGroupId) {
          nextContext.groupId = parentGroupId;
          addRepair(`${CURRENT_CONTEXT_KEY}.groupId`, "Grupo recuperado a partir do cadastro da empresa.");
        }

        const visibleWorkspaces = identityEngine.getVisibleWorkspaces();
        if (nextContext.workspaceId && !visibleWorkspaces.some(workspace => workspace.id === nextContext.workspaceId)) {
          if (visibleWorkspaces.length === 1) {
            nextContext.workspaceId = visibleWorkspaces[0].id;
            addRepair(`${CURRENT_CONTEXT_KEY}.workspaceId`, "Projeto legado substituído pelo único projeto disponível.");
          } else {
            delete nextContext.workspaceId;
            addRepair(`${CURRENT_CONTEXT_KEY}.workspaceId`, "Projeto legado removido para seleção explícita.");
          }
        }

        const canonicalWorkbookId = activeDataset?.sourceIdentity?.workbookId || activeDataset?.sourceWorkbookIds?.[0];
        const canonicalDatasetId = activeDataset?.datasetId;
        const normalizeIds = (values: unknown[], fallback: string | undefined) => Array.from(new Set(
          values.filter(value => typeof value === "string" && value && !value.startsWith("up_file_"))
            .concat(fallback ? [fallback] : [])
        ));
        const nextWorkbookIds = normalizeIds(nextContext.workbookIds || [], canonicalWorkbookId);
        const nextDatasetIds = normalizeIds(nextContext.datasetIds || [], canonicalDatasetId);
        if (JSON.stringify(nextContext.workbookIds || []) !== JSON.stringify(nextWorkbookIds)) {
          nextContext.workbookIds = nextWorkbookIds;
          addRepair(`${CURRENT_CONTEXT_KEY}.workbookIds`, "Referências temporárias removidas e identidade canônica preservada.");
        }
        if (JSON.stringify(nextContext.datasetIds || []) !== JSON.stringify(nextDatasetIds)) {
          nextContext.datasetIds = nextDatasetIds;
          addRepair(`${CURRENT_CONTEXT_KEY}.datasetIds`, "Referências temporárias removidas e dataset canônico preservado.");
        }

        if (nextContext.groupId && !groups.some(entity => entity.id === nextContext.groupId)) {
          delete nextContext.groupId;
          addRepair(`${CURRENT_CONTEXT_KEY}.groupId`, "Grupo órfão removido para escolha explícita.");
        }
        if (nextContext.companyId && !companies.some(entity => entity.id === nextContext.companyId)) {
          delete nextContext.companyId;
          addRepair(`${CURRENT_CONTEXT_KEY}.companyId`, "Empresa órfã removida para escolha explícita.");
        }
        if (nextContext.unitId && !units.some(entity => entity.id === nextContext.unitId)) {
          delete nextContext.unitId;
          addRepair(`${CURRENT_CONTEXT_KEY}.unitId`, "Unidade órfã removida para escolha explícita.");
        }

        localStorage.setItem(CURRENT_CONTEXT_KEY, JSON.stringify(nextContext));
        // EnterpriseContextStore was initialized before this repair service
        // runs. Update its in-memory value too, otherwise the next activation
        // could still submit an old up_file_* identity to IndexedDB.
        setEnterpriseContext(nextContext as any, { refreshSources: false, clearPreviousDataset: false });
      }

      const repairConfig = (key: string, raw: Record<string, any>) => {
        const areas = Array.isArray(raw.businessAreas) ? raw.businessAreas : [];
        const selectedFields = raw.selectedFields && typeof raw.selectedFields === "object" ? raw.selectedFields : {};
        const customMetrics = Array.isArray(raw.customMetrics) ? raw.customMetrics : [];
        const hasExplicitSelection = Object.values(selectedFields).some((field: any) => field?.visible && field?.use && field.use !== "do_not_use")
          || customMetrics.length > 0
          || areas.some((area: any) => String(area?.id || "").startsWith("custom_") || (area?.relatedFields || []).length > 0 || (area?.relatedMetrics || []).length > 0);
        if (hasExplicitSelection) return;
        const next = {
          ...raw,
          enabledModules: ["diagnostico"],
          businessAreas: [],
          selectedFields: {},
          customMetrics: [],
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(next));
        addRepair(key, "Módulos automáticos sem configuração foram removidos; dados escolhidos foram preservados.");
      };

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || (!key.startsWith("sauron_consulting_model_") && key !== "sauron_active_consulting_config")) continue;
        const raw = readJson(key);
        if (raw) repairConfig(key, raw);
      }

      const bindings = await enterpriseRepository.listSourceBindings();
      const candidateSourceIds = Array.from(new Set([
        ...(nextContext?.datasetIds || []),
        ...(nextContext?.workbookIds || []),
        activeDataset?.datasetId,
      ].filter((id): id is string => Boolean(id) && !id.startsWith("up_file_"))));
      for (const sourceId of candidateSourceIds) {
        // A headless runtime cannot inspect IndexedDB. Do not treat that
        // absence of a browser adapter as proof that canonical metadata is
        // orphaned; the browser path performs the physical check normally.
        let exists = typeof indexedDB === "undefined"
          ? true
          : Boolean(await spreadsheetStorageAdapter.getMetadata(sourceId).catch(() => null));
        if (!exists) {
          exists = libraryWorkbookRepository.listWorkbooks({ includeArchived: true, includeDeleted: true }).some(workbook => {
            const version = libraryWorkbookRepository.getCurrentVersion(workbook.id);
            return workbook.id === sourceId || version?.activeDataset?.datasetId === sourceId;
          });
        }
        if (exists) continue;

        const orphanBinding = await enterpriseRepository.getSourceBinding(sourceId);
        if (orphanBinding) {
          await enterpriseRepository.removeSourceBinding(sourceId);
          addRepair(`binding:${sourceId}`, "Vínculo órfão removido sem apagar a fonte física.");
        }
        if (nextContext) {
          const filteredWorkbookIds = (nextContext.workbookIds || []).filter(id => ![sourceId, orphanBinding?.workbookId, orphanBinding?.sourceId, orphanBinding?.datasetId].includes(id));
          const filteredDatasetIds = (nextContext.datasetIds || []).filter(id => ![sourceId, orphanBinding?.workbookId, orphanBinding?.sourceId, orphanBinding?.datasetId].includes(id));
          nextContext.workbookIds = filteredWorkbookIds;
          nextContext.datasetIds = filteredDatasetIds;
        }
        if (activeDataset?.datasetId === sourceId) {
          localStorage.removeItem(CURRENT_DATASET_KEY);
          activeDatasetStore.clearActiveDataset();
          addRepair(CURRENT_DATASET_KEY, "Metadata ativa órfã removida; nenhum dado físico foi excluído.");
        }
      }
      if (nextContext) {
        localStorage.setItem(CURRENT_CONTEXT_KEY, JSON.stringify(nextContext));
        setEnterpriseContext(nextContext as any, { refreshSources: false, clearPreviousDataset: false });
      }
      const sourceIds = new Set([
        ...(activeDataset?.sourceWorkbookIds || []),
        ...(activeDataset?.sourceDatasetIds || []),
        activeDataset?.sourceIdentity?.workbookId,
        activeDataset?.datasetId,
      ].filter(Boolean));
      if (sourceIds.size > 0 && !Array.from(sourceIds).some(sourceId => bindings.some(binding => [binding.sourceId, binding.workbookId, binding.datasetId].includes(sourceId)))) {
        addRepair("source.binding", "Fonte sem vínculo não foi atribuída automaticamente; requer escolha do consultor.");
      }
    }

    if (typeof localStorage !== "undefined") localStorage.setItem(STATE_SCHEMA_VERSION_KEY, String(STATE_SCHEMA_VERSION));
    const after = await this.inspect();
    return {
      ...after,
      repairedKeys: Array.from(repairedKeys),
    };
  }
}

export const legacyLocalStateRepairService = new LegacyLocalStateRepairService();
export const inspectLegacyLocalState = () => legacyLocalStateRepairService.inspect();
export const repairLegacyLocalState = () => legacyLocalStateRepairService.repair();
