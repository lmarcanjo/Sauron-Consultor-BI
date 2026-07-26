import { ActiveDataset } from "../../types/dataSource";
import { activeDatasetStore } from "../data/ActiveDatasetStore";
import { EnterpriseContext } from "./EnterpriseContextTypes";
import { getEnterpriseContext, setEnterpriseContext, subscribeEnterpriseContext } from "./EnterpriseContextStore";
import { enterpriseRepository, BusinessGroup, Company, Unit } from "../persistence/EnterpriseRepository";
import { identityEngine } from "../identity/IdentityEngine";
import { isTemporarySourceId } from "../data/sourceIdentity";

export type ContextRepairAction = "none" | "select_group" | "bind_source" | "select_project" | "review_source";

export interface ContextInvariantResult {
  valid: boolean;
  issues: string[];
  repaired: string[];
  blocked: boolean;
  recommendedAction: ContextRepairAction;
  context: EnterpriseContext;
}

export interface ApplicationContextSnapshot {
  enterprise: EnterpriseContext;
  activeDataset: ActiveDataset | null;
  datasetId: string | null;
  sourceIds: string[];
  key: string;
}

/**
 * Read-only composition point for the context visible to application areas.
 * Stores remain the persistence boundary; components consume this snapshot
 * instead of composing a second context from unrelated local state.
 */
export class ApplicationContextResolver {
  public resolve(): ApplicationContextSnapshot {
    const enterprise = getEnterpriseContext();
    const activeDataset = activeDatasetStore.getActiveDataset();
    const sourceIds = Array.from(new Set([
      ...(enterprise.workbookIds || []),
      ...(enterprise.datasetIds || []),
      ...(activeDataset?.sourceWorkbookIds || []),
      ...(activeDataset?.sourceDatasetIds || []),
    ].filter(Boolean).filter(id => !isTemporarySourceId(id))));
    const scopeId = enterprise.scope === "GROUP"
      ? enterprise.groupId
      : enterprise.scope === "COMPANY"
        ? enterprise.companyId
        : enterprise.scope === "UNIT"
          ? enterprise.unitId
          : activeDataset?.datasetId;

    return {
      enterprise,
      activeDataset,
      datasetId: activeDataset?.datasetId || null,
      sourceIds,
      key: [enterprise.workspaceId || "workspace_default", enterprise.scope, scopeId || "none", activeDataset?.datasetId || "none"].join("::"),
    };
  }

  public subscribe(listener: (snapshot: ApplicationContextSnapshot) => void): () => void {
    const emit = () => listener(this.resolve());
    const unsubscribeContext = subscribeEnterpriseContext(emit);
    const unsubscribeDataset = activeDatasetStore.subscribe(emit);
    return () => {
      unsubscribeContext();
      unsubscribeDataset();
    };
  }

  /**
   * Validates persisted context without manufacturing ownership. Repairs only
   * relationships that are already provable from the enterprise repository.
   */
  public async validateAndRepair(input: EnterpriseContext = getEnterpriseContext()): Promise<ContextInvariantResult> {
    const enterprises = await enterpriseRepository.getAll();
    const groups = enterprises.filter(entity => entity.type === "Grupo") as BusinessGroup[];
    const companies = enterprises.filter(entity => entity.type === "Empresa") as Company[];
    const units = enterprises.filter(entity => entity.type === "Unidade") as Unit[];
    const issues: string[] = [];
    const repaired: string[] = [];
    const next: EnterpriseContext = { ...input };
    let recommendedAction: ContextRepairAction = "none";

    if (next.companyId) {
      const company = companies.find(item => item.id === next.companyId);
      if (!company) {
        issues.push("A empresa selecionada não existe mais.");
        recommendedAction = "select_group";
      } else if (!company.parentId || !groups.some(group => group.id === company.parentId)) {
        const parent = groups.find(group => group.companyIds?.includes(company.id));
        if (parent) {
          next.groupId = parent.id;
          repaired.push("Grupo da empresa recuperado pelo cadastro persistido.");
        } else {
          issues.push("A empresa não possui grupo pai válido.");
          recommendedAction = "select_group";
        }
      } else if (next.groupId !== company.parentId) {
        next.groupId = company.parentId;
        repaired.push("Grupo corrigido para o pai da empresa.");
      }
    }

    if (next.unitId) {
      const unit = units.find(item => item.id === next.unitId);
      const parent = unit?.parentId ? companies.find(item => item.id === unit.parentId) : undefined;
      if (!unit || !parent) {
        issues.push("A unidade selecionada não possui empresa válida.");
        recommendedAction = "select_group";
      } else {
        if (next.companyId !== parent.id) {
          next.companyId = parent.id;
          repaired.push("Empresa da unidade recuperada pelo cadastro persistido.");
        }
        if (next.groupId !== parent.parentId) {
          next.groupId = parent.parentId;
          repaired.push("Grupo da unidade recuperado pelo cadastro persistido.");
        }
      }
    }

    const visibleWorkspaces = identityEngine.getVisibleWorkspaces();
    if (next.workspaceId && !visibleWorkspaces.some(workspace => workspace.id === next.workspaceId)) {
      if (visibleWorkspaces.length === 1) {
        next.workspaceId = visibleWorkspaces[0].id;
        repaired.push("Projeto selecionado substituído por um projeto disponível.");
      } else {
        issues.push("O projeto selecionado não está disponível.");
        recommendedAction = "select_project";
      }
    } else if (!next.workspaceId && visibleWorkspaces.length === 1) {
      next.workspaceId = visibleWorkspaces[0].id;
      repaired.push("Projeto disponível associado ao contexto.");
    }

    const sourceIds = Array.from(new Set([
      ...(next.workbookIds || []),
      ...(next.datasetIds || []),
      ...(next.scope === "WORKBOOK" ? [activeDatasetStore.getActiveDataset()?.datasetId || ""] : []),
    ].filter(Boolean).filter(id => !isTemporarySourceId(id))));
    const safeWorkbookIds = (next.workbookIds || []).filter(id => !isTemporarySourceId(id));
    const safeDatasetIds = (next.datasetIds || []).filter(id => !isTemporarySourceId(id));
    if (safeWorkbookIds.length !== (next.workbookIds || []).length || safeDatasetIds.length !== (next.datasetIds || []).length) {
      next.workbookIds = safeWorkbookIds;
      next.datasetIds = safeDatasetIds;
      repaired.push("Referências temporárias de fonte removidas do contexto ativo.");
    }
    if (sourceIds.length > 0) {
      const bindings = await enterpriseRepository.listSourceBindings();
      const unbound = sourceIds.filter(sourceId => !bindings.some(binding => [binding.sourceId, binding.workbookId, binding.datasetId].includes(sourceId)));
      if (unbound.length > 0) {
        issues.push("Existe uma fonte ainda não vinculada a uma empresa, grupo ou unidade.");
        recommendedAction = recommendedAction === "none" ? "bind_source" : recommendedAction;
      }
    }

    const shouldPersist = repaired.length > 0 && JSON.stringify(next) !== JSON.stringify(input);
    if (shouldPersist) {
      setEnterpriseContext(next, { refreshSources: false, clearPreviousDataset: false });
    }

    return {
      valid: issues.length === 0,
      issues,
      repaired,
      blocked: issues.length > 0,
      recommendedAction,
      context: next,
    };
  }
}

export const applicationContextResolver = new ApplicationContextResolver();
