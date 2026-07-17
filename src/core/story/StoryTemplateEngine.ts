/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story } from "./types";
import { StoryBuilder } from "./StoryBuilder";

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  chapters: {
    title: string;
    objective: string;
    evidence: string;
    conclusion: string;
    defaultIndicators: { label: string; value: string; trend?: string; isPositive?: boolean }[];
    defaultBlocks: { type: string; title: string; content: any }[];
  }[];
}

export class StoryTemplateEngine {
  private templates: Map<string, StoryTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates(): void {
    // 1. Conselho (Board Meeting)
    this.registerTemplate({
      id: "conselho",
      name: "Reunião de Conselho Executivo",
      description: "Alinhamento de alta governança, balanço patrimonial e decisões regulatórias de macroestrutura.",
      category: "Estratégico",
      chapters: [
        {
          title: "Resultados Macro & EBITDA",
          objective: "Avaliar a rentabilidade consolidada do grupo frente às diretrizes de capital social.",
          evidence: "Fechamento DRE consolidado auditado externamente.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
        {
          title: "Governança e ESG",
          objective: "Apresentar auditoria de integridade e indicadores socioambientais e de compliance.",
          evidence: "Laudos do comitê independente de ética e auditoria interna.",
          conclusion: "Zero desvios ou passivos regulatórios identificados no ciclo fiscal.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
      ],
    });

    // 2. Diretoria (Executive Directory)
    this.registerTemplate({
      id: "diretoria",
      name: "Alinhamento Semanal de Diretoria",
      description: "Integração ágil das verticais operacionais e acompanhamento tático de metas e despesas.",
      category: "Estratégico",
      chapters: [
        {
          title: "Acompanhamento Tático de Verticais",
          objective: "Garantir consistência na execução do plano anual entre os diretores de área.",
          evidence: "Relatórios de status consolidados semanalmente pelas gerências.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [
            { type: "table", title: "Gargalos por Área", content: { headers: ["Área", "Status", "Severidade"], rows: [["Vendas", "No Prazo", "Baixa"], ["Pós-Venda", "Recuperando", "Média"]] } },
          ],
        },
      ],
    });

    // 3. Comercial (Commercial/Sales)
    this.registerTemplate({
      id: "comercial",
      name: "Comercial e Performance de Vendas",
      description: "Monitoramento de funil, conversões de propostas, satisfação (CSAT) e metas de comissão.",
      category: "Comercial",
      chapters: [
        {
          title: "Funil e Taxas de Conversão",
          objective: "Otimizar o fluxo de leads do CRM digital até o fechamento de faturamento físico.",
          evidence: "Extração direta das tabelas do funil de marketing e propostas.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
      ],
    });

    // 4. Financeiro (Financial DRE)
    this.registerTemplate({
      id: "financeiro",
      name: "Balanço DRE e Saúde Financeira",
      description: "Análise profunda de receitas, despesas administrativas, custos operacionais e fluxo de caixa.",
      category: "Financeiro",
      chapters: [
        {
          title: "DRE Consolidado do Período",
          objective: "Auditar desvios de despesas fixas e variáveis contra o orçamento planejado.",
          evidence: "Sistemas contábeis integrados ao Sauron OS.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [
            { type: "divider", title: "", content: {} },
          ],
        },
      ],
    });

    // 5. Operações (Operations backlog)
    this.registerTemplate({
      id: "operacoes",
      name: "Revisão de Operações e Logística",
      description: "Logística, giro de estoque, eficiência operacional de pátio e atendimento.",
      category: "Operacional",
      chapters: [
        {
          title: "Giro de Estoque e Lead Time",
          objective: "Reduzir o tempo médio de permanência de itens no estoque.",
          evidence: "Gargalos de pátio e tempos de transporte rodoviário.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
      ],
    });

    // 6. Auditoria (Audit & Risk Compliance)
    this.registerTemplate({
      id: "auditoria",
      name: "Auditoria Interna de Processos",
      description: "Métricas de conformidade regulatória, assinaturas de contratos e integridade de faturamento.",
      category: "Compliance",
      chapters: [
        {
          title: "Conformidade e Selo de Dados",
          objective: "Auditar o fluxo de importação e rastreabilidade dos lançamentos fiscais.",
          evidence: "Traces de data lineage coletados pelo auditor de sistema.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
      ],
    });

    // 7. Operação especializada
    this.registerTemplate({
      id: "operacao_especializada",
      name: "Performance de Operação Especializada",
      description: "Especializado para vendas, giro, margem e categorias adicionais.",
      category: "Setorial",
      chapters: [
        {
          title: "Venda de Linhas Comerciais",
          objective: "Consolidar market share e giro de estoque.",
          evidence: "Painel regional da associação comercial.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
      ],
    });

    // 8. Agro (Agribusiness)
    this.registerTemplate({
      id: "agro",
      name: "Planejamento e Operações do Agro",
      description: "Monitoramento de safras, insumos, maquinários pesados e contratos de commodities.",
      category: "Setorial",
      chapters: [
        {
          title: "Safra e Eficiência de Insumos",
          objective: "Acompanhar a produtividade por hectare e controle de despesas agrícolas.",
          evidence: "Laudos técnicos do agrônomo de campo.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
      ],
    });

    // 9. Indústria (Industry Operations)
    this.registerTemplate({
      id: "industria",
      name: "Gestão Industrial e Chão de Fábrica",
      description: "OEE de maquinários, desperdícios, produtividade de turnos e paradas de fábrica.",
      category: "Setorial",
      chapters: [
        {
          title: "Eficiência OEE e Paradas",
          objective: "Maximizar a produtividade dos equipamentos na linha operacional.",
          evidence: "Sensores IoT e diário de bordo dos operadores de turno.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
      ],
    });

    // 10. Serviços (Services Delivery)
    this.registerTemplate({
      id: "servicos",
      name: "Consultoria e Entrega de Serviços",
      description: "Métricas de contratos de sustentação, satisfação NPS, churn e horas faturadas.",
      category: "Setorial",
      chapters: [
        {
          title: "Entrega de Horas e Satisfação NPS",
          objective: "Garantir a retenção de contratos corporativos de longa duração.",
          evidence: "Pesquisas trimestrais de fidelidade e tempos de projeto.",
          conclusion: "Indicadores pendentes de fonte real e mapeamento do período.",
          defaultIndicators: [],
          defaultBlocks: [],
        },
      ],
    });
  }

  public registerTemplate(template: StoryTemplate): void {
    this.templates.set(template.id, template);
  }

  public getTemplates(): StoryTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplate(id: string): StoryTemplate | undefined {
    return this.templates.get(id);
  }

  public createStoryFromTemplate(templateId: string, title: string, subtitle: string): Story {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template com ID '${templateId}' não localizado no sistema.`);
    }

    const builder = new StoryBuilder(title, subtitle, templateId);
    
    template.chapters.forEach((ch, idx) => {
      builder.addChapter(ch.title, {
        objective: ch.objective,
        evidence: ch.evidence,
        conclusion: ch.conclusion,
      });

      ch.defaultIndicators.forEach((ind) => {
        builder.addIndicatorToChapter(idx, ind.label, ind.value, ind.trend, ind.isPositive);
      });

      ch.defaultBlocks.forEach((bl) => {
        builder.addBlockToChapter(idx, bl.type as any, bl.title, bl.content);
      });
    });

    return builder.build();
  }
}

export const storyTemplateEngine = new StoryTemplateEngine();
