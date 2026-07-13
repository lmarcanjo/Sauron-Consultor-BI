/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { businessDomainRegistry } from "./BusinessDomainRegistry";
import { BusinessPresentationTemplate } from "./BusinessDomainTypes";

export class BusinessPresentationEngine {
  public getPresentationTemplate(domainId: string): BusinessPresentationTemplate | null {
    const pack = businessDomainRegistry.get(domainId);
    if (!pack) return null;
    return pack.presentation;
  }
}

export const businessPresentationEngine = new BusinessPresentationEngine();
export default businessPresentationEngine;
