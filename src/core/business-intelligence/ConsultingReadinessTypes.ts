/**
 * src/core/business-intelligence/ConsultingReadinessTypes.ts
 *
 * Tipos para o ConsultingReadinessService.
 *
 * Percentual determinístico:
 * Cada dimensão tem um peso (weight) normalizado para soma = 100.
 * score = Σ (dimensionStatus === "OK" ? weight : 0)
 *
 * Níveis de prontidão:
 * - Pronto para análise    → score >= 50
 * - Pronto para apresentação → score >= 70
 * - Pronto para reunião    → score >= 85
 */

export type DimensionStatus = "OK" | "WARNING" | "MISSING" | "ERROR";

export interface ReadinessDimension {
  id: string;
  label: string;
  status: DimensionStatus;
  /** 0–100 dentro da dimensão */
  score: number;
  /** Peso na soma geral (todos os pesos devem somar 100) */
  weight: number;
  reason: string;
  impact: string;
  action: string;
  /** Tab da UI para onde direcionar a ação */
  targetTab: string;
}

export type ReadinessLevel = "ANALYSIS" | "PRESENTATION" | "MEETING" | "INCOMPLETE";

export interface ConsultingReadinessReport {
  /** Percentual geral 0–100, determinístico */
  overallScore: number;
  level: ReadinessLevel;
  levelLabel: string;
  dimensions: ReadinessDimension[];
  /** Dimensões com problema, ordenadas por impacto */
  criticalIssues: ReadinessDimension[];
  generatedAt: string;
}

export interface ConsultingReadinessViewModel {
  report: ConsultingReadinessReport;
  /** Mensagem resumida para exibir no topo */
  summaryMessage: string;
  /** Cor do badge */
  badgeColor: string;
}

// ─── IDs das Dimensões ────────────────────────────────────────────────────────

export const DIMENSION_IDS = {
  ENTERPRISE_STRUCTURE: "enterprise_structure",
  DATA_SOURCES: "data_sources",
  PERSISTENCE: "persistence",
  LINKS: "links",
  CONFIGURATION: "configuration",
  INDICATORS: "indicators",
  DRE: "dre",
  DASHBOARD: "dashboard",
  PRESENTATION: "presentation",
  MEETING_PREP: "meeting_prep",
} as const;

/** Pesos das dimensões (soma = 100) */
export const DIMENSION_WEIGHTS: Record<string, number> = {
  [DIMENSION_IDS.ENTERPRISE_STRUCTURE]: 10,
  [DIMENSION_IDS.DATA_SOURCES]: 15,
  [DIMENSION_IDS.PERSISTENCE]: 10,
  [DIMENSION_IDS.LINKS]: 10,
  [DIMENSION_IDS.CONFIGURATION]: 15,
  [DIMENSION_IDS.INDICATORS]: 10,
  [DIMENSION_IDS.DRE]: 10,
  [DIMENSION_IDS.DASHBOARD]: 10,
  [DIMENSION_IDS.PRESENTATION]: 5,
  [DIMENSION_IDS.MEETING_PREP]: 5,
};
