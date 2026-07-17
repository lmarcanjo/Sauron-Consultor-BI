import {
  BusinessDomain,
  BusinessDomainClassification,
  WorkbookFingerprint,
} from "./WorkspaceIntelligenceTypes";
import { normalizeBusinessToken, tokenizeBusinessText } from "./WorkbookFingerprint";
import { businessDomainRegistry } from "../business-domains/BusinessDomainRegistry";
import "../business-domains";

function domainTerms(domain: BusinessDomain): string[] {
  const pack = businessDomainRegistry.get(domain);
  if (!pack) return [];
  return [
    pack.manifest.id,
    pack.manifest.name,
    ...pack.vocabulary.terms.flatMap(term => [term.term, ...term.synonyms]),
  ];
}

function emptyScores(): Record<BusinessDomain, number> {
  return {
    automotive: 0,
    agribusiness: 0,
    retail: 0,
    services: 0,
    finance: 0,
    healthcare: 0,
    education: 0,
    construction: 0,
    unknown: 0,
  };
}

export function classifyBusinessDomain(fingerprint: WorkbookFingerprint): BusinessDomainClassification {
  const tokens = new Set([
    ...fingerprint.businessTerms,
    ...fingerprint.columnTokens,
    ...fingerprint.sheetNames.flatMap(tokenizeBusinessText),
    ...tokenizeBusinessText(fingerprint.sourceName),
  ].map(normalizeBusinessToken).filter(Boolean));

  const scores = emptyScores();
  const matchedByDomain = new Map<BusinessDomain, string[]>();

  (Object.keys(scores) as BusinessDomain[]).filter(domain => domain !== "unknown").forEach(domain => {
    const matches = domainTerms(domain)
      .map(normalizeBusinessToken)
      .filter(term => tokens.has(term));
    matchedByDomain.set(domain, matches);
    scores[domain] = matches.length;
  });

  const ranked = (Object.keys(scores) as BusinessDomain[])
    .filter(domain => domain !== "unknown")
    .sort((left, right) => scores[right] - scores[left]);

  const bestDomain = ranked[0] || "unknown";
  const bestScore = scores[bestDomain] || 0;
  const secondScore = scores[ranked[1]] || 0;

  if (bestScore === 0) {
    return {
      domain: "unknown",
      confidence: 0,
      matchedTerms: [],
      scores,
    };
  }

  const confidence = Math.min(0.95, Math.max(0.2, (bestScore - secondScore + bestScore) / 8));
  return {
    domain: bestDomain,
    confidence,
    matchedTerms: matchedByDomain.get(bestDomain) || [],
    scores,
  };
}

export function getBusinessDomainLabel(domain: BusinessDomain): string {
  return businessDomainRegistry.get(domain)?.manifest.name || "Indefinido";
}
