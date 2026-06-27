/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceContext } from "./types";

export type WorkspaceContextListener = (context: WorkspaceContext) => void;

export class WorkspaceContextManager {
  private static instance: WorkspaceContextManager;
  private currentContext: WorkspaceContext | null = null;
  private listeners: Set<WorkspaceContextListener> = new Set();

  private constructor() {}

  public static getInstance(): WorkspaceContextManager {
    if (!WorkspaceContextManager.instance) {
      WorkspaceContextManager.instance = new WorkspaceContextManager();
    }
    return WorkspaceContextManager.instance;
  }

  /**
   * Get the current active context.
   */
  public getContext(): WorkspaceContext | null {
    return this.currentContext;
  }

  /**
   * Set a completely new workspace context.
   */
  public setContext(context: WorkspaceContext): void {
    const changed = JSON.stringify(this.currentContext) !== JSON.stringify(context);
    this.currentContext = context;
    if (changed) {
      this.notifyListeners();
    }
  }

  /**
   * Partially update the current context.
   */
  public updateContext(partial: Partial<WorkspaceContext>): void {
    if (!this.currentContext) {
      console.warn("[WorkspaceContextManager] Attempted to update context before initialization.");
      return;
    }
    const updated = {
      ...this.currentContext,
      ...partial,
    };
    this.setContext(updated);
  }

  /**
   * Subscribe to workspace context updates.
   */
  public subscribe(listener: WorkspaceContextListener): () => void {
    this.listeners.add(listener);
    // Trigger immediate callback if context exists
    if (this.currentContext) {
      listener(this.currentContext);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    if (this.currentContext) {
      this.listeners.forEach((listener) => {
        try {
          listener(this.currentContext!);
        } catch (error) {
          console.error("[WorkspaceContextManager] Error in context listener:", error);
        }
      });
    }
  }
}

export const workspaceContextManager = WorkspaceContextManager.getInstance();
