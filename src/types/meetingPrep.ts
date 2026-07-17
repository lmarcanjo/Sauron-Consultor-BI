import type { CertifiedMetricSnapshot } from "../core/financial-consistency";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F14 — Consultant Intelligence Platform
 * Tipos para o relatório de preparação de reunião.
 * Toda informação possui lineage rastreável até a fonte real.
 */

export type MeetingPrepStatus = "ready" | "partial" | "no_data";

export type RadarDimensionStatus = "ok" | "attention" | "critical" | "no_data";

/**
 * Uma linha do resumo executivo em 30 segundos.
 * Cada linha tem origem rastreável.
 */
export interface SummaryLine {
  id: string;
  text: string;
  /** Ex: "Aba: DRE Q1 2026, Col: Receita Bruta" */
  lineage: string;
  type: "positive" | "negative" | "neutral" | "warning";
}

/**
 * Uma dimensão do radar executivo (Receita, Margem, Vendedores, etc.)
 */
export interface RadarDimension {
  id: string;
  label: string;
  /** Valor formatado (ex: "R$ 1.2M") */
  displayValue: string | null;
  /** Valor numérico bruto para comparação */
  rawValue: number | null;
  status: RadarDimensionStatus;
  /** Confiança 0-100 do cálculo */
  confidence: number;
  /** Origem rastreável da informação */
  lineage: string;
  /** Avisos do engine (dados ausentes, etc.) */
  warnings: string[];
}

/**
 * Variação de uma métrica em relação ao período anterior.
 */
export interface MetricChange {
  id: string;
  label: string;
  currentValue: number | null;
  previousValue: number | null;
  /** Ex: "+12.3%" ou "-4.7%" */
  changePercent: string | null;
  direction: "up" | "down" | "stable" | "no_data";
  /** Positivo = melhora (ex: receita sobe) vs negativo (ex: custo sobe) */
  isPositiveChange: boolean;
  lineage: string;
}

/**
 * Um tópico de agenda sugerido automaticamente pelo engine.
 */
export interface SuggestedTopic {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  /** Origem: qual engine/regra gerou essa sugestão */
  origin: string;
  /** Categoria para agrupamento visual */
  category: "risk" | "opportunity" | "attention" | "action" | "config";
}

/**
 * Um item de agenda da reunião (pode ser sugerido ou criado manualmente).
 */
export interface AgendaItem {
  id: string;
  title: string;
  /** "suggested" = gerado pelo engine, "manual" = criado pelo consultor */
  source: "suggested" | "manual";
  origin?: string;
  discussed: boolean;
  priority: "high" | "medium" | "low";
  order: number;
}

/**
 * Snapshot das métricas salvo ao final de uma reunião.
 * Usado para comparação na próxima sessão.
 */
export interface MeetingSnapshot {
  savedAt: string;
  dataSource: string;
  period: string;
  metrics: Record<string, number | null>;
}

/**
 * Relatório completo de preparação da reunião.
 * Gerado pelo meetingPrepService a partir dos engines existentes.
 */
export interface MeetingPrepReport {
  generatedAt: string;
  status: MeetingPrepStatus;
  /** Contexto da reunião (empresa, segmento, período) */
  context: {
    enterpriseName: string;
    segment: string;
    dataSource: string;
    rowCount: number;
    sheetNames: string[];
    period: string;
  };
  /** Resumo executivo em 3-5 frases */
  summary30s: SummaryLine[];
  /** Radar de 5 dimensões estratégicas */
  radarDimensions: RadarDimension[];
  /** Variações desde a última reunião */
  changes: MetricChange[];
  /** Tópicos sugeridos automaticamente */
  suggestedTopics: SuggestedTopic[];
  /** Avisos gerais de configuração */
  globalWarnings: string[];
  /** Evidence envelope shared with presentation and meeting artifacts. */
  certifiedSnapshot?: CertifiedMetricSnapshot;
}
