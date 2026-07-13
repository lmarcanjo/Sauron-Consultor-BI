/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { identityEngine } from "../identity/IdentityEngine";
import { workspaceDictionaryRepository } from "./WorkspaceDictionaryRepository";
import { AdaptiveDisplayLabel } from "./WorkspaceDictionary";

export class AdaptiveTerminologyEngine {
  public getTerm(key: string): AdaptiveDisplayLabel {
    const ws = identityEngine.getCurrentWorkspace();
    const wsId = ws?.id || "ws_primary";

    let domain = "shared";
    if (typeof localStorage !== "undefined") {
      try {
        const rawRegistry = localStorage.getItem("sauron_workspace_registry");
        if (rawRegistry) {
          const registry = JSON.parse(rawRegistry);
          const intelligentWs = registry.workspaces?.[wsId];
          if (intelligentWs) {
            domain = intelligentWs.detectedDomain || intelligentWs.domainPackId || "shared";
          }
        }
      } catch (e) {
        console.warn("[AdaptiveTerminologyEngine] Failed to read workspace registry:", e);
      }
    }

    const dict = workspaceDictionaryRepository.getDictionary(wsId, domain);
    const term = dict.terms[key];

    if (term) {
      return term;
    }

    // Ultimate generic fallback
    return {
      canonicalKey: key,
      displayLabel: key.charAt(0).toUpperCase() + key.slice(1),
      displayPlural: key.charAt(0).toUpperCase() + key.slice(1) + "s",
      iconKey: "HelpCircle",
      accentColor: "#64748b",
      abbreviation: key.slice(0, 3).toUpperCase(),
      workspaceId: wsId
    };
  }

  public getLabel(key: string, plural: boolean = false): string {
    const term = this.getTerm(key);
    return (plural ? term.displayPlural : term.displayLabel) || term.displayLabel;
  }
}

export const adaptiveTerminologyEngine = new AdaptiveTerminologyEngine();
export default adaptiveTerminologyEngine;
