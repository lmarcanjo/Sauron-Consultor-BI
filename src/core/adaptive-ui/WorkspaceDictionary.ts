/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export interface AdaptiveDisplayLabel {
  canonicalKey: string;
  displayLabel: string;
  displayPlural?: string;
  abbreviation?: string;
  iconKey?: string;
  accentColor?: string;
  workspaceId: string;
  synonyms?: string[];
}

export interface WorkspaceDictionary {
  workspaceId: string;
  terms: {
    people?: AdaptiveDisplayLabel;
    customer?: AdaptiveDisplayLabel;
    seller?: AdaptiveDisplayLabel;
    department?: AdaptiveDisplayLabel;
    branch?: AdaptiveDisplayLabel;
    company?: AdaptiveDisplayLabel;
    group?: AdaptiveDisplayLabel;
    commission?: AdaptiveDisplayLabel;
    dashboard?: AdaptiveDisplayLabel;
    report?: AdaptiveDisplayLabel;
    meeting?: AdaptiveDisplayLabel;
    presentation?: AdaptiveDisplayLabel;
    [key: string]: AdaptiveDisplayLabel | undefined;
  };
  updatedAt: string;
}
