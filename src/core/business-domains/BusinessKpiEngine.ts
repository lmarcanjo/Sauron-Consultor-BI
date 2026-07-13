/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { businessDomainRegistry } from "./BusinessDomainRegistry";
import { BusinessKpi } from "./BusinessDomainTypes";

export class BusinessKpiEngine {
  public getKPIs(domainId: string): BusinessKpi[] {
    const pack = businessDomainRegistry.get(domainId);
    if (!pack) return [];

    // Retrieve shared / default indicators
    const sharedPack = businessDomainRegistry.get("shared");
    const sharedKpis = sharedPack ? sharedPack.kpis : [];

    const kpisMap = new Map<string, BusinessKpi>();
    sharedKpis.forEach(k => kpisMap.set(k.code, k));
    pack.kpis.forEach(k => kpisMap.set(k.code, k));

    return Array.from(kpisMap.values());
  }
}

export const businessKpiEngine = new BusinessKpiEngine();
export default businessKpiEngine;
