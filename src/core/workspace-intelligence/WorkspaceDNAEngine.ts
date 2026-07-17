/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceContext } from "./types";

export interface DNASuggestions {
  segmentName: string;
  widgets: string[];
  contextTabs: { id: string; label: string; icon?: string }[];
  kpis: { name: string; target: string; description: string }[];
  rituais: { name: string; description: string; frequency: string }[];
  dossies: { name: string; description: string }[];
  alertas: { title: string; description: string; priority: "low" | "medium" | "high" }[];
  acoesRecomendadas: { label: string; description: string; actionType: string }[];
}

/**
 * @deprecated Case compatibility engine. New workbook flows use
 * WorkspaceIntelligenceEngine and the selected ActiveDataset.
 */
export class WorkspaceDNAEngine {
  private static instance: WorkspaceDNAEngine;

  private constructor() {}

  public static getInstance(): WorkspaceDNAEngine {
    if (!WorkspaceDNAEngine.instance) {
      WorkspaceDNAEngine.instance = new WorkspaceDNAEngine();
    }
    return WorkspaceDNAEngine.instance;
  }

  /**
   * Determine DNA segment based on workspace context or project metadata.
   */
  public getSegment(context: WorkspaceContext): string {
    // If we have an active case with a specific segment/industry
    if (context.currentCase) {
      // Typically, project has a segment. Let's map it.
      const segmentLow = (context.segmento || "").toLowerCase();
      if (segmentLow.includes("agro") || segmentLow.includes("agricultura") || segmentLow.includes("safra")) {
        return "Agro";
      }
      if (segmentLow.includes("indústria") || segmentLow.includes("industria") || segmentLow.includes("fábrica") || segmentLow.includes("fabrica") || segmentLow.includes("manufatura")) {
        return "Indústria";
      }
      if (segmentLow.includes("serviço") || segmentLow.includes("servicos") || segmentLow.includes("tecnologia") || segmentLow.includes("consultoria")) {
        return "Serviços";
      }
    }
    
    // Default or check organization/workspace info
    return "Geral";
  }

  /**
   * Get suggestions for the current case DNA.
   */
  public getSuggestions(context: WorkspaceContext): DNASuggestions {
    const segment = this.getSegment(context);

    switch (segment) {
      case "Agro":
        return {
          segmentName: "Agronegócio",
          widgets: ["agro_production_widget", "agro_harvest_widget", "costs_margins_widget"],
          contextTabs: [
            { id: "resumo", label: "Cockpit Safra", icon: "LayoutGrid" },
            { id: "producao", label: "Produção & Safra", icon: "Sprout" },
            { id: "beneficiamento", label: "Beneficiamento", icon: "Factory" },
            { id: "exportacao", label: "Exportação", icon: "Ship" },
            { id: "custos_margem", label: "Margens & Custos", icon: "TrendingDown" }
          ],
          kpis: [
            { name: "Produtividade por Hectare", target: "75 sacas/ha", description: "Meta de rendimento da safra atual de soja" },
            { name: "Custo por saca (MOP)", target: "R$ 90,00", description: "Margem operacional de produção sob controle" },
            { name: "Aproveitamento de Safra", target: "98.5%", description: "Taxa mínima de perdas no beneficiamento" }
          ],
          rituais: [
            { name: "Revisão Diária de Colheita", description: "Alinhamento operacional com gerentes de fazenda", frequency: "Diário" },
            { name: "Comitê de Escoamento e Logística", description: "Análise de fretes e contratos de venda futuros", frequency: "Semanal" }
          ],
          dossies: [
            { name: "Dossiê Consolidado de Safra", description: "Relatório completo de produtividade, margem e custos logísticos por unidade agrícola." }
          ],
          alertas: [
            { title: "Custos de Frete Acima do Alvo", description: "O frete para escoamento subiu 12% nas últimas duas semanas.", priority: "high" },
            { title: "Janela Climática Estreita", description: "A previsão indica chuvas intensas que podem atrasar a colheita em 5 dias.", priority: "medium" }
          ],
          acoesRecomendadas: [
            { label: "Otimizar contratos de frete", description: "Bloquear taxas de frete com transportadoras homologadas para mitigar oscilação de safra.", actionType: "optimize_contracts" },
            { label: "Antecipar beneficiamento", description: "Acelerar processamento das unidades do setor sul para evitar perdas por umidade.", actionType: "accelerate_processing" }
          ]
        };

      case "Indústria":
        return {
          segmentName: "Indústria",
          widgets: ["factory_production_widget", "materials_inventory_widget", "efficiency_losses_widget"],
          contextTabs: [
            { id: "resumo", label: "Cockpit de Produção", icon: "LayoutGrid" },
            { id: "producao", label: "Produção Industrial", icon: "Factory" },
            { id: "materia_prima", label: "Matéria-Prima", icon: "Layers" },
            { id: "perdas_estoque", label: "Estoque & Perdas", icon: "AlertTriangle" },
            { id: "custos_margens", label: "Custo de Manufatura", icon: "Coins" }
          ],
          kpis: [
            { name: "OEE (Eficácia Geral do Equipamento)", target: "85%", description: "Disponibilidade, performance e qualidade agregada das linhas" },
            { name: "Índice de Retrabalho/Scrap", target: "< 1.5%", description: "Desperdício de matéria-prima por lote de produção" },
            { name: "Giro de Estoque de Insumos", target: "12 dias", description: "Tempo médio de retenção de matéria-prima crítica" }
          ],
          rituais: [
            { name: "Rito de Eficiência de Turno", description: "Reunião de 15 min nas trocas de turno para auditar paradas de máquina", frequency: "Diário" },
            { name: "Saneamento de Perdas Estruturais", description: "Comitê de engenharia para otimização de setup", frequency: "Semanal" }
          ],
          dossies: [
            { name: "Dossiê de OEE & Perdas Industriais", description: "Análise quantitativa de paradas programadas e não programadas de máquina e impacto na margem de contribuição." }
          ],
          alertas: [
            { title: "Parada Crítica na Linha Alpha", description: "A extrusora principal registrou oscilação térmica, reduzindo OEE em 8pp.", priority: "high" },
            { title: "Estoque Mínimo de Insumo Crítico", description: "Aço galvanizado atingiu ponto de pedido com lead time apertado.", priority: "medium" }
          ],
          acoesRecomendadas: [
            { label: "Executar manutenção corretiva preventiva", description: "Agendar parada técnica de 2h para balanceamento da resistência térmica na extrusora.", actionType: "maint_schedule" },
            { label: "Disparar rito de compras urgentes", description: "Sinalizar fornecedor B homologado para fornecimento spot de aço galvanizado.", actionType: "emergency_purchase" }
          ]
        };

      case "Serviços":
        return {
          segmentName: "Prestação de Serviços",
          widgets: ["recurring_contracts_widget", "team_productivity_widget", "margins_productivity_widget"],
          contextTabs: [
            { id: "resumo", label: "Cockpit de Contratos", icon: "LayoutGrid" },
            { id: "contratos", label: "Contratos & MRR", icon: "FileText" },
            { id: "equipe", label: "Performance de Equipe", icon: "Users" },
            { id: "receita_recorrente", label: "Receita Recorrente", icon: "TrendingUp" },
            { id: "produtividade_margens", label: "Produtividade", icon: "Award" }
          ],
          kpis: [
            { name: "MRR (Receita Recorrente Mensal)", target: "R$ 450.000", description: "Base consolidada de assinaturas e contratos ativos" },
            { name: "Utilização de Equipe (Billable)", target: "75%", description: "Percentual de horas da equipe alocadas diretamente em projetos de clientes" },
            { name: "Churn Rate Mensal", target: "< 1.0%", description: "Cancelamentos de contratos em relação à receita recorrente" }
          ],
          rituais: [
            { name: "Check-in Semanal de Alocação", description: "Revisão de timesheet e desvios de escopo de projetos", frequency: "Semanal" },
            { name: "Revisão de Satisfação e NPS", description: "Sessão trimestral de saúde de contas e renovação contratual", frequency: "Trimestral" }
          ],
          dossies: [
            { name: "Dossiê de Saúde de Carteira e Alocação", description: "Mapeamento detalhado de rentabilidade por contrato, horas consumidas vs orçadas e alocação consultiva." }
          ],
          alertas: [
            { title: "Contrato 'Red' por Alocação Excessiva", description: "O projeto Beta consumiu 120% das horas orçadas antes da entrega final.", priority: "high" },
            { title: "MRR Churn Potencial", description: "Dois contratos corporativos importantes entram em janela de renovação sem check-in realizado.", priority: "medium" }
          ],
          acoesRecomendadas: [
            { label: "Negociar aditivo de escopo", description: "Apresentar relatório de horas adicionais ao cliente Beta para validar novo faturamento.", actionType: "scope_addendum" },
            { label: "Sessão de alinhamento estratégico", description: "Agendar reuniões com os patrocinadores das contas a vencer para mitigar churn estrutural.", actionType: "client_relationship" }
          ]
        };

      default:
        return {
          segmentName: "Operação Geral",
          widgets: ["executive_brief", "maturity_index", "client_pulse", "responsaveis_destaque"],
          contextTabs: [
            { id: "resumo", label: "Cockpit Executivo", icon: "LayoutGrid" },
            { id: "financeiro", label: "Finanças & DRE", icon: "TrendingUp" },
            { id: "comercial", label: "Comercial & Responsáveis", icon: "ShoppingBag" },
            { id: "operacoes", label: "Operações & Serviços", icon: "Wrench" },
            { id: "estoque", label: "Estoque & Giro", icon: "Database" },
            { id: "comissoes", label: "Pessoas & Performance", icon: "Users" }
          ],
          kpis: [
            { name: "Volume Bruto Geral", target: "R$ 3.8M", description: "Faturamento consolidado das linhas comerciais" },
            { name: "Margem de Contribuição", target: "35%", description: "Margem média gerada pelas linhas mapeadas" },
            { name: "Absorção Operacional", target: "60%", description: "Percentual de custos fixos cobertos por receitas operacionais" }
          ],
          rituais: [
            { name: "Rito de Fechamento Comercial", description: "Revisão diária do pipeline e propostas", frequency: "Diário" },
            { name: "Análise de Giro de Estoque", description: "Revisão de itens com maior tempo de permanência para reprecificação", frequency: "Semanal" }
          ],
          dossies: [
            { name: "Dossiê Consolidado de Unidade", description: "Análise integrada de desempenho comercial, operação, estoque, comissões e despesas fixas." }
          ],
          alertas: [
            { title: "Absorção Operacional em Queda", description: "Receitas operacionais cobriram 48% das despesas fixas no período analisado.", priority: "high" },
            { title: "Giro de Estoque Elevado", description: "Itens de baixo giro atingiram média de 52 dias contra alvo de 40 dias.", priority: "medium" }
          ],
          acoesRecomendadas: [
            { label: "Campanha de reativação", description: "Ativar base inativa de clientes para impulsionar fluxo operacional.", actionType: "service_marketing" },
            { label: "Campanha de bônus por giro", description: "Oferecer incentivo adicional aos responsáveis comerciais para itens com alto tempo de permanência.", actionType: "stock_bonus" }
          ]
        };
    }
  }
}

export const workspaceDNAEngine = WorkspaceDNAEngine.getInstance();
export default workspaceDNAEngine;
