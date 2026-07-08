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
          conclusion: "Superávit operacional mantido acima da meta histórica de 12.5%.",
          defaultIndicators: [
            { label: "Faturamento Bruto", value: "R$ 48.2M", trend: "+8.2%", isPositive: true },
            { label: "Margem EBITDA", value: "14.2%", trend: "+1.5%", isPositive: true },
          ],
          defaultBlocks: [
            { type: "kpi", title: "Metas Consolidadas", content: { value: "R$ 48.200.000" } },
            { type: "narrative", title: "Visão do Presidente", content: { text: "Grupo mantém crescimento contínuo suportado pelo varejo premium." } },
          ],
        },
        {
          title: "Governança e ESG",
          objective: "Apresentar auditoria de integridade e indicadores socioambientais e de compliance.",
          evidence: "Laudos do comitê independente de ética e auditoria interna.",
          conclusion: "Zero desvios ou passivos regulatórios identificados no ciclo fiscal.",
          defaultIndicators: [
            { label: "Índice de Compliance", value: "99.8%", trend: "+0.2%", isPositive: true },
          ],
          defaultBlocks: [
            { type: "insight", title: "Análise de Riscos", content: { text: "Mitigação tributária regional finalizada com sucesso." } },
          ],
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
          conclusion: "Atrasos em projetos do pós-venda superados.",
          defaultIndicators: [
            { label: "Projetos no Prazo", value: "91%", trend: "+3%", isPositive: true },
          ],
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
          conclusion: "Funil saudável, com melhora acentuada na prospecção via WhatsApp.",
          defaultIndicators: [
            { label: "Média CSAT", value: "4.7 / 5.0", trend: "+0.3", isPositive: true },
            { label: "Conversão Leads", value: "8.4%", trend: "-0.5%", isPositive: false },
          ],
          defaultBlocks: [
            { type: "chart", title: "Evolução do Funil", content: { data: [{ step: "Leads", count: 1200 }, { step: "Contatos", count: 600 }, { step: "Propostas", count: 150 }] } },
          ],
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
          conclusion: "Redução de 4.2% em despesas discricionárias administrativas.",
          defaultIndicators: [
            { label: "Receita Líquida", value: "R$ 15.4M", trend: "+12%", isPositive: true },
            { label: "Despesas Operacionais", value: "R$ 2.1M", trend: "-4.2%", isPositive: true },
          ],
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
          objective: "Reduzir o tempo médio de permanência de veículos no showroom.",
          evidence: "Gargalos de pátio e tempos de transporte rodoviário.",
          conclusion: "Modelos populares apresentam giro rápido; importados demandam atenção comercial.",
          defaultIndicators: [
            { label: "Lead Time Entrega", value: "12 Dias", trend: "-2 Dias", isPositive: true },
          ],
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
          conclusion: "Todas as importações do período possuem link direto e correspondência celular válida.",
          defaultIndicators: [
            { label: "Documentos Auditados", value: "100%", trend: "Estável", isPositive: true },
          ],
          defaultBlocks: [],
        },
      ],
    });

    // 7. Automotivo (Automotive Showroom)
    this.registerTemplate({
      id: "automativo",
      name: "Performance de Showroom Automotivo",
      description: "Especializado para concessionárias: vendas de novos, seminovos, F&I e autopeças.",
      category: "Setorial",
      chapters: [
        {
          title: "Venda de Veículos Novos & Seminovos",
          objective: "Consolidar o market share de emplacamentos e giro de estoque de pátio.",
          evidence: "Painel de emplacamentos regionais da associação comercial.",
          conclusion: "Domínio regional mantido com 34% de market share.",
          defaultIndicators: [
            { label: "Unidades Novas", value: "142", trend: "+12", isPositive: true },
            { label: "Margem Média Seminovos", value: "8.7%", trend: "-0.3%", isPositive: false },
          ],
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
          conclusion: "Condições climáticas favoráveis impulsionam projeção de sacas.",
          defaultIndicators: [
            { label: "Sacas/Hectare", value: "78", trend: "+4", isPositive: true },
          ],
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
          objective: "Maximizar a produtividade dos equipamentos na linha de montagem premium.",
          evidence: "Sensores IoT e diário de bordo dos operadores de turno.",
          conclusion: "Paradas preventivas reduziram tempo de inatividade não planejado em 15%.",
          defaultIndicators: [
            { label: "OEE Consolidado", value: "84.5%", trend: "+2.1%", isPositive: true },
          ],
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
          conclusion: "NPS de excelência mantido; foco em mitigar pequenos picos de churn tático.",
          defaultIndicators: [
            { label: "NPS do Grupo", value: "78", trend: "+2", isPositive: true },
            { label: "Horas Faturadas", value: "1,240h", trend: "+140h", isPositive: true },
          ],
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
