/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getRuntimeMode, RuntimeMode } from "./RuntimeMode";

export interface RuntimeCapabilities {
  cloudAuthEnabled: boolean;
  cloudEnterprisePersistenceEnabled: boolean;
  cloudWorkbookMetadataEnabled: boolean;
  cloudObjectStorageEnabled: boolean;
  cloudAuditEnabled: boolean;
}

export interface CloudMigrationStatus {
  auth: "local" | "cloud";
  enterprises: "local" | "cloud";
  workbookMetadata: "local" | "cloud";
  files: "local" | "cloud";
  audit: "local" | "cloud";
}

/**
 * Returns capabilities according to runtime mode and individual migration feature flags.
 */
export function getRuntimeCapabilities(): RuntimeCapabilities {
  const isCloud = getRuntimeMode() === RuntimeMode.CLOUD;

  if (!isCloud) {
    return {
      cloudAuthEnabled: false,
      cloudEnterprisePersistenceEnabled: false,
      cloudWorkbookMetadataEnabled: false,
      cloudObjectStorageEnabled: false,
      cloudAuditEnabled: false
    };
  }

  // Under Cloud Mode, read from environment variables to support progressive migration flags
  const env = typeof process !== "undefined" && process.env ? process.env : {};
  
  return {
    cloudAuthEnabled: env.CLOUD_AUTH_ENABLED === "true",
    cloudEnterprisePersistenceEnabled: env.CLOUD_ENTERPRISE_PERSISTENCE_ENABLED === "true",
    cloudWorkbookMetadataEnabled: env.CLOUD_WORKBOOK_METADATA_ENABLED === "true",
    cloudObjectStorageEnabled: env.CLOUD_OBJECT_STORAGE_ENABLED === "true",
    cloudAuditEnabled: env.CLOUD_AUDIT_ENABLED === "true"
  };
}

/**
 * Diagnostic helper mapping capability flags to explicit migration status labels.
 */
export function getCloudMigrationStatus(): CloudMigrationStatus {
  const caps = getRuntimeCapabilities();
  return {
    auth: caps.cloudAuthEnabled ? "cloud" : "local",
    enterprises: caps.cloudEnterprisePersistenceEnabled ? "cloud" : "local",
    workbookMetadata: caps.cloudWorkbookMetadataEnabled ? "cloud" : "local",
    files: caps.cloudObjectStorageEnabled ? "cloud" : "local",
    audit: caps.cloudAuditEnabled ? "cloud" : "local"
  };
}
