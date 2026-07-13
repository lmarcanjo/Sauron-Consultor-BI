/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { businessDomainRegistry } from "./BusinessDomainRegistry";

export class BusinessVocabularyEngine {
  /**
   * Translates/maps a term/synonym to the primary vocabulary term in the domain, or falls back to shared.
   */
  public resolveSynonym(domainId: string, inputTerm: string): string {
    const termLower = inputTerm.toLowerCase().trim();

    // 1. Try resolving in the specific domain vocabulary
    const pack = businessDomainRegistry.get(domainId);
    if (pack && pack.vocabulary && pack.vocabulary.terms) {
      for (const v of pack.vocabulary.terms) {
        if (v.term.toLowerCase() === termLower || 
            v.synonyms.some(s => s.toLowerCase() === termLower)) {
          return v.term;
        }
      }
    }

    // 2. Try resolving in the shared domain vocabulary
    const sharedPack = businessDomainRegistry.get("shared");
    if (sharedPack && sharedPack.vocabulary && sharedPack.vocabulary.terms) {
      for (const v of sharedPack.vocabulary.terms) {
        if (v.term.toLowerCase() === termLower || 
            v.synonyms.some(s => s.toLowerCase() === termLower)) {
          return v.term;
        }
      }
    }

    return inputTerm;
  }

  /**
   * Gets the list of synonyms for a given term in a domain, or falls back to shared.
   */
  public getSynonyms(domainId: string, term: string): string[] {
    const termLower = term.toLowerCase().trim();

    const pack = businessDomainRegistry.get(domainId);
    if (pack && pack.vocabulary && pack.vocabulary.terms) {
      for (const v of pack.vocabulary.terms) {
        if (v.term.toLowerCase() === termLower) {
          return v.synonyms;
        }
      }
    }

    const sharedPack = businessDomainRegistry.get("shared");
    if (sharedPack && sharedPack.vocabulary && sharedPack.vocabulary.terms) {
      for (const v of sharedPack.vocabulary.terms) {
        if (v.term.toLowerCase() === termLower) {
          return v.synonyms;
        }
      }
    }

    return [];
  }
}

export const businessVocabularyEngine = new BusinessVocabularyEngine();
export default businessVocabularyEngine;
