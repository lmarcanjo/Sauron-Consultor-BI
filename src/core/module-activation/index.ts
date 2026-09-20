/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './ModuleActivationContracts';
export { ModuleActivationService, moduleActivationService, MODULE_DEFINITIONS } from './ModuleActivationService';
export { moduleConfigurationRepository, InMemoryModuleConfigurationRepository } from './ModuleConfigurationRepository';
export type { IModuleConfigurationRepository } from './ModuleConfigurationRepository';
export {
  ModuleConfigurationService,
  moduleConfigurationService,
  buildModuleConfigurationFingerprint,
  moduleConfigurationContextFromArtifact,
} from './ModuleConfigurationService';
export type {
  SaveModuleConfigurationInput,
  ModuleConfigurationContext,
} from './ModuleConfigurationService';
