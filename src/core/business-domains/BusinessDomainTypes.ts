/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkbookCatalog } from "../workbook/WorkbookTypes";

export interface BusinessDomainManifest {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  subdomains: string[];
}

export interface VocabularyTerm {
  term: string;
  synonyms: string[];
  description?: string;
}

export interface BusinessVocabulary {
  terms: VocabularyTerm[];
}

export interface BusinessHierarchy {
  levels: string[];
}

export interface BusinessKpi {
  code: string;
  name: string;
  unit: "currency" | "percentage" | "numeric" | "days" | "hours" | "ratio" | "ratio_percentage";
  description?: string;
}

export interface BusinessMeetingTemplate {
  subjectOrder: string[];
  mandatoryKpis: string[];
  optionalKpis: string[];
  suggestedQuestions: string[];
  riscos: string[];
  acoes: string[];
}

export interface PresentationSlide {
  title: string;
  type: string;
  layout: string;
  elements: any[];
}

export interface BusinessPresentationTemplate {
  cards: string[];
  charts: string[];
  rankings: string[];
  narrativeTemplate: string;
  minutesTemplate: string;
  slides: PresentationSlide[];
}

export interface BusinessDomainRule {
  id: string;
  name: string;
  description: string;
  validate: (records: any[]) => { valid: boolean; message?: string }[];
}

export interface BusinessDomainMapping {
  suggestedMappings: Record<string, string>;
}

export interface BusinessDomainPack {
  manifest: BusinessDomainManifest;
  vocabulary: BusinessVocabulary;
  hierarchy: BusinessHierarchy;
  kpis: BusinessKpi[];
  meeting: BusinessMeetingTemplate;
  presentation: BusinessPresentationTemplate;
  rules: BusinessDomainRule[];
  mapping: BusinessDomainMapping;
  terminology?: Record<string, string>;
}
