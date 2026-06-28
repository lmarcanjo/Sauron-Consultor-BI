/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse, ErrorResponse } from "../../../packages/shared-types";

/**
 * F5-VIII: API CLIENT FOR CLIENT-SIDE CORE
 * 
 * Handles base fetch operations, correlation tracking, tenant context injection,
 * and error/response structural validation.
 */
export class ApiClient {
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor(private baseUrl: string = "/api/v1") {}

  public setToken(token: string | null): void {
    this.token = token;
  }

  public setTenantId(tenantId: string | null): void {
    this.tenantId = tenantId;
  }

  /**
   * Dispatches a structured HTTP request and validates standard Sauron envelopes.
   */
  public async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    
    // Inject headers
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Set JWT security bearer context
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    // Set Tenant context
    if (this.tenantId) {
      headers.set("x-tenant-id", this.tenantId);
    }

    // Set Correlation ID
    const randomSuffix = typeof window !== "undefined" && window.crypto 
      ? Array.from(window.crypto.getRandomValues(new Uint32Array(2)))
          .map(n => n.toString(36))
          .join("")
      : Date.now().toString(36);
    const correlationId = headers.get("x-correlation-id") || `sauron-cli-${Date.now()}-${randomSuffix}`;
    headers.set("x-correlation-id", correlationId);

    const mergedOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, mergedOptions);
      const isJson = response.headers.get("content-type")?.includes("application/json");

      if (!response.ok) {
        if (isJson) {
          const errorData: ErrorResponse = await response.json();
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        } else {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
      }

      if (isJson) {
        const body: ApiResponse<T> = await response.json();
        return {
          success: body.success !== false,
          data: (body.data !== undefined ? body.data : body) as T,
          timestamp: body.timestamp || new Date().toISOString(),
          correlationId: body.correlationId || correlationId,
        };
      }

      // Fallback for non-JSON content
      const text = await response.text();
      return {
        success: true,
        data: text as unknown as T,
        timestamp: new Date().toISOString(),
        correlationId,
      };

    } catch (e: any) {
      console.error(`[Sauron ApiClient Error] [TxId: ${correlationId}]`, e);
      throw e;
    }
  }

  // HTTP Helper methods
  public async get<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "GET", headers });
  }

  public async post<T>(path: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  public async put<T>(path: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
  }

  public async delete<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "DELETE", headers });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
