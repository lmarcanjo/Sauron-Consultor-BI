/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceContext, ContextEntity, ContextPeriod, ContextTab, ContextAction, ContextActivity, ContextRecommendation } from "./types";
import { workspaceContextManager, WorkspaceContextManager } from "./WorkspaceContextManager";
import { contextResolver, ContextResolver } from "./ContextResolver";
import { contextTabsEngine, ContextTabsEngine } from "./ContextTabsEngine";
import { contextActivityEngine, ContextActivityEngine } from "./ContextActivityEngine";
import { contextActionEngine, ContextActionEngine } from "./ContextActionEngine";
import { contextRecommendationEngine, ContextRecommendationEngine } from "./ContextRecommendationEngine";
import { identityEngine } from "../identity/IdentityEngine";
import { consultantWorkspaceManager } from "../../modules/consultant-workspace/ConsultantWorkspaceManager";
import { eventBus } from "../events/EventBus";
import { ActiveDataset } from "../../types/dataSource";
import { getBusinessDomainLabel } from "./BusinessDomainClassifier";
import { createWorkbookFingerprint } from "./WorkbookFingerprint";
import { importDecisionEngine } from "./ImportDecisionEngine";
import {
  BusinessDomain,
  ImportDecision,
  RegisterWorkbookDecisionInput,
  WorkbookFingerprint,
  Workspace,
  WorkspaceRegistryState,
} from "./WorkspaceIntelligenceTypes";
import { businessDomainEngine } from "../business-domains";
import { dispatchPlatformEvent, PLATFORM_EVENTS } from "../events/PlatformEvents";

export const WORKSPACE_REGISTRY_STORAGE_KEY = "sauron_workspace_registry";

let fallbackWorkspaceIdCounter = 0;

function now(): string {
  return new Date().toISOString();
}

function emptyWorkspaceRegistry(): WorkspaceRegistryState {
  return {
    workspaces: {},
    updatedAt: now(),
  };
}

const memoryWorkspaceRegistry: WorkspaceRegistryState = emptyWorkspaceRegistry();

function cloneRegistry(state: WorkspaceRegistryState): WorkspaceRegistryState {
  return JSON.parse(JSON.stringify(state));
}

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readWorkspaceRegistry(): WorkspaceRegistryState {
  if (!canUseLocalStorage()) return cloneRegistry(memoryWorkspaceRegistry);
  try {
    const raw = localStorage.getItem(WORKSPACE_REGISTRY_STORAGE_KEY);
    return raw ? { ...emptyWorkspaceRegistry(), ...JSON.parse(raw) } : emptyWorkspaceRegistry();
  } catch {
    return emptyWorkspaceRegistry();
  }
}

function replaceMemoryWorkspaceRegistry(state: WorkspaceRegistryState): void {
  const next = cloneRegistry(state);
  memoryWorkspaceRegistry.workspaces = next.workspaces;
  memoryWorkspaceRegistry.currentWorkspaceId = next.currentWorkspaceId;
  memoryWorkspaceRegistry.updatedAt = next.updatedAt;
}

function writeWorkspaceRegistry(state: WorkspaceRegistryState): void {
  const next = { ...state, updatedAt: now() };
  replaceMemoryWorkspaceRegistry(next);
  if (canUseLocalStorage()) {
    localStorage.setItem(WORKSPACE_REGISTRY_STORAGE_KEY, JSON.stringify(next));
  }
  dispatchPlatformEvent(PLATFORM_EVENTS.WORKSPACE_REGISTRY_CHANGED, next);
}

function mutateWorkspaceRegistry<T>(mutate: (state: WorkspaceRegistryState) => T): T {
  const state = readWorkspaceRegistry();
  const result = mutate(state);
  writeWorkspaceRegistry(state);
  return result;
}

function createWorkspaceId(): string {
  const unique = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${fallbackWorkspaceIdCounter++}`;
  return `workspace_${unique}`;
}

function defaultWorkspaceName(sourceName: string, domain: BusinessDomain): string {
  const cleanSource = sourceName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  const label = getBusinessDomainLabel(domain);
  return cleanSource ? `${label} - ${cleanSource}` : `Workspace ${label}`;
}

export class WorkspaceIntelligenceEngine {
  private static instance: WorkspaceIntelligenceEngine;

  public contextManager: WorkspaceContextManager = workspaceContextManager;
  public resolver: ContextResolver = contextResolver;
  public tabs: ContextTabsEngine = contextTabsEngine;
  public activities: ContextActivityEngine = contextActivityEngine;
  public actions: ContextActionEngine = contextActionEngine;
  public recommendations: ContextRecommendationEngine = contextRecommendationEngine;

  private constructor() {}

  public static getInstance(): WorkspaceIntelligenceEngine {
    if (!WorkspaceIntelligenceEngine.instance) {
      WorkspaceIntelligenceEngine.instance = new WorkspaceIntelligenceEngine();
    }
    return WorkspaceIntelligenceEngine.instance;
  }

  /**
   * Performs high-level bootstrapping to initialize the default context based on active IdentityEngine and project.
   */
  public async initializeDefaultContext(activeDataSource: string, activeFilters: any): Promise<WorkspaceContext> {
    const user = identityEngine.getCurrentUser();
    const org = identityEngine.getCurrentOrganization();
    const workspace = identityEngine.getCurrentWorkspace();
    const activeProject = await consultantWorkspaceManager.getActiveProject();

    const context = this.resolver.resolveContext(
      user,
      org,
      workspace,
      activeProject,
      { id: "junho_2026", name: "Junho/2026" },
      null, // No selected entity initially
      activeFilters,
      activeDataSource
    );

    this.contextManager.setContext(context);
    return context;
  }

  /**
   * Switch the selected context entity (e.g., Company, Seller, Presentation).
   */
  public switchEntity(entity: ContextEntity | null): void {
    const current = this.contextManager.getContext();
    if (!current) return;

    // Resolve a new context with the changed selected entity
    const updated = this.resolver.resolveContext(
      current.currentUser,
      current.currentOrganization,
      current.currentWorkspace,
      null, // Resolved internally
      current.currentPeriod,
      entity,
      current.filtrosAtivos,
      current.fonteDeDadosAtiva
    );

    // Maintain case if selected project is in manager
    if (current.currentCase) {
      updated.currentCase = current.currentCase;
    }

    this.contextManager.setContext(updated);

    // Notify platform EventBus
    eventBus.publish("WorkspaceChanged", {
      workspaceId: current.currentWorkspace?.id || "unknown",
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Switch the selected period.
   */
  public switchPeriod(period: ContextPeriod): void {
    this.contextManager.updateContext({ currentPeriod: period });
  }

  /**
   * Switch case project.
   */
  public switchCase(caseId: string, caseName: string): void {
    this.contextManager.updateContext({
      currentCase: { id: caseId, name: caseName }
    });
  }

  public clearIntelligentWorkspaceRegistry(): void {
    writeWorkspaceRegistry(emptyWorkspaceRegistry());
    if (canUseLocalStorage()) localStorage.removeItem(WORKSPACE_REGISTRY_STORAGE_KEY);
  }

  public getWorkspaceRegistry(): WorkspaceRegistryState {
    return readWorkspaceRegistry();
  }

  public listIntelligentWorkspaces(): Workspace[] {
    return Object.values(readWorkspaceRegistry().workspaces)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  public getCurrentIntelligentWorkspace(): Workspace | null {
    const registry = readWorkspaceRegistry();
    return registry.currentWorkspaceId ? registry.workspaces[registry.currentWorkspaceId] || null : null;
  }

  public selectIntelligentWorkspace(workspaceId: string): Workspace {
    return mutateWorkspaceRegistry(state => {
      const workspace = state.workspaces[workspaceId];
      if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);
      state.currentWorkspaceId = workspaceId;
      return workspace;
    });
  }

  public createIntelligentWorkspace(input: {
    name?: string;
    businessDomain: BusinessDomain;
    fingerprint?: WorkbookFingerprint;
    workbookId?: string;
    detectedDomain?: string;
    detectedSubDomain?: string | null;
    domainConfidence?: number;
    domainPackId?: string;
    enterpriseId?: string;
  }): Workspace {
    return mutateWorkspaceRegistry(state => {
      const timestamp = now();
      const workspace: Workspace = {
        id: createWorkspaceId(),
        name: input.name || defaultWorkspaceName(input.fingerprint?.sourceName || "Workbook", input.businessDomain),
        businessDomain: input.businessDomain,
        fingerprints: input.fingerprint ? [input.fingerprint] : [],
        workbookIds: input.workbookId ? [input.workbookId] : [],
        createdAt: timestamp,
        updatedAt: timestamp,
        lastMappingsByModule: {},
        acceptedSuggestions: [],
        ignoredSuggestions: [],
        detectedDomain: input.detectedDomain,
        detectedSubDomain: input.detectedSubDomain,
        domainConfidence: input.domainConfidence,
        domainPackId: input.domainPackId,
        enterpriseId: input.enterpriseId,
      };
      state.workspaces[workspace.id] = workspace;
      state.currentWorkspaceId = workspace.id;
      return workspace;
    });
  }

  public createWorkbookFingerprint(dataset: ActiveDataset, workbookId?: string): WorkbookFingerprint {
    return createWorkbookFingerprint({ dataset, workbookId });
  }

  public evaluateWorkbookImport(dataset: ActiveDataset, workbookId?: string): ImportDecision {
    const fingerprint = this.createWorkbookFingerprint(dataset, workbookId);
    const registry = readWorkspaceRegistry();
    const workspaces = Object.values(registry.workspaces);
    const currentWorkspace = registry.currentWorkspaceId ? registry.workspaces[registry.currentWorkspaceId] || null : null;
    return importDecisionEngine.buildDecision({
      fingerprint,
      currentWorkspace,
      workspaces,
    });
  }

  public attachWorkbookToWorkspace(
    workspaceId: string,
    workbookId: string,
    fingerprint: WorkbookFingerprint,
    detectedDomain?: string,
    detectedSubDomain?: string | null,
    domainConfidence?: number,
    domainPackId?: string
  ): Workspace {
    return mutateWorkspaceRegistry(state => {
      const current = state.workspaces[workspaceId];
      if (!current) throw new Error(`Workspace not found: ${workspaceId}`);
      const nextFingerprintList = [
        ...current.fingerprints.filter(item => item.workbookId !== fingerprint.workbookId),
        fingerprint,
      ];
      const nextWorkbookIds = Array.from(new Set([...current.workbookIds, workbookId]));
      const next: Workspace = {
        ...current,
        fingerprints: nextFingerprintList,
        workbookIds: nextWorkbookIds,
        updatedAt: now(),
        detectedDomain: detectedDomain || current.detectedDomain,
        detectedSubDomain: detectedSubDomain !== undefined ? detectedSubDomain : current.detectedSubDomain,
        domainConfidence: domainConfidence !== undefined ? domainConfidence : current.domainConfidence,
        domainPackId: domainPackId || current.domainPackId,
      };
      state.workspaces[workspaceId] = next;
      state.currentWorkspaceId = workspaceId;
      return next;
    });
  }

  public registerWorkbookDecision(input: RegisterWorkbookDecisionInput): Workspace | null {
    const fingerprint = this.createWorkbookFingerprint(input.dataset, input.workbookId);
    const decision = this.evaluateWorkbookImport(input.dataset, input.workbookId);
    const domain = decision.domain.domain;

    if (input.decisionAction === "open_temporarily") {
      return null;
    }

    const catalog = businessDomainEngine.adaptDatasetToCatalog(input.dataset);
    const detectedDomain = businessDomainEngine.detectDomain(catalog);
    const detectedSubDomain = businessDomainEngine.detectSubDomain(catalog);
    const domainConfidence = decision.domain.confidence;
    const domainPackId = detectedDomain;

    if (input.decisionAction === "create_new_workspace") {
      return this.createIntelligentWorkspace({
        name: input.workspaceName || defaultWorkspaceName(input.dataset.sourceName, domain),
        businessDomain: domain,
        fingerprint,
        workbookId: input.workbookId,
        detectedDomain,
        detectedSubDomain,
        domainConfidence,
        domainPackId,
        enterpriseId: input.enterpriseId,
      });
    }

    const targetWorkspaceId = input.workspaceId || decision.currentWorkspaceId;
    if (!targetWorkspaceId) {
      return this.createIntelligentWorkspace({
        name: input.workspaceName || defaultWorkspaceName(input.dataset.sourceName, domain),
        businessDomain: domain,
        fingerprint,
        workbookId: input.workbookId,
        detectedDomain,
        detectedSubDomain,
        domainConfidence,
        domainPackId,
        enterpriseId: input.enterpriseId,
      });
    }

    const updatedWorkspace = this.attachWorkbookToWorkspace(
      targetWorkspaceId,
      input.workbookId,
      fingerprint,
      detectedDomain,
      detectedSubDomain,
      domainConfidence,
      domainPackId
    );

    if (updatedWorkspace && input.enterpriseId) {
      return mutateWorkspaceRegistry(state => {
        const ws = state.workspaces[targetWorkspaceId];
        if (ws) {
          ws.enterpriseId = input.enterpriseId;
        }
        return ws;
      });
    }

    return updatedWorkspace;
  }

  public updateWorkspaceDomain(workspaceId: string, manualDomain: string): Workspace {
    const updated = mutateWorkspaceRegistry(state => {
      const current = state.workspaces[workspaceId];
      if (!current) throw new Error(`Workspace not found: ${workspaceId}`);
      const next: Workspace = {
        ...current,
        manualDomain,
        updatedAt: now(),
      };
      state.workspaces[workspaceId] = next;
      return next;
    });

    const currentContext = this.contextManager.getContext();
    if (currentContext && currentContext.currentWorkspace?.id === workspaceId) {
      this.contextManager.updateContext({
        currentWorkspace: {
          ...currentContext.currentWorkspace,
          manualDomain,
        } as any
      });
    }

    return updated;
  }
}

export const workspaceIntelligenceEngine = WorkspaceIntelligenceEngine.getInstance();
