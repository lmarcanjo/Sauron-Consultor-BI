/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LancamentoFinanceiro {
  id?: string;
  Grupo: string;
  CNPJ: string;
  Marca: string;
  Empresa: string;
  Filial: string;
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
  grupos: string[];
  cnpjs: string[];
  marcas: string[];
  meses: string[];
  razoes: string[];
}
