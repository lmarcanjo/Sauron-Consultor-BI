/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusinessDomainPack } from "./BusinessDomainTypes";

export class BusinessDomainRegistry {
  private static instance: BusinessDomainRegistry;
  private packs = new Map<string, BusinessDomainPack>();

  private constructor() {}

  public static getInstance(): BusinessDomainRegistry {
    if (!BusinessDomainRegistry.instance) {
      BusinessDomainRegistry.instance = new BusinessDomainRegistry();
    }
    return BusinessDomainRegistry.instance;
  }

  public register(pack: BusinessDomainPack): void {
    this.packs.set(pack.manifest.id, pack);
  }

  public get(id: string): BusinessDomainPack | undefined {
    return this.packs.get(id);
  }

  public list(): BusinessDomainPack[] {
    return Array.from(this.packs.values());
  }

  public clear(): void {
    this.packs.clear();
  }
}

export const businessDomainRegistry = BusinessDomainRegistry.getInstance();
export default businessDomainRegistry;
