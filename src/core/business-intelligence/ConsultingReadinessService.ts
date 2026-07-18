/**
 * src/core/business-intelligence/ConsultingReadinessService.ts
 *
 * Serviço de prontidão consultiva — 10 dimensões.
 *
 * IMPORTANTE: este serviço NÃO é chamado diretamente por ReadinessReport.tsx.
 * O componente recebe um ConsultingReadinessViewModel pronto.
 *
 * Percentual determinístico:
 *   score = Σ (dimension.score * dimension.weight / 100)
 *
 * Prontidão por nível:
 *   >= 50 → Pronto para análise
 *   >= 70 → Pronto para apresentação
 *   >= 85 → Pronto para reunião
 */

import {
  ConsultingReadinessReport,
  ConsultingReadinessViewModel,
  DIMENSION_IDS,
  DIMENSION_WEIGHTS,
  DimensionStatus,
  ReadinessDimension,
  ReadinessLevel,
} from "./ConsultingReadinessTypes";
import { enterpriseRepository } from "../persistence/EnterpriseRepository";
import { workbookRepository, DEFAULT_WORKBOOK_PROJECT_ID } from "../workbook-library";
import { spreadsheetStorageAdapter } from "../storage/IndexedSpreadsheetStorageAdapter";

import { getActiveConsultingModelConfigSync } from "./ConsultingModelRepository";

// ─── Input ────────────────────────────────────────────────────────────────────

export interface ConsultingReadinessInput {
  /** ID do workspace atual */
  workspaceId?: string;
  /** Workbooks com configurações de módulo */
  workbookModuleConfigs?: Record<string, { hasDRE?: boolean; hasKPI?: boolean; hasPessoas?: boolean; hasComissao?: boolean }>;
  /** IDs de apresentações geradas */
  presentationIds?: string[];
  /** Reunião agendada? */
  hasMeetingScheduled?: boolean;
  /** Checklists de reunião completos? */
  meetingChecklistsComplete?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dim(
  id: string,
  label: string,
  status: DimensionStatus,
  score: number,
  reason: string,
  impact: string,
  action: string,
  targetTab: string
): ReadinessDimension {
  return {
    id,
    label,
    status,
    score,
    weight: DIMENSION_WEIGHTS[id] ?? 10,
    reason,
    impact,
    action,
    targetTab,
  };
}

function levelFromScore(score: number): { level: ReadinessLevel; label: string; color: string } {
  if (score >= 85) return { level: "MEETING", label: "Pronto para reunião", color: "text-purple-500" };
  if (score >= 70) return { level: "PRESENTATION", label: "Pronto para apresentação", color: "text-blue-500" };
  if (score >= 50) return { level: "ANALYSIS", label: "Pronto para análise", color: "text-emerald-500" };
  return { level: "INCOMPLETE", label: "Configuração incompleta", color: "text-amber-500" };
}

// ─── Serviço ──────────────────────────────────────────────────────────────────

export class ConsultingReadinessService {
  async evaluate(input: ConsultingReadinessInput = {}): Promise<ConsultingReadinessViewModel> {
    const dimensions: ReadinessDimension[] = [];

    // ── D1: Estrutura empresarial ──────────────────────────────────────────
    const enterprises = await enterpriseRepository.getAll();
    const groups = enterprises.filter((e) => e.type === "Grupo");
    const companies = enterprises.filter((e) => e.type === "Empresa" || e.type === "Fazenda" || e.type === "Loja");

    if (groups.length > 0 && companies.length > 0) {
      dimensions.push(dim(
        DIMENSION_IDS.ENTERPRISE_STRUCTURE, "Estrutura empresarial",
        "OK", 100,
        `${groups.length} grupo(s) e ${companies.length} empresa(s) cadastrados.`,
        "Habilita navegação por entidade e consolidação de dados.",
        "Continue cadastrando as demais empresas.", "Central de Dados"
      ));
    } else if (groups.length > 0 || companies.length > 0) {
      dimensions.push(dim(
        DIMENSION_IDS.ENTERPRISE_STRUCTURE, "Estrutura empresarial",
        "WARNING", 50,
        "Estrutura parcialmente cadastrada (faltam grupos ou empresas).",
        "Consolidação limitada. Dashboards por grupo não disponíveis.",
        "Cadastre grupo econômico e pelo menos uma empresa.", "Central de Dados"
      ));
    } else {
      dimensions.push(dim(
        DIMENSION_IDS.ENTERPRISE_STRUCTURE, "Estrutura empresarial",
        "MISSING", 0,
        "Nenhuma empresa ou grupo cadastrado.",
        "Sem estrutura, nenhuma análise contextualizada é possível.",
        "Cadastre o grupo econômico e as empresas.", "Central de Dados"
      ));
    }

    // ── D2: Fontes de dados ────────────────────────────────────────────────
    const workbooks = workbookRepository.listWorkbooks({ projectId: DEFAULT_WORKBOOK_PROJECT_ID, includeArchived: false });
    const activeWorkbooks = workbooks.filter((w) => w.status === "ACTIVE");

    if (workbooks.length === 0) {
      dimensions.push(dim(
        DIMENSION_IDS.DATA_SOURCES, "Fontes de dados",
        "MISSING", 0,
        "Nenhuma planilha importada.",
        "Sem dados, todas as análises ficam indisponíveis.",
        "Importe pelo menos uma planilha.", "Importar"
      ));
    } else if (activeWorkbooks.length === 0) {
      dimensions.push(dim(
        DIMENSION_IDS.DATA_SOURCES, "Fontes de dados",
        "WARNING", 40,
        `${workbooks.length} planilha(s) importada(s), mas nenhuma ativa.`,
        "Dados disponíveis mas não incluídos na análise.",
        "Ative pelo menos uma fonte na Biblioteca.", "Biblioteca"
      ));
    } else {
      dimensions.push(dim(
        DIMENSION_IDS.DATA_SOURCES, "Fontes de dados",
        "OK", 100,
        `${activeWorkbooks.length} fonte(s) ativa(s) de ${workbooks.length} importada(s).`,
        "Dados disponíveis para análise.",
        "", "Biblioteca"
      ));
    }

    // ── D3: Persistência física ────────────────────────────────────────────
    let persistenceOk = 0;
    let persistenceTotal = workbooks.length;

    if (persistenceTotal > 0) {
      for (const wb of workbooks.slice(0, 10)) { // Verificar até 10 para não travar
        try {
          const hasMeta = await spreadsheetStorageAdapter.hasMetadata(wb.id);
          const rowCount = await spreadsheetStorageAdapter.getRowCount(wb.id);
          if (hasMeta && rowCount > 0) persistenceOk++;
        } catch (_) {}
      }
    }

    if (persistenceTotal === 0) {
      dimensions.push(dim(
        DIMENSION_IDS.PERSISTENCE, "Persistência",
        "MISSING", 0,
        "Nenhum dado persistido.",
        "Sem dados no banco local.",
        "Importe uma planilha.", "Importar"
      ));
    } else {
      const ratio = persistenceOk / Math.min(persistenceTotal, 10);
      const score = Math.round(ratio * 100);
      dimensions.push(dim(
        DIMENSION_IDS.PERSISTENCE, "Persistência",
        score >= 80 ? "OK" : score >= 40 ? "WARNING" : "ERROR",
        score,
        `${persistenceOk}/${Math.min(persistenceTotal, 10)} fontes com dados físicos verificados.`,
        "Fontes sem dados físicos não alimentam o Dashboard.",
        "Reprocesse as fontes com falha de armazenamento.", "Biblioteca"
      ));
    }

    // ── D4: Vínculos empresariais ──────────────────────────────────────────
    const linkedWorkbooks = workbooks.filter((wb) =>
      enterprises.some((e) => (e as any).workbookIds?.includes(wb.id))
    );

    if (workbooks.length === 0) {
      dimensions.push(dim(
        DIMENSION_IDS.LINKS, "Vínculos empresariais",
        "MISSING", 0,
        "Nenhuma fonte para vincular.",
        "Sem fontes, vínculos não se aplicam.",
        "Importe fontes.", "Importar"
      ));
    } else {
      const linkRatio = linkedWorkbooks.length / workbooks.length;
      const score = Math.round(linkRatio * 100);
      dimensions.push(dim(
        DIMENSION_IDS.LINKS, "Vínculos empresariais",
        score === 100 ? "OK" : score >= 50 ? "WARNING" : "MISSING",
        score,
        `${linkedWorkbooks.length}/${workbooks.length} fontes vinculadas a uma empresa.`,
        "Fontes sem vínculo não aparecem no contexto empresarial.",
        "Vincule as fontes às empresas na Biblioteca.", "Biblioteca"
      ));
    }

    // ── D5: Configuração de campos ─────────────────────────────────────────
    const configs = input.workbookModuleConfigs ?? {};
    const configuredCount = Object.values(configs).filter(
      (c) => c.hasDRE || c.hasKPI || c.hasPessoas || c.hasComissao
    ).length;

    if (workbooks.length === 0) {
      dimensions.push(dim(
        DIMENSION_IDS.CONFIGURATION, "Configuração de campos",
        "MISSING", 0,
        "Nenhuma fonte para configurar.",
        "Sem configuração, módulos analíticos ficam indisponíveis.",
        "Importe e configure campos.", "Importar"
      ));
    } else if (configuredCount === 0) {
      dimensions.push(dim(
        DIMENSION_IDS.CONFIGURATION, "Configuração de campos",
        "WARNING", 20,
        "Nenhuma fonte com campos configurados.",
        "Módulos analíticos (DRE, KPI, Pessoas) indisponíveis.",
        "Configure os campos na Biblioteca.", "Biblioteca"
      ));
    } else {
      const score = Math.round((configuredCount / workbooks.length) * 100);
      dimensions.push(dim(
        DIMENSION_IDS.CONFIGURATION, "Configuração de campos",
        score >= 80 ? "OK" : "WARNING",
        score,
        `${configuredCount}/${workbooks.length} fontes com campos configurados.`,
        "Módulos disponíveis apenas para fontes configuradas.",
        "Configure as demais fontes.", "Biblioteca"
      ));
    }

    const config = getActiveConsultingModelConfigSync();
    const isDreEnabled = !config || config.enabledModules.includes("dre");
    const isComercialEnabled = !config || config.enabledModules.includes("comercial");
    const isPessoasEnabled = !config || config.enabledModules.includes("pessoas");
    const isComissaoEnabled = !config || config.enabledModules.includes("comissao");

    // ── D6: Indicadores ────────────────────────────────────────────────────
    const hasKPI = Object.values(configs).some((c) => c.hasKPI);
    const kpiApplicable = isComercialEnabled || isPessoasEnabled || isComissaoEnabled;
    if (!kpiApplicable) {
      dimensions.push(dim(
        DIMENSION_IDS.INDICATORS, "Indicadores (KPI)",
        "OK", 100,
        "Indicadores não aplicáveis ao projeto (módulos desabilitados).",
        "Sem impacto nos demais entregáveis.",
        "", "Biblioteca"
      ));
    } else {
      dimensions.push(dim(
        DIMENSION_IDS.INDICATORS, "Indicadores (KPI)",
        hasKPI ? "OK" : "WARNING",
        hasKPI ? 100 : 30,
        hasKPI ? "KPIs configurados." : "Nenhum KPI mapeado.",
        "KPIs alimentam o Dashboard executivo.",
        hasKPI ? "" : "Mapeie colunas de KPI na configuração de campos.", "Biblioteca"
      ));
    }

    // ── D7: DRE ────────────────────────────────────────────────────────────
    const hasDRE = Object.values(configs).some((c) => c.hasDRE);
    if (!isDreEnabled) {
      dimensions.push(dim(
        DIMENSION_IDS.DRE, "DRE",
        "OK", 100,
        "DRE não aplicável ao projeto (desabilitado).",
        "Sem impacto nos demais entregáveis.",
        "", "Biblioteca"
      ));
    } else {
      dimensions.push(dim(
        DIMENSION_IDS.DRE, "DRE",
        hasDRE ? "OK" : "WARNING",
        hasDRE ? 100 : 20,
        hasDRE ? "DRE configurado." : "DRE não configurado.",
        "DRE permite análise financeira estruturada.",
        hasDRE ? "" : "Mapeie colunas de DRE (Receita, Custo, Despesa).", "Biblioteca"
      ));
    }

    // ── D8: Dashboard ──────────────────────────────────────────────────────
    const dashboardRequiredKPI = kpiApplicable ? hasKPI : false;
    const dashboardRequiredDRE = isDreEnabled ? hasDRE : false;
    const hasEnoughForDashboard = activeWorkbooks.length > 0 && (dashboardRequiredKPI || dashboardRequiredDRE || !isDreEnabled && !kpiApplicable);
    dimensions.push(dim(
      DIMENSION_IDS.DASHBOARD, "Dashboard",
      hasEnoughForDashboard ? "OK" : "WARNING",
      hasEnoughForDashboard ? 100 : activeWorkbooks.length > 0 ? 40 : 0,
      hasEnoughForDashboard
        ? "Dashboard disponível com dados ativos."
        : "Dashboard requer fontes ativas e módulos configurados.",
      "Dashboard é o principal entregável da consultoria.",
      hasEnoughForDashboard ? "" : "Ative fontes e configure os módulos habilitados.", "Dashboard"
    ));

    // ── D9: Apresentação ──────────────────────────────────────────────────
    const hasPresentation = (input.presentationIds ?? []).length > 0;
    dimensions.push(dim(
      DIMENSION_IDS.PRESENTATION, "Apresentação",
      hasPresentation ? "OK" : "WARNING",
      hasPresentation ? 100 : 0,
      hasPresentation ? "Apresentação gerada." : "Nenhuma apresentação criada.",
      "Apresentação é necessária para reuniões executivas.",
      hasPresentation ? "" : "Gere uma apresentação a partir do Dashboard.", "Apresentações"
    ));

    // ── D10: Preparação de reunião ─────────────────────────────────────────
    const meetingReady = (input.hasMeetingScheduled && input.meetingChecklistsComplete) ?? false;
    dimensions.push(dim(
      DIMENSION_IDS.MEETING_PREP, "Preparação de reunião",
      meetingReady ? "OK" : "WARNING",
      meetingReady ? 100 : input.hasMeetingScheduled ? 50 : 0,
      meetingReady
        ? "Reunião agendada e checklist completo."
        : input.hasMeetingScheduled
        ? "Reunião agendada mas checklist incompleto."
        : "Nenhuma reunião agendada.",
      "Reunião preparada garante qualidade da entrega consultiva.",
      meetingReady ? "" : "Complete o checklist de preparação.", "Reunião"
    ));

    // ── Calcular score geral ───────────────────────────────────────────────
    const overallScore = Math.round(
      dimensions.reduce(
        (acc, d) => acc + (d.score * d.weight) / 100,
        0
      )
    );

    const { level, label: levelLabel, color } = levelFromScore(overallScore);

    const criticalIssues = dimensions
      .filter((d) => d.status === "MISSING" || d.status === "ERROR")
      .sort((a, b) => b.weight - a.weight);

    const report: ConsultingReadinessReport = {
      overallScore,
      level,
      levelLabel,
      dimensions,
      criticalIssues,
      generatedAt: new Date().toISOString(),
    };

    let summaryMessage = "";
    if (level === "INCOMPLETE") {
      summaryMessage = `${criticalIssues.length} item${criticalIssues.length > 1 ? "ns" : ""} pendente${criticalIssues.length > 1 ? "s" : ""} para iniciar a análise.`;
    } else if (level === "ANALYSIS") {
      summaryMessage = "Dados suficientes para análise. Configure apresentação para avançar.";
    } else if (level === "PRESENTATION") {
      summaryMessage = "Pronto para apresentação. Complete o checklist de reunião.";
    } else {
      summaryMessage = "Jornada completa. Pronto para a reunião executiva.";
    }

    return {
      report,
      summaryMessage,
      badgeColor: color,
    };
  }
}

export const consultingReadinessService = new ConsultingReadinessService();
