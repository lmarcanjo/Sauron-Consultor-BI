/**
 * tests/fixtures/generators/generateIndustryWorkbook.ts
 * Gerador para setor industrial/manufatura.
 */
import path from "path";
import fs from "fs";
import type { GeneratedFixture } from "./index";

function rand(min: number, max: number, dec = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

export async function generateIndustryWorkbook(outputDir?: string): Promise<GeneratedFixture> {
  const dir = outputDir ?? path.resolve(process.cwd(), "tests/fixtures/generated/industry");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "industria_teste.xlsx");

  const linhas = ["Linha A", "Linha B", "Linha C"];
  const produtos = ["Componente X", "Peça Y", "Módulo Z", "Kit W"];
  const vendedores = ["Rafael Oliveira", "Simone Ramos", "Tiago Pereira"];
  const meses = ["Jan/25", "Fev/25", "Mar/25", "Abr/25", "Mai/25"];

  const rows: Record<string, any>[] = [];
  let totalReceita = 0, totalCusto = 0, totalComissao = 0;
  const vendSet = new Set<string>();

  for (let i = 0; i < 60; i++) {
    const linhaProd = linhas[i % linhas.length];
    const produto = produtos[i % produtos.length];
    const vendedor = vendedores[i % vendedores.length];
    const mes = meses[i % meses.length];
    const qtd = Math.floor(rand(50, 5000, 0));
    const precoUnit = rand(10, 200);
    const receita = parseFloat((qtd * precoUnit).toFixed(2));
    const custo = parseFloat((receita * rand(0.4, 0.7)).toFixed(2));
    const despesa = parseFloat((receita * rand(0.05, 0.15)).toFixed(2));
    const lucro = parseFloat((receita - custo - despesa).toFixed(2));
    const margem = parseFloat((lucro / receita * 100).toFixed(2));
    const comissao = parseFloat((receita * 0.01).toFixed(2));

    totalReceita += receita;
    totalCusto += custo;
    totalComissao += comissao;
    vendSet.add(vendedor);

    rows.push({
      Empresa: "Indústria Modelo SA",
      CNPJ: "55.666.777/0001-88",
      "Linha de Produção": linhaProd,
      Produto: produto,
      Mês: mes,
      "Qtd. Produzida": qtd,
      "Preço Unitário": precoUnit,
      Receita: receita,
      Custo: custo,
      Despesa: despesa,
      Lucro: lucro,
      Margem: margem,
      Vendedor: vendedor,
      Comissão: comissao,
    });
  }

  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produção");
  XLSX.writeFile(wb, filePath);

  return {
    filePath,
    fileName: "industria_teste.xlsx",
    format: "xlsx",
    expectedMetrics: {
      receita: parseFloat(totalReceita.toFixed(2)),
      custo: parseFloat(totalCusto.toFixed(2)),
      margem: parseFloat(((totalReceita - totalCusto) / totalReceita * 100).toFixed(2)),
      comissao: parseFloat(totalComissao.toFixed(2)),
      vendedores: vendSet.size,
      ticketMedio: parseFloat((totalReceita / 60).toFixed(2)),
      totalLinhas: rows.length,
      totalColunas: 14,
    },
    expectedMappings: {
      Receita: "receita", Custo: "custo", Despesa: "custo",
      Vendedor: "vendedor", Mês: "data", Empresa: "empresa",
    },
    expectedSheets: ["Produção"],
    sector: "industria",
  };
}
