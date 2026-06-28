/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * F5-I: SHARED TYPE CONTRACTS
 * Establishes the type-safety bridge between client and server architectures.
 */

export interface CorrelationId {
  correlationId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  correlationId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path?: string;
  correlationId?: string;
}

export interface TenantContext {
  tenantId: string;
  name: string;
  tier: "basic" | "professional" | "enterprise";
  status: "active" | "suspended" | "inactive";
}

export interface UserContext {
  userId: string;
  email: string;
  role: "Guest" | "Consultant" | "Auditor" | "Client Manager" | "Consultant Admin";
  organizationId?: string;
  tenantId?: string;
  permissions: string[];
}

export enum JobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  QUARANTINED = "QUARANTINED",
}

export type HealthStatus = "OK" | "DEGRADED" | "ERROR";

export interface HealthCheckResponse {
  status: HealthStatus;
  uptime: number;
  timestamp: string;
  version: string;
  services: {
    database: { status: "UP" | "DOWN"; details?: string };
    redis: { status: "UP" | "DOWN"; details?: string };
    worker?: { status: "UP" | "DOWN"; details?: string };
  };
}
