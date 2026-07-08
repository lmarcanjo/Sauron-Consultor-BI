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
}

export const workspaceIntelligenceEngine = WorkspaceIntelligenceEngine.getInstance();
