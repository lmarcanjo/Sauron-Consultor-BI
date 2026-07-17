export interface Department {
  id: string;
  name: string;
}

export interface CostCenter {
  id: string;
  name: string;
  departments?: string[]; // IDs of departments
  analyticalClassifications?: string[]; // E.g., for F&I
}

export interface Metric {
  id: string;
  name: string;
  format: "currency" | "percent" | "number" | "hours";
}

export interface KPI {
  id: string;
  name: string;
  metricId: string;
}

export interface Dashboard {
  id: string;
  name: string;
  kpis: string[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  columns: string[];
}

export interface IndustryTemplate {
  id: string;
  name: string;
  icon: string;
  departments: Department[];
  costCenters: CostCenter[];
  reports: ReportDefinition[];
  metrics: Metric[];
  dashboards: Dashboard[];
  kpis: KPI[];
}

export const automotiveTemplate: IndustryTemplate = {
  id: "automotive",
  name: "Operação Especializada",
  icon: "Car",
  departments: [
    { id: "linha_a", name: "Linha Comercial A" },
    { id: "linha_b", name: "Linha Comercial B" },
    { id: "consorcio", name: "Consórcio" },
    { id: "fei", name: "F&I (FNA)" },
    { id: "linha_c", name: "Linha Comercial C" },
    { id: "produtos", name: "Produtos" },
    { id: "acessorios", name: "Acessórios" },
    { id: "servicos", name: "Serviços" },
    { id: "operacoes", name: "Operações" },
    { id: "administrativo", name: "Administrativo" },
    { id: "financeiro", name: "Financeiro" },
    { id: "diretoria", name: "Diretoria" },
  ],
  costCenters: [
    { id: "cc_linha_a", name: "Linha Comercial A", departments: ["linha_a"] },
    { id: "cc_linha_b", name: "Linha Comercial B", departments: ["linha_b"] },
    { id: "cc_consorcio", name: "Consórcio", departments: ["consorcio"] },
    { id: "cc_fei", name: "F&I (FNA)", departments: ["fei"], analyticalClassifications: ["Receita de Financiamentos", "Receita de Seguros", "Receitas Financeiras Diversas", "Outras Receitas de F&I"] },
    { id: "cc_linha_c", name: "Linha Comercial C", departments: ["linha_c"] },
    { id: "cc_produtos", name: "Produtos", departments: ["produtos"], analyticalClassifications: ["Vendas Diretas", "Serviços Relacionados", "Produtos Complementares"] },
    { id: "cc_acessorios", name: "Acessórios", departments: ["acessorios"] },
    { id: "cc_servicos", name: "Serviços", departments: ["servicos"] },
    { id: "cc_operacoes", name: "Operações", departments: ["operacoes"] },
    { id: "cc_administrativo", name: "Administrativo", departments: ["administrativo"] },
    { id: "cc_financeiro", name: "Financeiro", departments: ["financeiro"], analyticalClassifications: ["Aplicações", "Rendimentos", "Venda de Imobilizados", "Recuperações de Créditos", "Receitas Financeiras", "Juros", "IOF", "Despesas Bancárias", "Cartões", "Empréstimos", "Financiamentos", "Despesas Não Operacionais"] },
    { id: "cc_diretoria", name: "Diretoria", departments: ["diretoria"], analyticalClassifications: ["Pró-labore", "Distribuições", "Despesas Particulares dos Sócios", "Despesas Extraordinárias", "Ajustes de Sócios"] },
  ],
  metrics: [
    { id: "unidades_vendidas", name: "Unidades Vendidas", format: "number" },
    { id: "faturamento", name: "Faturamento", format: "currency" },
    { id: "margem", name: "Margem", format: "percent" },
    { id: "ticket_medio", name: "Ticket Médio", format: "currency" },
    { id: "giro", name: "Giro", format: "number" },
    { id: "horas_vendidas", name: "Horas Vendidas", format: "hours" },
    { id: "produtividade", name: "Produtividade", format: "percent" }
  ],
  kpis: [
    { id: "kpi_fat_linha_a", name: "Faturamento Linha Comercial A", metricId: "faturamento" },
    { id: "kpi_margem_linha_a", name: "Margem Linha Comercial A", metricId: "margem" }
  ],
  dashboards: [
    { id: "dash_linha_a", name: "Dashboard Linha Comercial A", kpis: ["kpi_fat_linha_a", "kpi_margem_linha_a"] }
  ],
  reports: [
    { id: "rep_linha_a", name: "Relatório Linha Comercial A", columns: ["unidades_vendidas", "faturamento", "margem", "ticket_medio", "receita_por_vendedor", "conversao"] },
    { id: "rep_linha_b", name: "Relatório Linha Comercial B", columns: ["faturamento", "ticket_medio", "margem", "grandes_clientes"] },
    { id: "rep_consorcio", name: "Relatório Consórcio", columns: ["cotas_vendidas", "receita", "comissoes", "conversao"] },
    { id: "rep_fei", name: "Relatório F&I (FNA)", columns: ["receita_financeira", "financiamentos", "seguros", "outras_receitas"] },
    { id: "rep_linha_c", name: "Relatório Linha Comercial C", columns: ["giro", "aging", "lucro_por_unidade", "ticket_medio", "dias_em_estoque"] },
    { id: "rep_produtos", name: "Relatório Produtos", columns: ["receita", "margem", "giro", "produtos_mais_vendidos"] },
    { id: "rep_acessorios", name: "Relatório Acessórios", columns: ["receita", "margem", "ticket_medio", "produtos_mais_vendidos"] },
    { id: "rep_servicos", name: "Relatório Serviços", columns: ["horas_vendidas", "produtividade", "mao_de_obra", "ticket_medio"] },
    { id: "rep_operacoes", name: "Relatório Operações", columns: ["receita", "produtividade", "margem", "ticket_medio"] }
  ]
};

export const agroTemplate: IndustryTemplate = {
  id: "agro",
  name: "Agronegócio",
  icon: "Tractor", // or Sprout, Wheat
  departments: [
    { id: "plantio", name: "Plantio" },
    { id: "cultivo", name: "Cultivo" },
    { id: "colheita", name: "Colheita" },
    { id: "beneficiamento", name: "Beneficiamento" },
    { id: "embalagem", name: "Embalagem" },
    { id: "armazenamento", name: "Armazenamento" },
    { id: "exportacao", name: "Exportação" }
  ],
  costCenters: [
    { id: "cc_mamao", name: "Mamão", departments: ["plantio", "cultivo", "colheita"] },
    { id: "cc_soja", name: "Soja", departments: ["plantio", "cultivo", "colheita"] },
    { id: "cc_cafe", name: "Café", departments: ["plantio", "cultivo", "colheita"] }
  ],
  metrics: [
    { id: "producao_ha", name: "Produção por Hectare", format: "number" },
    { id: "produtividade", name: "Produtividade", format: "number" },
    { id: "custos", name: "Custos", format: "currency" },
    { id: "receita", name: "Receita", format: "currency" },
    { id: "margem", name: "Margem", format: "percent" },
    { id: "perdas", name: "Perdas", format: "number" },
    { id: "estoque", name: "Estoque", format: "number" },
    { id: "exportacoes", name: "Exportações", format: "currency" }
  ],
  kpis: [],
  dashboards: [],
  reports: []
};

export const serviceProviderTemplate: IndustryTemplate = {
  id: "services",
  name: "Prestadores de Serviço",
  icon: "Briefcase",
  departments: [
    { id: "consultoria", name: "Consultorias" },
    { id: "clinicas", name: "Clínicas" },
    { id: "escritorios", name: "Escritórios" },
    { id: "ti", name: "TI" },
    { id: "advocacia", name: "Advocacia" }
  ],
  costCenters: [],
  metrics: [
    { id: "horas_vendidas", name: "Horas Vendidas", format: "hours" },
    { id: "horas_produtivas", name: "Horas Produtivas", format: "hours" },
    { id: "ticket_medio", name: "Ticket Médio", format: "currency" },
    { id: "receita_recorrente", name: "Receita Recorrente", format: "currency" },
    { id: "rentabilidade", name: "Rentabilidade", format: "percent" },
    { id: "custo_colaborador", name: "Custo por Colaborador", format: "currency" }
  ],
  kpis: [],
  dashboards: [],
  reports: []
};

export const industryTemplateDefinition: IndustryTemplate = {
  id: "industry",
  name: "Indústria",
  icon: "Factory",
  departments: [
    { id: "materia_prima", name: "Matéria-prima" },
    { id: "producao", name: "Produção" },
    { id: "estoque", name: "Estoque" },
    { id: "expedicao", name: "Expedição" },
    { id: "venda", name: "Venda" }
  ],
  costCenters: [
    { id: "cc_blocos", name: "Blocos" },
    { id: "cc_pisos", name: "Pisos" },
    { id: "cc_artefatos_cimento", name: "Artefatos de Cimento" }
  ],
  metrics: [
    { id: "consumo_cimento", name: "Consumo de Cimento", format: "number" },
    { id: "custo_producao", name: "Custo de Produção", format: "currency" },
    { id: "perdas", name: "Perdas", format: "number" },
    { id: "capacidade_produtiva", name: "Capacidade Produtiva", format: "number" },
    { id: "margem", name: "Margem", format: "percent" },
    { id: "estoque", name: "Estoque", format: "number" },
    { id: "receita", name: "Receita", format: "currency" },
    { id: "rentabilidade", name: "Rentabilidade", format: "percent" }
  ],
  kpis: [],
  dashboards: [],
  reports: []
};

export const availableTemplates: IndustryTemplate[] = [
  automotiveTemplate,
  agroTemplate,
  serviceProviderTemplate,
  industryTemplateDefinition
];
