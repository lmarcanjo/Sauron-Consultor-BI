/**
 * tests/fixtures/generators/generateRetailWorkbook.ts
 * Gerador para setor de varejo/lojas.
 * 60 linhas de 3 lojas, 4 vendedores, produtos de conveniência.
 */
import path from "path";
import fs from "fs";
import type { GeneratedFixture } from "./index";

const LOJAS = [
  { nome: "Loja Centro", empresa: "Rede Varejo SA", cnpj: "44.555.666/0001-77" },
  { nome: "Loja Norte", empresa: "Rede Varejo SA", cnpj: "44.555.666/0002-58" },
  { nome: "Loja Sul", empresa: "Rede Varejo SA", cnpj: "44.555.666/0003-39" },
];
const PRODUTOS = ["Eletrônico A", "Roupa B", "Alimento C", "Cosmético D", "Ferramenta E"];
const VENDEDORES = ["Ana Lima", "Bruno Faria", "Carla Dias", "Diego Nunes"];
const MESES = ["Jan/25", "Fev/25", "Mar/25", "Abr/25", "Mai/25", "Jun/25"];

function rand(min: number, max: number, dec = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

export async function generateRetailWorkbook(outputDir?: string): Promise<GeneratedFixture> {
  const dir = outputDir ?? path.resolve(process.cwd(), "tests/fixtures/generated/retail");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "varejo_teste.xlsx");

  const rows: Record<string, any>[] = [];
  let totalReceita = 0;
  let totalCusto = 0;
  let totalComissao = 0;
  const vendedoresSet = new Set<string>();

  for (let i = 0; i < 60; i++) {
    const loja = LOJAS[i % LOJAS.length];
    const produto = PRODUTOS[i % PRODUTOS.length];
    const vendedor = VENDEDORES[i % VENDEDORES.length];
    const mes = MESES[i % MESES.length];
    const qtd = Math.floor(rand(10, 200, 0));
    const precoUnit = rand(20, 500);
    const receita = parseFloat((qtd * precoUnit).toFixed(2));
    const custo = parseFloat((receita * rand(0.35, 0.60)).toFixed(2));
    const margem = parseFloat(((receita - custo) / receita * 100).toFixed(2));
    const comissao = parseFloat((receita * 0.02).toFixed(2));
    const ticketMedio = parseFloat((receita / qtd).toFixed(2));

    totalReceita += receita;
    totalCusto += custo;
    totalComissao += comissao;
    vendedoresSet.add(vendedor);

    rows.push({
      Empresa: loja.empresa,
      Loja: loja.nome,
      CNPJ: loja.cnpj,
      Mês: mes,
      Produto: produto,
      "Qtd. Vendida": qtd,
      "Preço Unitário": precoUnit,
      Receita: receita,
      Custo: custo,
      Margem: margem,
      Vendedor: vendedor,
      Comissão: comissao,
      "Ticket Médio": ticketMedio,
    });
  }

  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vendas");
  const wsDRE = XLSX.utils.json_to_sheet([
    { Indicador: "Receita Bruta", Valor: parseFloat(totalReceita.toFixed(2)) },
    { Indicador: "Custo Total", Valor: parseFloat(totalCusto.toFixed(2)) },
    { Indicador: "Lucro Bruto", Valor: parseFloat((totalReceita - totalCusto).toFixed(2)) },
    { Indicador: "Comissões", Valor: parseFloat(totalComissao.toFixed(2)) },
  ]);
  XLSX.utils.book_append_sheet(wb, wsDRE, "DRE");
  XLSX.writeFile(wb, filePath);

  return {
    filePath,
    fileName: "varejo_teste.xlsx",
    format: "xlsx",
    expectedMetrics: {
      receita: parseFloat(totalReceita.toFixed(2)),
      custo: parseFloat(totalCusto.toFixed(2)),
      margem: parseFloat(((totalReceita - totalCusto) / totalReceita * 100).toFixed(2)),
      comissao: parseFloat(totalComissao.toFixed(2)),
      vendedores: vendedoresSet.size,
      ticketMedio: parseFloat((totalReceita / 60).toFixed(2)),
      totalLinhas: rows.length,
      totalColunas: 13,
    },
    expectedMappings: {
      Receita: "receita", Custo: "custo", Vendedor: "vendedor",
      Mês: "data", Empresa: "empresa", Produto: "produto",
    },
    expectedSheets: ["Vendas", "DRE"],
    sector: "varejo",
  };
}
