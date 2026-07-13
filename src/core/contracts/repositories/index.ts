/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isCloudMode } from "../../runtime/RuntimeMode";
import { getRuntimeCapabilities } from "../../runtime/RuntimeCapabilities";
import * as Ports from "./RepositoryPorts";
import * as Local from "./LocalRepositoryAdapters";
import * as Api from "./ApiRepositoryAdapters";

export * from "./RepositoryPorts";
export * from "./LocalRepositoryAdapters";
export * from "./ApiRepositoryAdapters";

// Factories dynamically resolving Local or Cloud adapters based on runtime mode & progressive flags

export function getUserRepository(): Ports.UserRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudAuthEnabled) {
    return new Api.ApiUserRepositoryAdapter();
  }
  return new Local.LocalUserRepositoryAdapter();
}

export function getOrganizationRepository(): Ports.OrganizationRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudEnterprisePersistenceEnabled) {
    return new Api.ApiOrganizationRepositoryAdapter();
  }
  return new Local.LocalOrganizationRepositoryAdapter();
}

export function getEnterpriseRepository(): Ports.EnterpriseRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudEnterprisePersistenceEnabled) {
    return new Api.ApiEnterpriseRepositoryAdapter();
  }
  return new Local.LocalEnterpriseRepositoryAdapter();
}

export function getWorkspaceRepository(): Ports.WorkspaceRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudEnterprisePersistenceEnabled) {
    return new Api.ApiWorkspaceRepositoryAdapter();
  }
  return new Local.LocalWorkspaceRepositoryAdapter();
}

export function getWorkbookLibraryRepository(): Ports.WorkbookLibraryRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudWorkbookMetadataEnabled) {
    return new Api.ApiWorkbookLibraryRepositoryAdapter();
  }
  return new Local.LocalWorkbookLibraryRepositoryAdapter();
}

export function getDatasetMetadataRepository(): Ports.DatasetMetadataRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudWorkbookMetadataEnabled) {
    return new Api.ApiDatasetMetadataRepositoryAdapter();
  }
  return new Local.LocalDatasetMetadataRepositoryAdapter();
}

export function getModuleMappingRepository(): Ports.ModuleMappingRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudEnterprisePersistenceEnabled) {
    return new Api.ApiModuleMappingRepositoryAdapter();
  }
  return new Local.LocalModuleMappingRepositoryAdapter();
}

export function getWorkspaceDictionaryRepository(): Ports.WorkspaceDictionaryRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudEnterprisePersistenceEnabled) {
    return new Api.ApiWorkspaceDictionaryRepositoryAdapter();
  }
  return new Local.LocalWorkspaceDictionaryRepositoryAdapter();
}

export function getPresentationRepository(): Ports.PresentationRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudEnterprisePersistenceEnabled) {
    return new Api.ApiPresentationRepositoryAdapter();
  }
  return new Local.LocalPresentationRepositoryAdapter();
}

export function getMeetingRepository(): Ports.MeetingRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudEnterprisePersistenceEnabled) {
    return new Api.ApiMeetingRepositoryAdapter();
  }
  return new Local.LocalMeetingRepositoryAdapter();
}

export function getActionPlanRepository(): Ports.ActionPlanRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudEnterprisePersistenceEnabled) {
    return new Api.ApiActionPlanRepositoryAdapter();
  }
  return new Local.LocalActionPlanRepositoryAdapter();
}

export function getAuditRepository(): Ports.AuditRepositoryPort {
  if (isCloudMode() && getRuntimeCapabilities().cloudAuditEnabled) {
    return new Api.ApiAuditRepositoryAdapter();
  }
  return new Local.LocalAuditRepositoryAdapter();
}
