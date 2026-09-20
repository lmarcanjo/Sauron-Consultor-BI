/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ConsultingProgressContext } from "./ConsultingProgressProjection";

export type MeetingReadinessStatus = "NOT_READY" | "READY_WITH_LIMITATIONS" | "READY";

export interface ReadinessCheckItem {
  id: string;
  label: string;
  status: "OK" | "WARNING" | "BLOCKED";
  detail?: string;
}

export interface MeetingReadinessProjection {
  status: MeetingReadinessStatus;
  percentage: number;
  items: readonly ReadinessCheckItem[];
  blockers: readonly string[];
  warnings: readonly string[];
  canStartMeeting: boolean;
}

export function projectMeetingReadiness(ctx: ConsultingProgressContext): MeetingReadinessProjection {
  const items: ReadinessCheckItem[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Client
  const hasClient = Boolean(ctx.client || ctx.project?.clientId);
  if (hasClient) {
    items.push({ id: "client", label: "Cliente Selecionado", status: "OK" });
  } else {
    items.push({ id: "client", label: "Cliente Selecionado", status: "BLOCKED", detail: "Nenhum cliente associado." });
    blockers.push("Cliente não identificado.");
  }

  // 2. Engagement
  const hasEngagement = Boolean(ctx.project);
  if (hasEngagement) {
    items.push({ id: "engagement", label: "Engajamento Ativo", status: "OK" });
  } else {
    items.push({ id: "engagement", label: "Engajamento Ativo", status: "BLOCKED", detail: "Nenhum engajamento ativo." });
    blockers.push("Engajamento não identificado.");
  }

  // 3. Organization Structure
  const hasOrg = ctx.groups.length > 0 && ctx.companies.length > 0;
  if (hasOrg) {
    items.push({ id: "structure", label: "Estrutura Organizacional", status: "OK" });
  } else {
    items.push({ id: "structure", label: "Estrutura Organizacional", status: "BLOCKED", detail: "Estrutura incompleta." });
    blockers.push("Estrutura da empresa incompleta.");
  }

  // 4. Data Source
  const hasSource = Boolean(ctx.activeDataset && ctx.activeDataset.rowCount > 0);
  if (hasSource) {
    items.push({ id: "source", label: "Fonte de Dados Conectada", status: "OK" });
  } else {
    items.push({ id: "source", label: "Fonte de Dados Conectada", status: "BLOCKED", detail: "Sem dados válidos." });
    blockers.push("Fonte de dados ausente.");
  }

  // 5. Preliminary Financial Analysis
  const hasAnalysis = Boolean(ctx.artifact);
  if (hasAnalysis) {
    items.push({ id: "analysis", label: "Análise da Fonte Concluída", status: "OK" });
  } else {
    items.push({ id: "analysis", label: "Análise da Fonte Concluída", status: "BLOCKED", detail: "Análise preliminar pendente." });
    blockers.push("Análise preliminar da fonte não executada.");
  }

  // 6. Executive Summary & Financial Dashboard
  const finModule = ctx.moduleProjections.find(m => m.moduleId === "FINANCIAL");
  const hasFinancial = finModule?.status === "ACTIVE";
  if (hasFinancial) {
    items.push({ id: "financial", label: "Dashboard Financeiro", status: "OK" });
  } else {
    items.push({ id: "financial", label: "Dashboard Financeiro", status: "BLOCKED", detail: "Módulo financeiro inativo." });
    blockers.push("Dashboard financeiro não disponível.");
  }

  // 7. Executive Presentation
  const hasPres = ctx.hasPresentation;
  if (hasPres) {
    items.push({ id: "presentation", label: "Apresentação Executiva (8 slides)", status: "OK" });
  } else {
    items.push({ id: "presentation", label: "Apresentação Executiva (8 slides)", status: "BLOCKED", detail: "Apresentação não gerada." });
    blockers.push("Apresentação executiva ainda não foi gerada.");
  }

  // Non-blocking / Optional items (warnings only)
  const unavailableModules = ctx.moduleProjections.filter(m => m.status !== "ACTIVE" && m.moduleId !== "FINANCIAL");
  if (unavailableModules.length > 0) {
    unavailableModules.forEach(m => {
      const reason = m.missingRequirements.join(", ") || m.limitations[0] || "Dados não identificados";
      items.push({
        id: `mod_${m.moduleId.toLowerCase()}`,
        label: `Módulo ${m.moduleId}`,
        status: "WARNING",
        detail: reason
      });
      warnings.push(`Módulo ${m.moduleId}: ${reason}`);
    });
  }

  // Artifact limitations as warnings
  if (ctx.artifact && ctx.artifact.limitations.length > 0) {
    ctx.artifact.limitations.forEach(lim => warnings.push(lim.message));
  }

  // Deliverables (PDF/PPTX/Snapshots)
  if (ctx.hasPdfOrPptx || ctx.hasSnapshot) {
    items.push({ id: "deliverables", label: "Entregáveis Oficiais (PDF/PPTX/Snapshot)", status: "OK" });
  } else {
    items.push({ id: "deliverables", label: "Entregáveis Oficiais (PDF/PPTX/Snapshot)", status: "WARNING", detail: "Recomendado antes da reunião." });
    warnings.push("Entregáveis executivos (PDF/PPTX) ainda não foram exportados.");
  }

  // Calculate percentage of required checklist (7 core items)
  const coreTotal = 7;
  const coreReady = [hasClient, hasEngagement, hasOrg, hasSource, hasAnalysis, hasFinancial, hasPres].filter(Boolean).length;
  const percentage = Math.round((coreReady / coreTotal) * 100);

  let status: MeetingReadinessStatus;
  let canStartMeeting = false;

  if (blockers.length > 0) {
    status = "NOT_READY";
    canStartMeeting = false;
  } else if (warnings.length > 0) {
    status = "READY_WITH_LIMITATIONS";
    canStartMeeting = true;
  } else {
    status = "READY";
    canStartMeeting = true;
  }

  return {
    status,
    percentage,
    items,
    blockers,
    warnings,
    canStartMeeting
  };
}
