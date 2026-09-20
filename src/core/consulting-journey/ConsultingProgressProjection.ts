/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WorkspaceProject, ClientEntity } from "../../modules/consultant-workspace/types";
import type { BusinessGroup, Company, Unit } from "../persistence/EnterpriseRepository";
import type { ActiveDataset } from "../../types/dataSource";
import type { PreliminaryFinancialAnalysisArtifact } from "../preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ModuleActivationProjection } from "../module-activation/ModuleActivationContracts";

export type ConsultingStepStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "LIMITED";

export interface ConsultingNextAction {
  id: string;
  label: string;
  targetTab: string;
  description: string;
}

export interface ConsultingProgressProjection {
  clientStatus: ConsultingStepStatus;
  engagementStatus: ConsultingStepStatus;
  organizationStatus: ConsultingStepStatus;
  sourceStatus: ConsultingStepStatus;
  analysisStatus: ConsultingStepStatus;
  dashboardStatus: ConsultingStepStatus;
  presentationStatus: ConsultingStepStatus;
  deliverablesStatus: ConsultingStepStatus;
  meetingStatus: ConsultingStepStatus;
  overallCompletion: number; // 0 - 100 percentage
  blockers: string[];
  warnings: string[];
  nextAction: ConsultingNextAction;
}

export interface ConsultingProgressContext {
  client: ClientEntity | null;
  project: WorkspaceProject | null;
  groups: readonly BusinessGroup[];
  companies: readonly Company[];
  units: readonly Unit[];
  activeDataset: ActiveDataset | null;
  artifact: PreliminaryFinancialAnalysisArtifact | null;
  moduleProjections: readonly ModuleActivationProjection[];
  hasPresentation: boolean;
  hasPdfOrPptx: boolean;
  hasSnapshot: boolean;
  hasConductedMeeting: boolean;
  hasPendingItems: boolean;
}

export function projectConsultingProgress(ctx: ConsultingProgressContext): ConsultingProgressProjection {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Client Status
  let clientStatus: ConsultingStepStatus = "NOT_STARTED";
  if (ctx.client || ctx.project?.clientId) {
    clientStatus = "COMPLETED";
  } else {
    blockers.push("Nenhum cliente selecionado para a consultoria.");
  }

  // 2. Engagement Status
  let engagementStatus: ConsultingStepStatus = "NOT_STARTED";
  if (ctx.project) {
    engagementStatus = "COMPLETED";
  } else {
    blockers.push("Nenhum engajamento ativo.");
  }

  // 3. Organization Status
  let organizationStatus: ConsultingStepStatus = "NOT_STARTED";
  if (ctx.groups.length > 0 && ctx.companies.length > 0) {
    organizationStatus = "COMPLETED";
  } else if (ctx.groups.length > 0 || ctx.companies.length > 0) {
    organizationStatus = "IN_PROGRESS";
  } else {
    blockers.push("Estrutura organizacional (Grupo/Empresa) não configurada.");
  }

  // 4. Source Status
  let sourceStatus: ConsultingStepStatus = "NOT_STARTED";
  if (ctx.activeDataset && ctx.activeDataset.rowCount > 0) {
    sourceStatus = "COMPLETED";
  } else if (ctx.activeDataset) {
    sourceStatus = "IN_PROGRESS";
    warnings.push("Fonte de dados conectada mas sem registros válidos.");
  } else if (ctx.project?.spreadsheets && ctx.project.spreadsheets.length > 0) {
    sourceStatus = "IN_PROGRESS";
  } else {
    blockers.push("Nenhuma fonte de dados importada ou ativa.");
  }

  // 5. Analysis Status
  let analysisStatus: ConsultingStepStatus = "NOT_STARTED";
  if (ctx.artifact) {
    analysisStatus = "COMPLETED";
    if (ctx.artifact.limitations.length > 0) {
      warnings.push(...ctx.artifact.limitations.map(lim => lim.message));
    }
  } else if (sourceStatus === "COMPLETED") {
    analysisStatus = "NOT_STARTED";
  }

  // 6. Dashboard Status
  let dashboardStatus: ConsultingStepStatus = "NOT_STARTED";
  if (analysisStatus === "COMPLETED") {
    const fin = ctx.moduleProjections.find(m => m.moduleId === "FINANCIAL");
    const activeCount = ctx.moduleProjections.filter(m => m.status === "ACTIVE").length;
    if (fin?.status === "ACTIVE" && activeCount === ctx.moduleProjections.length) {
      dashboardStatus = "COMPLETED";
    } else if (fin?.status === "ACTIVE") {
      dashboardStatus = "LIMITED";
      warnings.push("Alguns módulos analíticos possuem requisitos não atendidos.");
    } else {
      dashboardStatus = "IN_PROGRESS";
    }
  }

  // 7. Presentation Status
  let presentationStatus: ConsultingStepStatus = "NOT_STARTED";
  if (ctx.hasPresentation) {
    presentationStatus = "COMPLETED";
  } else if (analysisStatus === "COMPLETED") {
    presentationStatus = "NOT_STARTED";
  }

  // 8. Deliverables Status
  let deliverablesStatus: ConsultingStepStatus = "NOT_STARTED";
  if (ctx.hasPdfOrPptx || ctx.hasSnapshot) {
    deliverablesStatus = "COMPLETED";
  } else if (presentationStatus === "COMPLETED") {
    deliverablesStatus = "NOT_STARTED";
  }

  // 9. Meeting Status
  let meetingStatus: ConsultingStepStatus = "NOT_STARTED";
  if (ctx.hasConductedMeeting) {
    meetingStatus = "COMPLETED";
  } else if (deliverablesStatus === "COMPLETED" || presentationStatus === "COMPLETED") {
    meetingStatus = "NOT_STARTED";
  }

  // Calculate overall Completion (Checklist based, not statistical)
  const steps = [
    clientStatus === "COMPLETED",
    engagementStatus === "COMPLETED",
    organizationStatus === "COMPLETED",
    sourceStatus === "COMPLETED",
    analysisStatus === "COMPLETED",
    dashboardStatus === "COMPLETED" || dashboardStatus === "LIMITED",
    presentationStatus === "COMPLETED",
    deliverablesStatus === "COMPLETED",
    meetingStatus === "COMPLETED"
  ];
  const completedCount = steps.filter(Boolean).length;
  const overallCompletion = Math.round((completedCount / steps.length) * 100);

  // Derive Deterministic Next Action (NEVER NONE if next step possible)
  let nextAction: ConsultingNextAction;

  if (clientStatus !== "COMPLETED") {
    nextAction = {
      id: "create_client",
      label: "CADASTRAR CLIENTE",
      targetTab: "minha_carteira",
      description: "Cadastre ou selecione um cliente para iniciar a consultoria."
    };
  } else if (engagementStatus !== "COMPLETED") {
    nextAction = {
      id: "create_engagement",
      label: "CRIAR ENGAJAMENTO",
      targetTab: "minha_carteira",
      description: "Inicie um novo engajamento para o cliente."
    };
  } else if (organizationStatus !== "COMPLETED") {
    nextAction = {
      id: "configure_structure",
      label: "CONFIGURAR ESTRUTURA",
      targetTab: "enterprise_center",
      description: "Configure o grupo econômico, empresa e unidade do engajamento."
    };
  } else if (sourceStatus !== "COMPLETED") {
    nextAction = {
      id: "add_source",
      label: "ADICIONAR DADOS",
      targetTab: "central_dados",
      description: "Importe uma planilha (XLS/XLSX/CSV) para o engajamento."
    };
  } else if (analysisStatus !== "COMPLETED") {
    nextAction = {
      id: "analyze_source",
      label: "ANALISAR DADOS",
      targetTab: "analise_estrutura",
      description: "Execute a análise da fonte para gerar os artefatos de negócio."
    };
  } else if (dashboardStatus === "NOT_STARTED") {
    nextAction = {
      id: "view_summary",
      label: "VER RESUMO EXECUTIVO",
      targetTab: "resumo",
      description: "Revise os indicadores consolidados e os resultados apurados."
    };
  } else if (presentationStatus !== "COMPLETED") {
    nextAction = {
      id: "generate_presentation",
      label: "GERAR APRESENTAÇÃO",
      targetTab: "apresentacoes",
      description: "Gere a apresentação executiva de 8 slides para o comitê."
    };
  } else if (deliverablesStatus !== "COMPLETED") {
    nextAction = {
      id: "generate_deliverables",
      label: "GERAR ENTREGÁVEIS",
      targetTab: "resumo",
      description: "Exporte o PDF Executivo, PowerPoint e salve o snapshot oficial."
    };
  } else if (meetingStatus !== "COMPLETED") {
    nextAction = {
      id: "prepare_meeting",
      label: "PREPARAR REUNIÃO",
      targetTab: "preparacao_reuniao",
      description: "Revise a pauta e os materiais para a reunião com o cliente."
    };
  } else if (ctx.hasPendingItems) {
    nextAction = {
      id: "review_pending",
      label: "REVISAR PENDÊNCIAS",
      targetTab: "consulting_home",
      description: "Existem pendências registradas na última reunião a serem revisadas."
    };
  } else {
    nextAction = {
      id: "continue_consulting",
      label: "INICIAR REUNIÃO",
      targetTab: "modo_reuniao",
      description: "Todos os entregáveis estão prontos. Inicie a reunião executiva."
    };
  }

  return {
    clientStatus,
    engagementStatus,
    organizationStatus,
    sourceStatus,
    analysisStatus,
    dashboardStatus,
    presentationStatus,
    deliverablesStatus,
    meetingStatus,
    overallCompletion,
    blockers,
    warnings,
    nextAction
  };
}
