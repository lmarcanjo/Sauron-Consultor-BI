/**
 * tests/fixtures/generators/generateAutomotiveWorkbook.ts
 * Gerador para setor automotivo (concessionárias/revendas).
 */
import path from "path";
import fs from "fs";
import type { GeneratedFixture } from "./index";

function rand(min: number, max: number, dec = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

export async function generateAutomotiveWorkbook(outputDir?: string): Promise<GeneratedFixture> {
  const dir = outputDir ?? path.resolve(process.cwd(), "tests/fixtures/generated/automotive");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "automotivo_teste.xlsx");

  const concessionarias = [
    { nome: "Concessionária Norte", empresa: "Grupo Auto SA", cnpj: "66.777.888/0001-99" },
    { nome: "Concessionária Sul", empresa: "Grupo Auto SA", cnpj: "66.777.888/0002-70" },
  ];
  const modelos = ["Sedan Premium", "SUV Sport", "Pickup Work", "Hatch City", "Van Cargo"];
  const vendedores = ["Gustavo Melo", "Helena Vieira", "Igor Rocha", "Juliana Pinto"];
  const meses = ["Jan/25", "Fev/25", "Mar/25", "Abr/25", "Mai/25", "Jun/25"];

  const rows: Record<string, any>[] = [];
  let totalReceita = 0, totalCusto = 0, totalComissao = 0;
  const vendSet = new Set<string>();

  for (let i = 0; i < 60; i++) {
    const conc = concessionarias[i % concessionarias.length];
    const modelo = modelos[i % modelos.length];
    const vendedor = vendedores[i % vendedores.length];
    const mes = meses[i % meses.length];
    const qtd = Math.floor(rand(1, 20, 0));
    const precoUnit = rand(60000, 250000);
    const receita = parseFloat((qtd * precoUnit).toFixed(2));
    const custo = parseFloat((receita * rand(0.7, 0.88)).toFixed(2));
    const despesa = parseFloat((receita * rand(0.02, 0.06)).toFixed(2));
    const lucro = parseFloat((receita - custo - despesa).toFixed(2));
    const margem = parseFloat((lucro / receita * 100).toFixed(2));
    const comissao = parseFloat((receita * 0.025).toFixed(2));

    totalReceita += receita;
    totalCusto += custo;
    totalComissao += comissao;
    vendSet.add(vendedor);

    rows.push({
      Empresa: conc.empresa,
      Concessionária: conc.nome,
      CNPJ: conc.cnpj,
      Mês: mes,
      Modelo: modelo,
      "Qtd. Vendida": qtd,
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
  const wsComissoes = XLSX.utils.json_to_sheet(
    vendedores.map((v) => {
      const vendRows = rows.filter((r) => r.Vendedor === v);
      const totalVend = vendRows.reduce((acc, r) => acc + r.Receita, 0);
      const totalComVend = vendRows.reduce((acc, r) => acc + r.Comissão, 0);
      return {
        Vendedor: v,
        "Total Vendas": parseFloat(totalVend.toFixed(2)),
        "Total Comissão": parseFloat(totalComVend.toFixed(2)),
        "Qtd. Vendas": vendRows.length,
      };
    })
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vendas");
  XLSX.utils.book_append_sheet(wb, wsComissoes, "Comissões");
  XLSX.writeFile(wb, filePath);

  return {
    filePath,
    fileName: "automotivo_teste.xlsx",
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
    expectedSheets: ["Vendas", "Comissões"],
    sector: "automotivo",
  };
}
