/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F14 — Consultant Intelligence Platform
 * meetingPrepService.ts — Orquestrador que calcula a inteligência pré-reunião
 * consumindo os engines existentes (BI, RuleEngine, Grafo) sem mockar.
 */

import { ActiveDataset } from "../types/dataSource";
import { LancamentoFinanceiro } from "../types";
import { MeetingPrepReport, RadarDimension, MetricChange, SuggestedTopic, SummaryLine } from "../types/meetingPrep";
import { BusinessIntelligenceEngine } from "../core/business-intelligence/BusinessIntelligenceEngine";
import { BusinessIntelligenceContext, BusinessMetric } from "../core/business-intelligence/BusinessMetricTypes";
import { listModuleMappings, getDefaultProjectId } from "../core/data/moduleMapping";
import { workbookRepository } from "../core/workbook/WorkbookRepository";
import { workbookReverseEngineer } from "../core/workbook-reverse";
import { buildKnowledgeGraph } from "../core/knowledge-graph/KnowledgeGraphBuilder";
import { RuleEngine } from "../core/rule-engine/RuleEngine";
import { adaptivePresentationEngine } from "../core/adaptive-ui";
import { platformLogger } from "../core/platform/PlatformLogger";
import { buildPresentationPeriodChanges, getPresentationPeriods } from "../core/business-intelligence/PresentationMetricContext";
import { getEnterpriseContext } from "../core/enterprise-consolidation";
import { buildCertifiedMetricSnapshot, buildConsistencyMetricFromBusinessMetric, certifiedMetricSnapshotStore, financialConsistencyOrchestrator } from "../core/financial-consistency";

export class MeetingPrepService {
  /**
   * Gera o relatório consolidado de inteligência pré-reunião.
   */
  public async generateReport(params: {
    activeDataset: ActiveDataset | null;
    activeRecords: LancamentoFinanceiro[];
    workspace: any;
    skipStructuralAnalysis?: boolean;
  }): Promise<MeetingPrepReport> {
    const { activeDataset, activeRecords, workspace } = params;
    const generatedAt = new Date().toISOString();

    // Se não há dados, retorna status no_data imediatamente
    if (!activeDataset || activeRecords.length === 0) {
      return {
        generatedAt,
        status: "no_data",
        context: {
          enterpriseName: "Nenhuma Empresa",
          segment: "Nenhum",
          dataSource: "Nenhuma fonte",
          rowCount: 0,
          sheetNames: [],
          period: "Nenhum"
        },
        summary30s: [],
        radarDimensions: this.getEmptyRadar(),
        changes: [],
        suggestedTopics: [],
        globalWarnings: ["Nenhuma fonte de dados ativa. Importe uma planilha ou conecte um banco para iniciar."]
      };
    }

    const projectId = getDefaultProjectId(activeDataset);
    const moduleMappings = listModuleMappings(activeDataset.datasetId, projectId);

    // 1. Resolver WorkbookCatalog e instanciar Grafo e RuleEngine se disponíveis
    let catalog = null;
    let reverseReport = null;
    let knowledgeGraph = null;
    let rules: any[] = [];
    const globalWarnings: string[] = [];

    const activeWorkbookId = workspace?.workbookIds?.[0] || activeDataset.datasetId;
    if (!params.skipStructuralAnalysis && activeWorkbookId) {
      catalog = workbookRepository.get(activeWorkbookId);
      if (catalog) {
        try {
          reverseReport = workbookReverseEngineer.generateReport(catalog);
          knowledgeGraph = buildKnowledgeGraph({
            workbookCatalog: catalog,
            reverseReport,
            activeDataset,
            moduleMappings
          });
          const ruleEngine = new RuleEngine({
            workbookCatalog: catalog,
            reverseReport,
            knowledgeGraph
          });
          rules = ruleEngine.listRules();
        } catch (e: any) {
          platformLogger.warn("Falha ao inicializar grafos ou regras a partir do workbook:", e.message);
          globalWarnings.push("Algumas regras complexas ou nós de dados não puderam ser processados.");
        }
      }
    }

    // 2. Construir Contexto de BI
    const biContext: BusinessIntelligenceContext = {
      activeDataset,
      moduleMappings,
      workbookCatalog: catalog,
      reverseReport,
      knowledgeGraph,
      rules,
      maxRowsPerMetric: 50000
    };

    const biEngine = new BusinessIntelligenceEngine(biContext);

    // Calcular métricas críticas usando o BI Engine real
    const metricsToCalculate = [
      "receitaCandidata",
      "margemCandidata",
      "custoCandidato",
      "totalVendido",
      "totalComissao",
      "quantidadeVendedores",
      "ticketMedio"
    ] as const;

    const calculatedMetrics: Record<string, BusinessMetric | null> = {};
    for (const name of metricsToCalculate) {
      try {
        calculatedMetrics[name] = await biEngine.calculateMetric(name);
      } catch (e) {
        calculatedMetrics[name] = null;
      }
    }

    const enterpriseContext = getEnterpriseContext();
    const snapshotMetrics = Object.values(calculatedMetrics)
      .filter((metric): metric is BusinessMetric => Boolean(metric))
      .map(metric => buildConsistencyMetricFromBusinessMetric({
        metricKey: metric.metricKey,
        displayLabel: metric.label,
        value: metric.value,
        sourceValue: metric.status === "ready" ? metric.value : null,
        lineage: {
          sourceId: metric.source.datasetId,
          workbookId: metric.source.workbookId,
          sheetName: metric.sheetName,
          physicalColumnName: metric.columnsUsed[0] || null,
          mappingId: metric.source.mappingId,
          producer: "BusinessIntelligenceEngine",
          calculatedAt: generatedAt,
        },
      }));
    const snapshotContextId = enterpriseContext.scope === "GROUP"
      ? enterpriseContext.groupId
      : enterpriseContext.scope === "COMPANY"
        ? enterpriseContext.companyId
        : enterpriseContext.scope === "UNIT"
          ? enterpriseContext.unitId
          : activeDataset.datasetId;
    const snapshotConsistency = financialConsistencyOrchestrator.reconcile({
      contextId: snapshotContextId || activeDataset.datasetId,
      requiredStages: ["source", "dataset", "kpis", "dashboard", "narrative"],
      metrics: snapshotMetrics,
    });
    const certifiedSnapshot = snapshotMetrics.length > 0
      ? certifiedMetricSnapshotStore.save(buildCertifiedMetricSnapshot({
          contextType: enterpriseContext.scope,
          contextId: snapshotContextId || activeDataset.datasetId,
          tenantId: activeDataset.sourceIdentity?.tenantId,
          workspaceId: enterpriseContext.workspaceId || activeDataset.sourceIdentity?.workspaceId,
          datasetVersion: `${activeDataset.datasetId}:${activeDataset.importedAt}`,
          metrics: snapshotMetrics,
          consistency: snapshotConsistency.report,
        }))
      : undefined;

    // 3. Resolver período e metadados
    const rows = activeRecords as unknown as Record<string, unknown>[];
    const availablePeriods = getPresentationPeriods(rows, moduleMappings);
    const currentPeriod = availablePeriods[availablePeriods.length - 1] || "Período Ativo";
    const previousPeriod = availablePeriods[availablePeriods.length - 2] || null;

    // 4. Montar Radar Executivo com base nos dados reais calculados
    const radarDimensions: RadarDimension[] = this.buildRadar(calculatedMetrics);

    // 5. Mudanças desde o período/reunião anterior
    const changes: MetricChange[] = this.buildChanges(activeRecords, currentPeriod, previousPeriod, calculatedMetrics, moduleMappings);

    // 6. Resumo Executivo em 30 segundos
    const summary30s: SummaryLine[] = this.buildSummary(calculatedMetrics, currentPeriod, changes);

    // 7. Sugestões automáticas de tópicos derivadas do RuleEngine e BI diagnostics
    const suggestedTopics: SuggestedTopic[] = this.buildSuggestedTopics(rules, calculatedMetrics);

    const isPartial = radarDimensions.some(d => d.status === "no_data" || d.status === "critical");

    return {
      generatedAt,
      status: isPartial ? "partial" : "ready",
      context: {
        enterpriseName: workspace?.name || activeDataset.sourceName || "Sauron Workspace",
        segment: workspace?.manualDomain || workspace?.detectedDomain || activeDataset.importProfile?.profileName || "Geral",
        dataSource: activeDataset.sourceName,
        rowCount: activeDataset.rowCount,
        sheetNames: activeDataset.sheets.map(s => typeof s === "string" ? s : s.sheetName),
        period: currentPeriod
      },
      summary30s,
      radarDimensions,
      changes,
      suggestedTopics,
      globalWarnings: [...globalWarnings, ...biContext.rules ? [] : ["Configure a biblioteca de workbooks para habilitar a extração de regras contábeis automatizada."]],
      certifiedSnapshot,
    };
  }

  private getEmptyRadar(): RadarDimension[] {
    const dimensions = ["Receita", "Margem", "Vendedores", "Comissão", "Ticket Médio"];
    return dimensions.map(d => ({
      id: d.toLowerCase().replace(/\s/g, "_"),
      label: d,
      displayValue: null,
      rawValue: null,
      status: "no_data",
      confidence: 0,
      lineage: "Sem fonte de dados ativa",
      warnings: []
    }));
  }

  private buildRadar(metrics: Record<string, BusinessMetric | null>): RadarDimension[] {
    const formatValue = (m: BusinessMetric | null, suffix = ""): string => {
      if (!m || m.value === null) return "N/D";
      if (m.value > 1000000) return `R$ ${(m.value / 1000000).toFixed(2)}M`;
      if (m.value > 1000) return `R$ ${(m.value / 1000).toFixed(1)}k`;
      return `${m.value.toFixed(2)}${suffix}`;
    };

    const getLineageStr = (m: BusinessMetric | null): string => {
      if (!m || !m.lineage) return "Sem mapeamento";
      const sheets = m.lineage.inputSheets.join(", ") || m.sheetName || "N/A";
      const cols = m.lineage.inputColumns.slice(0, 3).join(", ") || "N/A";
      return `Aba: ${sheets} | Col: ${cols}`;
    };

    const dReceita = metrics["receitaCandidata"];
    const dMargem = metrics["margemCandidata"];
    const dVendedores = metrics["quantidadeVendedores"];
    const dComissao = metrics["totalComissao"];
    const dTicket = metrics["ticketMedio"];

    return [
      {
        id: "receita",
        label: "Receita Operacional",
        displayValue: formatValue(dReceita),
        rawValue: dReceita?.value ?? null,
        status: !dReceita || dReceita.value === null ? "no_data" : dReceita.value < 100000 ? "critical" : "ok",
        confidence: dReceita?.diagnostics.confidence ?? 0,
        lineage: getLineageStr(dReceita),
        warnings: dReceita?.diagnostics.warnings || []
      },
      {
        id: "margem",
        label: "Margem de Contribuição",
        displayValue: dMargem && dMargem.value !== null ? `${dMargem.value.toFixed(1)}%` : "N/D",
        rawValue: dMargem?.value ?? null,
        status: !dMargem || dMargem.value === null ? "no_data" : dMargem.value < 15 ? "critical" : dMargem.value < 25 ? "attention" : "ok",
        confidence: dMargem?.diagnostics.confidence ?? 0,
        lineage: getLineageStr(dMargem),
        warnings: dMargem?.diagnostics.warnings || []
      },
      {
        id: "vendedores",
        label: "Força de Vendas Ativa",
        displayValue: dVendedores && dVendedores.value !== null ? `${dVendedores.value} colaboradores` : "N/D",
        rawValue: dVendedores?.value ?? null,
        status: !dVendedores || dVendedores.value === null ? "no_data" : dVendedores.value === 0 ? "critical" : "ok",
        confidence: dVendedores?.diagnostics.confidence ?? 0,
        lineage: getLineageStr(dVendedores),
        warnings: dVendedores?.diagnostics.warnings || []
      },
      {
        id: "comissao",
        label: "Comissões Distribuídas",
        displayValue: formatValue(dComissao),
        rawValue: dComissao?.value ?? null,
        status: !dComissao || dComissao.value === null ? "no_data" : "ok",
        confidence: dComissao?.diagnostics.confidence ?? 0,
        lineage: getLineageStr(dComissao),
        warnings: dComissao?.diagnostics.warnings || []
      },
      {
        id: "ticket_medio",
        label: "Ticket Médio",
        displayValue: formatValue(dTicket),
        rawValue: dTicket?.value ?? null,
        status: !dTicket || dTicket.value === null ? "no_data" : "ok",
        confidence: dTicket?.diagnostics.confidence ?? 0,
        lineage: getLineageStr(dTicket),
        warnings: dTicket?.diagnostics.warnings || []
      }
    ];
  }

  private buildChanges(
    records: LancamentoFinanceiro[],
    currentPeriod: string,
    previousPeriod: string | null,
    metrics: Record<string, BusinessMetric | null>,
    moduleMappings: ReturnType<typeof listModuleMappings>
  ): MetricChange[] {
    return buildPresentationPeriodChanges({
      rows: records as unknown as Record<string, unknown>[],
      mappings: moduleMappings,
      metrics: Object.values(metrics).filter((metric): metric is BusinessMetric => Boolean(metric)),
      currentPeriod,
      previousPeriod,
    });
  }

  private buildSummary(
    metrics: Record<string, BusinessMetric | null>,
    period: string,
    changes: MetricChange[]
  ): SummaryLine[] {
    const summary: SummaryLine[] = [];

    const rec = metrics["receitaCandidata"];
    const margem = metrics["margemCandidata"];
    const sellers = metrics["quantidadeVendedores"];

    if (rec && rec.value) {
      const recChange = changes.find(c => c.id === "change_receita");
      const changeText = recChange?.changePercent ? ` (${recChange.changePercent} vs mês anterior)` : "";
      
      summary.push({
        id: "sum_rec",
        text: `Faturamento registrado em ${period} totaliza R$ ${(rec.value / 1000000).toFixed(2)}M${changeText}.`,
        lineage: `BI Engine (receitaCandidata) -> ${rec.lineage.inputSheets.join(", ")}`,
        type: recChange?.isPositiveChange ? "positive" : "neutral"
      });
    }

    if (margem && margem.value !== null) {
      const isLow = margem.value < 20;
      summary.push({
        id: "sum_margem",
        text: `A margem média de contribuição está em ${margem.value.toFixed(1)}%, patamar considerado ${isLow ? "crítico para a rentabilidade" : "saudável"}.`,
        lineage: `BI Engine (margemCandidata) -> ${margem.lineage.inputSheets.join(", ")}`,
        type: isLow ? "negative" : "positive"
      });
    }

    if (sellers && sellers.value) {
      summary.push({
        id: "sum_sellers",
        text: `Identificados ${sellers.value} colaboradores ativos registrando lançamentos no período analisado.`,
        lineage: `BI Engine (quantidadeVendedores) -> ${sellers.lineage.inputSheets.join(", ")}`,
        type: "neutral"
      });
    }

    // Se o resumo ficou vazio
    if (summary.length === 0) {
      summary.push({
        id: "sum_empty",
        text: "Os dados foram importados, mas faltam os mapeamentos de DRE para extrair as tendências operacionais.",
        lineage: "Mapeamento pendente",
        type: "warning"
      });
    }

    return summary;
  }

  private buildSuggestedTopics(rules: any[], metrics: Record<string, BusinessMetric | null>): SuggestedTopic[] {
    const topics: SuggestedTopic[] = [];

    // 1. Analisar regras de comissão
    const commRules = rules.filter(r => r.category === "commission" || r.category === "dre");
    for (const rule of commRules) {
      // Procurar por regras complexas ou com diagnóstico de risco
      const isHighRisk = rule.diagnostics?.riskLevel === "high";
      topics.push({
        id: `topic_rule_${rule.id}`,
        title: `Revisar Fórmula: ${rule.name}`,
        description: `Grafo identificou dependência de ${rule.formulas.length} célula(s) com regras de comissão/DRE. Risco de alteração estrutural detectado.`,
        priority: isHighRisk ? "high" : "medium",
        origin: `RuleEngine (id: ${rule.id})`,
        category: isHighRisk ? "risk" : "attention"
      });
    }

    // 2. Analisar margem baixa
    const margem = metrics["margemCandidata"];
    if (margem && margem.value !== null && margem.value < 22) {
      topics.push({
        id: "topic_low_margin",
        title: "Mitigação de Queda de Margem",
        description: `Margem de contribuição atual de ${margem.value.toFixed(1)}% está abaixo do benchmark sugerido pelo Sauron.`,
        priority: "high",
        origin: "BusinessMetric (margemCandidata)",
        category: "risk"
      });
    }

    // 3. Avisos de diagnóstico de métricas
    Object.values(metrics).forEach(m => {
      if (m && m.diagnostics && m.diagnostics.warnings.length > 0) {
        topics.push({
          id: `topic_warning_${m.name}`,
          title: `Qualidade de Dados: ${m.label}`,
          description: m.diagnostics.warnings[0],
          priority: "medium",
          origin: `BI Diagnostic (${m.name})`,
          category: "config"
        });
      }
    });

    // Se nenhuma sugestão
    if (topics.length === 0) {
      topics.push({
        id: "topic_default_prep",
        title: "Alinhamento das Metas Comerciais",
        description: "Revisão geral dos faturamentos por vendedor e conciliação com metas de showroom.",
        priority: "medium",
        origin: "Histórico Operacional",
        category: "opportunity"
      });
    }

    return topics;
  }
}

export const meetingPrepService = new MeetingPrepService();
