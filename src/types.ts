/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LancamentoFinanceiro {
  id?: string;
  // Common mandatory / legacy fields
  Grupo: string;
  CNPJ: string;
  Marca: string;
  Empresa: string;
  Filial?: string; // Legacy
  Vendedor?: string;
  Mês: string;
  Razão: string;
  Categoria: string;
  Receita: number;
  Custo: number;
  Despesa: number;
  Lucro: number;
  Margem: number;
  Departamento?: string;
  ContaContabil?: string;
  Orcamento?: number;

  // New Intelligent DRE / Multi-segment mandatory fields (optional to keep compatibility for old data)
  Data?: string;
  Loja?: string;
  CentroDeCusto?: string;
  CodigoConta?: string;
  NomeConta?: string;
  DescricaoLancamento?: string;
  Valor?: number;
  Origem?: string;
  DocumentoFiscal?: string;
  Usuario?: string;
  Competencia?: string;
  TipoMovimento?: string;
  Observacoes?: string;
  [key: string]: any; // Allow dynamic fields from CSV
}

export interface MetricasConsolidadas {
  receitaTotal: number;
  custoTotal: number;
  despesaTotal: number;
  lucroTotal: number;
  margemMedia: number;
  porMarca: { marca: string; receita: number; lucro: number; margem: number }[];
  porCnpj: { cnpj: string; empresa: string; receita: number; lucro: number; margem: number }[];
  porRazao: { razao: string; despesa: number; participacao: number }[];
  porMes: { mes: string; lucro: number; receita: number; ordem: number }[];
}

export interface FiltrosDashboard {
  grupos?: string[];
  cnpjs?: string[];
  marcas?: string[];
  meses?: string[];
  razoes?: string[];
  [key: string]: string[] | undefined;
}

export type ActiveDataSourceType = "SPREADSHEET_DATA" | "DATABASE_DATA" | "CONSULTANT_DATA" | "MIXED_APPROVED_DATA";
