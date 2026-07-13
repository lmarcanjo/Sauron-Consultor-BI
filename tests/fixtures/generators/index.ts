/**
 * tests/fixtures/generators/index.ts
 *
 * Ponto de entrada dos geradores de fixtures.
 * Cada gerador produz um arquivo XLSX ou CSV real
 * com os dados de teste + metadados esperados.
 *
 * Os arquivos são gerados em:
 *   tests/fixtures/generated/<sector>/
 *
 * Não contêm dados confidenciais.
 * São regenerados a cada execução dos testes E2E.
 */

export { generateAgribusinessWorkbook } from "./generateAgribusinessWorkbook";
export { generateRetailWorkbook } from "./generateRetailWorkbook";
export { generateIndustryWorkbook } from "./generateIndustryWorkbook";
export { generateAutomotiveWorkbook } from "./generateAutomotiveWorkbook";
export { generateServicesWorkbook } from "./generateServicesWorkbook";

export interface GeneratedFixture {
  /** Caminho absoluto do arquivo gerado */
  filePath: string;
  /** Nome do arquivo */
  fileName: string;
  /** Formato: 'xlsx' | 'csv' */
  format: "xlsx" | "csv";
  /** Métricas esperadas para validação */
  expectedMetrics: {
    receita: number;
    custo: number;
    margem: number;
    comissao: number;
    vendedores: number;
    ticketMedio: number;
    totalLinhas: number;
    totalColunas: number;
  };
  /** Mapeamentos esperados de colunas */
  expectedMappings: Record<string, "receita" | "custo" | "despesa" | "vendedor" | "data" | "produto" | "empresa">;
  /** Abas esperadas */
  expectedSheets: string[];
  /** Setor do negócio */
  sector: string;
}
