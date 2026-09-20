/**
 * Product projection and persistence service for MVP-3 deliverables.
 */

import type { ActiveDataset } from "../../types/dataSource";
import type { PlatformUser } from "../identity/types";
import type { ModuleActivationProjection, ModuleId } from "../module-activation/ModuleActivationContracts";
import { moduleActivationService } from "../module-activation/ModuleActivationService";
import { moduleConfigurationContextFromArtifact, moduleConfigurationService } from "../module-activation/ModuleConfigurationService";
import { preliminaryFinancialAnalysisService } from "../preliminary-analysis/PreliminaryFinancialAnalysisService";
import type { PreliminaryFinancialAnalysisArtifact } from "../preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import { consultantWorkspaceManager } from "../../modules/consultant-workspace/ConsultantWorkspaceManager";
import type { WorkspacePresentation } from "../../modules/consultant-workspace/types";
import type { ExecutivePresentation } from "../business-intelligence/ExecutivePresentationEngine";
import { executivePresentationComposer } from "./ExecutivePresentationComposer";
import type { AutomaticDeliverable, AutomaticDeliverablesProjection, ExecutiveDeliverablesInput, ComposedExecutivePresentation } from "./ExecutiveDeliverablesTypes";

const MODULE_DELIVERABLES: readonly [ModuleId, AutomaticDeliverable["type"]][] = [
  ["COMMERCIAL", "COMMERCIAL_DASHBOARD"],
  ["INVENTORY", "INVENTORY_DASHBOARD"],
  ["ITEMS", "ITEMS_DASHBOARD"],
  ["AFTER_SALES", "AFTER_SALES_DASHBOARD"],
];

export class ExecutiveDeliverablesService {
  public buildProjection(input: ExecutiveDeliverablesInput): AutomaticDeliverablesProjection {
    const artifact = input.artifact;
    const sourceArtifactIds = [artifact.artifactId];
    const baseUnavailable = artifact.status === "BLOCKED" || artifact.status === "INVALIDATED";
    const baseReason = artifact.status === "INVALIDATED"
      ? "A análise foi invalidada. Execute uma nova análise para gerar os materiais."
      : artifact.status === "BLOCKED"
        ? artifact.limitations[0]?.message || "A análise não possui dados suficientes."
        : undefined;

    const base = (type: AutomaticDeliverable["type"]): AutomaticDeliverable => ({
      deliverableId: `${type.toLowerCase()}_${artifact.artifactId}`,
      type,
      status: baseUnavailable ? "BLOCKED" : "AVAILABLE",
      reason: baseReason,
      sourceArtifactIds,
      generatedAt: artifact.generatedAt,
      version: artifact.artifactVersion,
      action: baseUnavailable ? "REANALYZE" : "OPEN",
    });

    const modules = new Map((input.moduleProjections || []).map(projection => [projection.moduleId, projection]));
    const moduleDeliverable = (moduleId: ModuleId, type: AutomaticDeliverable["type"]): AutomaticDeliverable => {
      if (baseUnavailable) return base(type);
      const projection = modules.get(moduleId);
      if (!projection) return { ...base(type), status: "NOT_AVAILABLE", reason: "Status do módulo ainda não foi projetado.", action: "NONE" };
      if (projection.status === "ACTIVE") return base(type);
      if (projection.status === "REQUIRES_CONFIGURATION") return { ...base(type), status: "REQUIRES_CONFIGURATION", reason: projection.missingRequirements.join(", ") || "O módulo aguarda confirmação.", action: "CONFIGURE" };
      if (projection.status === "BLOCKED" || projection.status === "ERROR") return { ...base(type), status: "BLOCKED", reason: projection.limitations[0] || "Módulo bloqueado.", action: "REANALYZE" };
      return { ...base(type), status: "NOT_AVAILABLE", reason: projection.limitations[0] || "Dados insuficientes para este módulo.", action: "NONE" };
    };

    return {
      projectionId: `deliverables_${artifact.artifactId}`,
      engagementId: artifact.engagementId,
      dataSourceId: artifact.dataSourceId,
      sourceFingerprint: artifact.sourceFingerprint,
      artifactFingerprint: artifact.fingerprint,
      artifactVersion: artifact.artifactVersion,
      generatedAt: new Date().toISOString(),
      deliverables: [
        base("EXECUTIVE_SUMMARY"),
        base("FINANCIAL_DASHBOARD"),
        base("DATA_QUALITY_REPORT"),
        base("SOURCE_INVENTORY"),
        ...MODULE_DELIVERABLES.map(([moduleId, type]) => moduleDeliverable(moduleId, type)),
        {
          ...base("EXECUTIVE_PRESENTATION"),
          action: baseUnavailable ? "REANALYZE" : "GENERATE",
        },
      ],
    };
  }

  public async resolveModuleProjections(artifact: PreliminaryFinancialAnalysisArtifact, currentUser: PlatformUser | null): Promise<ModuleActivationProjection[]> {
    const moduleIds: ModuleId[] = ["FINANCIAL", "COMMERCIAL", "INVENTORY", "ITEMS", "AFTER_SALES"];
    const configurations = await Promise.all(moduleIds.map(async moduleId => {
      const configuration = await moduleConfigurationService.getValidConfiguration(moduleConfigurationContextFromArtifact(moduleId, artifact));
      return [moduleId, configuration] as const;
    }));
    const byModule = new Map(configurations);
    return moduleIds.map(moduleId => moduleActivationService.resolveModuleById(moduleId, {
      engagementId: artifact.engagementId,
      dataSourceId: artifact.dataSourceId,
      preliminaryArtifact: artifact,
      currentUserId: currentUser?.id || artifact.generatedByUserId,
      currentUser,
      configuration: byModule.get(moduleId) || null,
    }));
  }

  public composePresentation(artifact: PreliminaryFinancialAnalysisArtifact, project: Parameters<typeof executivePresentationComposer.compose>[0]["project"], moduleProjections: readonly ModuleActivationProjection[] = []): ComposedExecutivePresentation {
    return executivePresentationComposer.compose({ artifact, project, moduleProjections });
  }

  public async savePresentation(composed: ComposedExecutivePresentation): Promise<void> {
    const project = await consultantWorkspaceManager.getActiveProject();
    if (!project || project.id !== composed.engagementId) throw new Error("Engajamento ativo não encontrado para salvar a apresentação.");
    const persisted: WorkspacePresentation = {
      id: composed.presentation.id,
      name: composed.presentation.title,
      slides: composed.presentation.slides,
      artifactId: composed.artifactId,
      artifactFingerprint: composed.artifactFingerprint,
      sourceFingerprint: composed.sourceFingerprint,
      engagementId: composed.engagementId,
      generatedAt: composed.generatedAt,
      version: composed.version,
      status: "CURRENT",
    };
    const existing = project.presentations || [];
    const withHistoryState = existing.map(item => item.engagementId === persisted.engagementId && item.id !== persisted.id
      ? { ...item, status: "OUTDATED" as const }
      : item);
    const next = withHistoryState.some(item => item.id === persisted.id)
      ? withHistoryState.map(item => item.id === persisted.id ? persisted : item)
      : [...withHistoryState, persisted];
    await consultantWorkspaceManager.updateProject({ ...project, presentations: next });
  }

  public async getPersistedPresentation(artifact: PreliminaryFinancialAnalysisArtifact, project: Awaited<ReturnType<typeof consultantWorkspaceManager.getActiveProject>>): Promise<ExecutivePresentation | null> {
    const persisted = project?.presentations?.find(item => item.artifactId === artifact.artifactId && item.artifactFingerprint === artifact.fingerprint);
    if (!persisted) return null;
    return {
      id: persisted.id,
      title: persisted.name,
      targetName: project?.client || artifact.clientId,
      targetType: artifact.organizationalScope.scopeType,
      slides: persisted.slides as ExecutivePresentation["slides"],
      status: "ready",
      artifactId: persisted.artifactId,
      artifactFingerprint: persisted.artifactFingerprint,
      sourceFingerprint: persisted.sourceFingerprint,
      engagementId: persisted.engagementId,
      generatedAt: persisted.generatedAt,
      version: persisted.version,
      origin: "MVP3_EXECUTIVE_DELIVERABLES",
    };
  }

  public async persistEditedPresentation(presentationId: string, slides: ExecutivePresentation["slides"], currentUser: PlatformUser | null): Promise<ExecutivePresentation> {
    const project = await consultantWorkspaceManager.getActiveProject();
    const persisted = project?.presentations?.find(item => item.id === presentationId);
    if (!project || !persisted || !persisted.artifactId) throw new Error("Apresentação não encontrada para este engajamento.");
    const artifact = await preliminaryFinancialAnalysisService.getArtifactById(persisted.artifactId, currentUser);
    if (!artifact || artifact.fingerprint !== persisted.artifactFingerprint) throw new Error("A análise da apresentação mudou. Gere uma nova versão.");
    const updated = { ...persisted, slides, status: "CURRENT" as const, generatedAt: new Date().toISOString() };
    await consultantWorkspaceManager.updateProject({ ...project, presentations: project.presentations.map(item => item.id === presentationId ? updated : item) });
    return { id: updated.id, title: updated.name, targetName: project.client, targetType: artifact.organizationalScope.scopeType, slides, status: "ready", artifactId: artifact.artifactId, artifactFingerprint: artifact.fingerprint, sourceFingerprint: artifact.sourceFingerprint, engagementId: artifact.engagementId, generatedAt: updated.generatedAt, version: updated.version, origin: "MVP3_EXECUTIVE_DELIVERABLES" };
  }

  public async ensurePresentation(artifact: PreliminaryFinancialAnalysisArtifact, currentUser: PlatformUser | null): Promise<ComposedExecutivePresentation> {
    const project = await consultantWorkspaceManager.getActiveProject();
    if (!project || project.id !== artifact.engagementId) throw new Error("Engajamento ativo não encontrado para gerar a apresentação.");
    const moduleProjections = await this.resolveModuleProjections(artifact, currentUser);
    const composed = this.composePresentation(artifact, project, moduleProjections);
    const existing = project.presentations?.find(item => item.id === composed.presentation.id);
    if (!existing || existing.artifactFingerprint !== composed.artifactFingerprint || existing.sourceFingerprint !== composed.sourceFingerprint) {
      await this.savePresentation(composed);
    }
    return composed;
  }

  public async loadActiveArtifact(activeDataset: ActiveDataset | null, currentUser: PlatformUser | null): Promise<{ artifact: PreliminaryFinancialAnalysisArtifact | null; project: Awaited<ReturnType<typeof consultantWorkspaceManager.getActiveProject>> }> {
    if (!activeDataset) return { artifact: null, project: null };
    const project = await consultantWorkspaceManager.getActiveProject();
    if (!project) return { artifact: null, project: null };
    const artifact = await preliminaryFinancialAnalysisService.getLatestForEngagement(project.id, currentUser);
    const sourceId = activeDataset.sourceIdentity?.sourceId || "";
    if (!artifact || (artifact.dataSourceId !== sourceId && artifact.workbookId !== activeDataset.datasetId)) return { artifact: null, project };
    return { artifact, project };
  }
}

export const executiveDeliverablesService = new ExecutiveDeliverablesService();
