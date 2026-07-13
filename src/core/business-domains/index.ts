/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { businessDomainRegistry } from "./BusinessDomainRegistry";
import { sharedPack } from "./shared";
import { automotivePack } from "./automotive";
import { agribusinessPack } from "./agribusiness";
import { retailPack } from "./retail";
import { industryPack } from "./industry";
import { constructionPack } from "./construction";
import { healthcarePack } from "./healthcare";
import { educationPack } from "./education";
import { servicesPack } from "./services";

// Automatically register all default packs
businessDomainRegistry.register(sharedPack);
businessDomainRegistry.register(automotivePack);
businessDomainRegistry.register(agribusinessPack);
businessDomainRegistry.register(retailPack);
businessDomainRegistry.register(industryPack);
businessDomainRegistry.register(constructionPack);
businessDomainRegistry.register(healthcarePack);
businessDomainRegistry.register(educationPack);
businessDomainRegistry.register(servicesPack);

export * from "./BusinessDomainTypes";
export * from "./BusinessDomainRegistry";
export * from "./BusinessDomainEngine";
export * from "./BusinessVocabularyEngine";
export * from "./BusinessHierarchyEngine";
export * from "./BusinessKpiEngine";
export * from "./BusinessMeetingEngine";
export * from "./BusinessPresentationEngine";
export * from "./BusinessDomainDiagnostics";
