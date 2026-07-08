/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function classComposer(...classes: (string | undefined | null | boolean | Record<string, boolean>)[]): string {
  const result: string[] = [];
  
  for (const item of classes) {
    if (!item) continue;
    
    if (typeof item === "string") {
      result.push(item);
    } else if (typeof item === "object") {
      for (const [key, value] of Object.entries(item)) {
        if (value) {
          result.push(key);
        }
      }
    }
  }
  
  return result.join(" ").replace(/\s+/g, " ").trim();
}
