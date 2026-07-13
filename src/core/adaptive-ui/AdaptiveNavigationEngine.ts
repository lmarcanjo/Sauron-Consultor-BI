/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { adaptiveUILabelEngine } from "./AdaptiveUILabelEngine";

export class AdaptiveNavigationEngine {
  public translateTitle(title: string): string {
    if (typeof title !== "string") {
      return typeof title === "object" && title !== null ? String((title as any).canonicalKey || (title as any).title || "") : "";
    }
    return adaptiveUILabelEngine.replaceStaticTerms(title);
  }

  public adaptMenuStructure(menu: any[]): any[] {
    if (!Array.isArray(menu)) return [];
    return menu.map(group => {
      if (!group) return group;
      const title = typeof group.title === "string" ? this.translateTitle(group.title) : (group.title || "");
      const subItems = Array.isArray(group.subItems)
        ? group.subItems.map((item: any) => {
            if (!item) return item;
            return {
              ...item,
              title: typeof item.title === "string" ? this.translateTitle(item.title) : (item.title || "")
            };
          })
        : [];
      return {
        ...group,
        title,
        subItems
      };
    });
  }
}

export const adaptiveNavigationEngine = new AdaptiveNavigationEngine();
export default adaptiveNavigationEngine;
