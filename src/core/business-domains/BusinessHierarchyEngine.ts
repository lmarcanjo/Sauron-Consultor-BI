/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { businessDomainRegistry } from "./BusinessDomainRegistry";
import { BusinessHierarchy } from "./BusinessDomainTypes";

export class BusinessHierarchyEngine {
  public getHierarchy(domainId: string): BusinessHierarchy | null {
    const pack = businessDomainRegistry.get(domainId);
    if (!pack) return null;
    return pack.hierarchy;
  }
}

export const businessHierarchyEngine = new BusinessHierarchyEngine();
export default businessHierarchyEngine;
