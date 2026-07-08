/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiClient, apiClient } from "./ApiClient";
import { ApiResponse } from "../../../packages/shared-types";

/**
 * F5-VIII: HIGH-LEVEL BUSINESS API PROVIDER
 * 
 * Provides business-aligned remote endpoints to query narratives,
 * trigger calculation runs, and fetch audit events.
 */
export class ApiProvider {
  constructor(private client: ApiClient = apiClient) {}

  /**
   * Fetches approved executive stories for a given workspace.
   */
  public async getWorkspaceStories(workspaceId: string): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(`/cases/stories?workspaceId=${encodeURIComponent(workspaceId)}`);
  }

  /**
   * Triggers background compensation calculations.
   */
  public async triggerCompensationRun(periodId: string, roleIds: string[]): Promise<ApiResponse<{ jobId: string }>> {
    return this.client.post<{ jobId: string }>("/jobs/trigger", {
      name: "compensation.generate",
      payload: { periodId, targetRoleIds: roleIds },
    });
  }

  /**
   * Dispatches custom audit trails to the centralized server database.
   */
  public async logAuditEvent(action: string, details: string, level: string, metadata?: any): Promise<ApiResponse<void>> {
    return this.client.post<void>("/audit/log", {
      action,
      details,
      level,
      metadata,
    });
  }
}

export const apiProvider = new ApiProvider();
export default apiProvider;
