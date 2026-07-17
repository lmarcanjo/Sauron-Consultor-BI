/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * ExecutivePresentationEngine.ts — Engine de geração de slides respeitando o contexto selecionado.
 */

import { Enterprise, enterpriseRepository } from "../persistence/EnterpriseRepository";
import { Workspace } from "../workspace-intelligence/WorkspaceIntelligenceTypes";
import { ActiveDataset } from "../../types/dataSource";
import { businessDomainEngine } from "../business-domains/BusinessDomainEngine";
import { LancamentoFinanceiro } from "../../types";
import { adaptivePresentationEngine } from "../adaptive-ui";
import { getEnterpriseContext, enterpriseConsolidationService } from "../enterprise-consolidation";
import { BusinessIntelligenceEngine } from "./BusinessIntelligenceEngine";
import { BusinessMetricName } from "./BusinessMetricTypes";
import { buildPresentationMetricValues, inferPresentationMappings } from "./PresentationMetricContext";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { CertifiedMetricSnapshot, ConsistencyReadinessReport, buildCertifiedMetricSnapshot, buildConsistencyMetricFromBusinessMetric, certifiedMetricSnapshotStore, financialConsistencyOrchestrator } from "../financial-consistency";

export interface PresentationSlide {
  id: string;
  title: string;
  subtitle: string;
  type: 'cover' | 'executive_summary' | 'main_indicators' | 'attention_points' | 'opportunities' | 'risks' | 'financial_data' | 'comparatives' | 'pending' | 'recommendations' | 'next_steps' | 'data_lineage' | 'insufficient_data';
  content: {
    summary?: string;
    points?: string[];
    metrics?: Array<{ label: string; value: string | number; change?: string }>;
    data?: any[];
    checklist?: string[];
    lineage?: string;
  };
}

export interface ExecutivePresentation {
  id: string;
  title: string;
  targetName: string;
  targetType: string;
  slides: PresentationSlide[];
  status: "ready" | "insufficient_data";
  consistency?: ConsistencyReadinessReport;
  certifiedSnapshot?: CertifiedMetricSnapshot;
}

export class ExecutivePresentationEngine {
  public async generatePresentation(input: {
    enterpriseId?: string;
    workspace?: Workspace | null;
    activeDataset?: ActiveDataset | null;
    allRows?: LancamentoFinanceiro[];
    moduleMappings?: ModuleFieldMapping[];
  }): Promise<ExecutivePresentation> {
    const { activeDataset, allRows = [] } = input;

    // Check if we have an active dataset and some real records
    if (!activeDataset || allRows.length === 0) {
      return {
        id: "pres_insufficient",
        title: adaptivePresentationEngine.adaptText("Apresentação Executiva"),
        targetName: "Nenhuma Empresa",
        targetType: "Outro",
        status: "insufficient_data",
        slides: adaptivePresentationEngine.adaptSlides([
          {
            id: "slide_insufficient",
            title: "Configuração pendente",
            subtitle: "Dados insuficientes",
            type: "insufficient_data",
            content: {
              summary: "Nenhuma fonte de dados ativa. Importe uma planilha ou conecte um banco para gerar análises.",
            }
          }
        ])
      };
    }

    const context = getEnterpriseContext();
    const allEnterprises = await enterpriseRepository.getAll();

    // 1. Obter registros filtrados do contexto selecionado
    const { records: scopedRows } = await enterpriseConsolidationService.getRecordsForContext(context, 1, 1000000);

    // Resolve target details based on context scope
    let targetName = activeDataset.sourceName;
    let targetType = "Grupo";

    const uniqueGroupsInRows = Array.from(new Set(allRows.map(r => r.Grupo || r["Grupo Econômico"] || r["Grupo Economico"] || "").filter(Boolean)));
    if (uniqueGroupsInRows.length === 1 && uniqueGroupsInRows[0]) {
      targetName = uniqueGroupsInRows[0];
    }
    
    if (context.scope === "GROUP" && context.groupId) {
      const g = allEnterprises.find(e => e.id === context.groupId);
      if (g) {
        targetName = g.name;
        targetType = "Grupo";
      }
    } else if (context.scope === "COMPANY" && context.companyId) {
      const c = allEnterprises.find(e => e.id === context.companyId);
      if (c) {
        targetName = c.name;
        targetType = "Empresa";
      }
    } else if (context.scope === "UNIT" && context.unitId) {
      const u = allEnterprises.find(e => e.id === context.unitId);
      if (u) {
        targetName = u.name;
        targetType = "Unidade";
      }
    }

    // A scoped query returning no rows is a valid empty state. Falling back to
    // the caller's previous rows here would make a company show another
    // company's presentation while the new context is still empty.
    const hasExplicitContext = Boolean(
      context.groupId || context.companyId || context.unitId || context.scope === "WORKBOOK"
    );
    const finalRows = hasExplicitContext
      ? scopedRows
      : (scopedRows.length > 0 ? scopedRows : allRows);

    // Business values come from the canonical BI engine. The derived mapping
    // is transient when older callers have not persisted module mappings.
    const mappings = input.moduleMappings?.length
      ? input.moduleMappings
      : inferPresentationMappings(activeDataset, finalRows);
    const metricNames: BusinessMetricName[] = [
      "receitaCandidata",
      "custoCandidato",
      "despesaCandidata",
      "resultadoLiquido",
      "totalComissao",
      "quantidadeVendedores",
      "ticketMedio",
    ];
    const metricEngine = new BusinessIntelligenceEngine({
      activeDataset,
      moduleMappings: mappings,
      rowProvider: async (_sheetName, limit) => finalRows.slice(0, limit),
    });
    const metrics = await Promise.all(metricNames.map(metricName => metricEngine.calculateMetric(metricName)));
    const presentationValues = buildPresentationMetricValues(metrics, finalRows, mappings);
    if (presentationValues.status !== "ready") {
      return {
        id: "pres_insufficient",
        title: adaptivePresentationEngine.adaptText("Apresentação Executiva"),
        targetName: activeDataset.sourceName,
        targetType: "Fonte",
        status: "insufficient_data",
        slides: adaptivePresentationEngine.adaptSlides([{
          id: "slide_pending_metrics",
          title: "Configuração pendente",
          subtitle: "Campos necessários para a apresentação",
          type: "insufficient_data",
          content: {
            summary: `Configure as métricas: ${presentationValues.missingMetrics.join(", ")}.`,
          },
        }]),
      };
    }

    const totalReceita = presentationValues.totalRevenue as number;
    const totalCusto = presentationValues.totalCost as number;
    const totalDespesa = presentationValues.totalExpense as number;
    const totalComissao = presentationValues.totalCommission as number;
    const totalLucro = presentationValues.netResult as number;
    const margemLucro = totalReceita !== 0 ? (totalLucro / totalReceita) * 100 : 0;
    const countSellers = presentationValues.sellerCount as number;
    const ticketMedio = presentationValues.averageTicket as number;

    // Apply domain translations using F11.0 / F11.1 businessDomainEngine
    const t = (label: string) => businessDomainEngine.translateToDomain(label);
    const formatBrl = (v: number) => "R$ " + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Resolve period range from the same mapped source used by BI.
    const periodStr = presentationValues.period;

    // Resolve segment label
    const activeEnt = allEnterprises.find(e => e.id === (context.companyId || context.groupId));
    const segmentLabel = activeEnt?.segment === "agribusiness" ? "Agronegócio" :
                          activeEnt?.segment === "automotive" ? "Operação Especializada" : "Geral";

    const topCompany = presentationValues.topCompany;
    const topSeller = presentationValues.topSeller;
    const companyCount = presentationValues.companyCount;
    const consistencyMetrics = metrics.map(metric => buildConsistencyMetricFromBusinessMetric({
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
        calculatedAt: new Date().toISOString(),
      },
    }));
    const consistency = financialConsistencyOrchestrator.reconcile({
      contextId: activeDataset.datasetId,
      requiredStages: ["source", "dataset", "kpis", "dashboard", "presentation"],
      metrics: consistencyMetrics,
    });
    const enterpriseContextId = context.scope === "GROUP"
      ? context.groupId
      : context.scope === "COMPANY"
        ? context.companyId
        : context.scope === "UNIT"
          ? context.unitId
          : activeDataset.datasetId;
    const certifiedSnapshot = certifiedMetricSnapshotStore.save(buildCertifiedMetricSnapshot({
      contextType: context.scope,
      contextId: enterpriseContextId || activeDataset.datasetId,
      tenantId: activeDataset.sourceIdentity?.tenantId,
      workspaceId: context.workspaceId || activeDataset.sourceIdentity?.workspaceId,
      datasetVersion: `${activeDataset.datasetId}:${activeDataset.importedAt}`,
      metrics: consistencyMetrics,
      consistency: consistency.report,
    }));

    const slides: PresentationSlide[] = [
      {
        id: "slide_cover",
        title: t("Apresentação de Resultados"),
        subtitle: `${targetType}: ${targetName} | Segmento: ${segmentLabel} | Período: ${periodStr}`,
        type: "cover",
        content: {
          summary: `Análise de resultados gerada em ${new Date().toLocaleDateString('pt-BR')}. Fonte: ${activeDataset.sourceName}`,
        }
      },
      {
        id: "slide_executive_summary",
        title: t("Resumo Executivo"),
        subtitle: t("Destaques operacionais reais do período"),
        type: "executive_summary",
        content: {
          summary: `A operação consolidada de ${targetName} gerou faturamento bruto de ${formatBrl(totalReceita)}, com custo operacional correspondente de ${formatBrl(totalCusto)}. O resultado operacional líquido final foi de ${formatBrl(totalLucro)}, consolidando margem líquida de ${margemLucro.toFixed(1)}%. [Linha de Dados: Colunas Receita, Custo e Despesa]`,
          points: [
            `Registrados ${countSellers} ${t("Vendedores")} produtivos no período fiscal analisado. [Linha de Dados: Coluna Vendedor]`,
            `Ticket médio consolidado por ${t("Vendedor")}: ${formatBrl(ticketMedio)}. [Linha de Dados: Coluna Vendedor e Receita]`,
            `Total de despesas operacionais amortizadas: ${formatBrl(totalDespesa)}. [Linha de Dados: Coluna Despesa]`
          ]
        }
      },
      {
        id: "slide_main_indicators",
        title: t("Indicadores Principais"),
        subtitle: t("Métricas operacionais consolidadas"),
        type: "main_indicators",
        content: {
          metrics: [
            { label: t("Receita Bruta"), value: formatBrl(totalReceita), change: `[Linha de Dados: Coluna Receita]` },
            { label: t("Custos Operacionais"), value: formatBrl(totalCusto), change: `[Linha de Dados: Coluna Custo]` },
            { label: t("Resultado Líquido"), value: formatBrl(totalLucro), change: `[Linha de Dados: Colunas Receita, Custo e Despesa]` },
            { label: t("Comissões Pagas"), value: formatBrl(totalComissao), change: `[Linha de Dados: Coluna Comissão]` }
          ]
        }
      }
    ];



    slides.push({
      id: "slide_improvements",
      title: t("O que Melhorou"),
      subtitle: t("Destaques operacionais positivos reais"),
      type: "comparatives",
      content: {
        points: [
          topCompany ? `Liderança em faturamento: Unidade ${topCompany[0]} lidera a operação acumulando receita de ${formatBrl(topCompany[1])}. [Linha de Dados: Coluna Empresa]` : "Faturamento estável entre filiais.",
          topSeller ? `Liderança comercial: Gestor/venda ${topSeller[0]} gerou maior volume de vendas somando ${formatBrl(topSeller[1])}. [Linha de Dados: Coluna Vendedor]` : "Resultados comerciais consistentes."
        ]
      }
    });

    slides.push(
      {
        id: "slide_attention_points",
        title: t("Pontos de Atenção"),
        subtitle: t("Alertas operacionais consolidados"),
        type: "attention_points",
        content: {
          points: [
            totalDespesa > totalReceita * 0.35 
              ? `Elevado nível de despesas operacionais, representando ${((totalDespesa / totalReceita) * 100).toFixed(0)}% da receita. [Linha de Dados: Coluna Despesa]`
              : `Proporção de despesas sob limite seguro (${((totalDespesa / totalReceita) * 105).toFixed(0)}% da receita). [Linha de Dados: Coluna Despesa]`,
            totalComissao > totalReceita * 0.1
              ? `Rácio de comissões acima da meta histórica, comendo ${((totalComissao / totalReceita) * 100).toFixed(1)}% do faturamento. [Linha de Dados: Coluna Comissão]`
              : `Despesa de comissionamento alinhada com as diretrizes comerciais (${((totalComissao / totalReceita) * 100).toFixed(1)}%). [Linha de Dados: Coluna Comissão]`
          ]
        }
      },
      {
        id: "slide_risks",
        title: t("Riscos"),
        subtitle: t("Fatores de volatilidade operacional"),
        type: "risks",
        content: {
          points: [
            totalCusto > totalReceita * 0.6
              ? `Elevada taxa de custos operacionais (representa ${((totalCusto / totalReceita) * 100).toFixed(0)}% da receita), pressionando margens brutas. [Linha de Dados: Coluna Custo]`
              : `Margem bruta preservada (custos em ${((totalCusto / totalReceita) * 100).toFixed(0)}% do faturamento). [Linha de Dados: Coluna Custo]`,
            companyCount === 1 && topCompany
              ? `Alta concentração de faturamento em uma única unidade (${topCompany[0]}). [Linha de Dados: Coluna Empresa]`
              : `Concentração diluída entre as ${companyCount} unidades identificadas. [Linha de Dados: Colunas Empresa e Filial]`
          ]
        }
      },
      {
        id: "slide_opportunities",
        title: t("Oportunidades"),
        subtitle: t("Canais de alavancagem de rentabilidade"),
        type: "opportunities",
        content: {
          points: [
            totalComissao < totalReceita * 0.08
              ? `Margem de repasse de comissão abaixo do teto recomendável (${((totalComissao / totalReceita) * 100).toFixed(1)}%). Oportunidade de estimular o time com premiações. [Linha de Dados: Coluna Comissão]`
              : `Oportunidade de rever grade e teto de comissões por venda. [Linha de Dados: Colunas Comissão e Receita]`,
            `Melhoria de margens através de negociação direta com fornecedores para mitigar custos de insumos. [Linha de Dados: Coluna Custo]`
          ]
        }
      },
      {
        id: "slide_recommendations",
        title: t("Recomendações"),
        subtitle: t("Estratégias de preservação de margens"),
        type: "recommendations",
        content: {
          points: [
            totalDespesa > totalReceita * 0.3
              ? `Revisar processos administrativos para reduzir as despesas indiretas para abaixo de 30% da receita. [Linha de Dados: Coluna Despesa]`
              : `Manter as diretrizes de controle de despesa indireta operacional vigentes. [Linha de Dados: Coluna Despesa]`,
            totalComissao > totalReceita * 0.08
              ? `Adequar o plano de comissionamento comercial para limitar o repasse consolidado de ${t("Vendedores")} a no máximo 8% do faturamento. [Linha de Dados: Coluna Comissão]`
              : `Manter a política de incentivos de vendas atual vinculada à margem líquida. [Linha de Dados: Coluna Comissão]`
          ]
        }
      },
      {
        id: "slide_pending_config",
        title: t("Pendências de Configuração"),
        subtitle: t("Mapeamento e governança do workbook"),
        type: "pending",
        content: {
          points: [
            `Mapeamento de colunas de faturamento: Concluído (${activeDataset.columnProfiles.length} mapeados). [Configuração do Workbook]`,
            `Registrar e validar filiais sem lançamentos ativos na base de dados do período. [Configuração do Workbook]`
          ]
        }
      },
      {
        id: "slide_data_lineage",
        title: t("Origem dos Dados"),
        subtitle: t("Rastreabilidade e governança corporativa"),
        type: "data_lineage",
        content: {
          lineage: `Planilhas e Fontes associadas ao escopo ${context.scope} | Linhas totais processadas: ${finalRows.length} | Importado em: ${new Date(activeDataset.importedAt).toLocaleString('pt-BR')} [Linha de Dados: Metadados do Contexto]`
        }
      },
      {
        id: "slide_next_steps",
        title: t("Próximos Passos"),
        subtitle: t("Plano de ação imediato"),
        type: "next_steps",
        content: {
          checklist: [
            t("Apresentar relatório de margens consolidadas aos gestores locais"),
            t("Revisar plano de contas de custos diretos nas fazendas/lojas"),
            t("Validar lançamentos no ERP do período atual")
          ]
        }
      }
    );

    return {
      id: `pres_${Date.now()}`,
      title: adaptivePresentationEngine.adaptText("Apresentação Executiva"),
      targetName,
      targetType,
      slides: adaptivePresentationEngine.adaptSlides(slides),
      status: "ready",
      consistency,
      certifiedSnapshot,
    };
  }
}

export const executivePresentationEngine = new ExecutivePresentationEngine();
