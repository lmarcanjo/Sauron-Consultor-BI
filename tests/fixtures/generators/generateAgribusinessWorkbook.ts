/**
 * tests/fixtures/generators/generateAgribusinessWorkbook.ts
 *
 * Gerador de fixture para setor de agronegócio.
 * Produz um arquivo XLSX real com dados não confidenciais.
 *
 * Colunas geradas:
 *   Empresa, Grupo, CNPJ, Mês, Safra, Cultura, Área(ha),
 *   Receita, Custo, Despesa, Lucro, Margem, Vendedor, Comissão
 *
 * Dados: 60 linhas fictícias de 3 fazendas, 2 safras, 5 culturas.
 */

import path from "path";
import fs from "fs";
import type { GeneratedFixture } from "./index";

interface AgriRow {
  Empresa: string;
  Grupo: string;
  CNPJ: string;
  Mês: string;
  Safra: string;
  Cultura: string;
  "Área (ha)": number;
  Receita: number;
  Custo: number;
  Despesa: number;
  Lucro: number;
  Margem: number;
  Vendedor: string;
  Comissão: number;
}

const EMPRESAS = [
  { nome: "Fazenda Palmeiras", grupo: "Grupo Agro Norte", cnpj: "11.222.333/0001-44" },
  { nome: "Fazenda São Pedro", grupo: "Grupo Agro Norte", cnpj: "22.333.444/0001-55" },
  { nome: "Agrícola Bela Vista", grupo: "Grupo Agro Norte", cnpj: "33.444.555/0001-66" },
];
const CULTURAS = ["Soja", "Milho", "Algodão", "Cana", "Café"];
const SAFRAS = ["2024/25", "2025/26"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const VENDEDORES = ["Carlos Alves", "Mariana Costa", "João Souza", "Fernanda Lima"];

function rand(min: number, max: number, dec = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

export async function generateAgribusinessWorkbook(outputDir?: string): Promise<GeneratedFixture> {
  const dir = outputDir ?? path.resolve(process.cwd(), "tests/fixtures/generated/agribusiness");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "agronegocio_teste.xlsx");

  // Gerar dados
  const rows: AgriRow[] = [];
  let totalReceita = 0;
  let totalCusto = 0;
  let totalComissao = 0;
  const vendedoresSet = new Set<string>();

  for (let i = 0; i < 60; i++) {
    const empresa = EMPRESAS[i % EMPRESAS.length];
    const mes = MESES[i % MESES.length];
    const safra = SAFRAS[i % SAFRAS.length];
    const cultura = CULTURAS[i % CULTURAS.length];
    const area = rand(100, 1500, 1);
    const receita = rand(50000, 500000);
    const custo = rand(20000, 200000);
    const despesa = rand(5000, 50000);
    const lucro = parseFloat((receita - custo - despesa).toFixed(2));
    const margem = parseFloat(((lucro / receita) * 100).toFixed(2));
    const vendedor = VENDEDORES[i % VENDEDORES.length];
    const comissao = parseFloat((receita * 0.015).toFixed(2));

    totalReceita += receita;
    totalCusto += custo;
    totalComissao += comissao;
    vendedoresSet.add(vendedor);

    rows.push({
      Empresa: empresa.nome,
      Grupo: empresa.grupo,
      CNPJ: empresa.cnpj,
      Mês: mes,
      Safra: safra,
      Cultura: cultura,
      "Área (ha)": area,
      Receita: receita,
      Custo: custo,
      Despesa: despesa,
      Lucro: lucro,
      Margem: margem,
      Vendedor: vendedor,
      Comissão: comissao,
    });
  }

  // Gerar XLSX usando a biblioteca xlsx (disponível como devDependency)
  // Importar dinamicamente para evitar erros em ambientes sem node
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");

  // Aba de resumo
  const resumo = [
    { Campo: "Total de Linhas", Valor: rows.length },
    { Campo: "Total Receita", Valor: parseFloat(totalReceita.toFixed(2)) },
    { Campo: "Total Custo", Valor: parseFloat(totalCusto.toFixed(2)) },
    { Campo: "Total Comissão", Valor: parseFloat(totalComissao.toFixed(2)) },
    { Campo: "Vendedores", Valor: vendedoresSet.size },
  ];
  const wsResumo = XLSX.utils.json_to_sheet(resumo);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  XLSX.writeFile(wb, filePath);

  const margem = parseFloat(((totalReceita - totalCusto) / totalReceita * 100).toFixed(2));
  const ticketMedio = parseFloat((totalReceita / rows.length).toFixed(2));

  return {
    filePath,
    fileName: "agronegocio_teste.xlsx",
    format: "xlsx",
    expectedMetrics: {
      receita: parseFloat(totalReceita.toFixed(2)),
      custo: parseFloat(totalCusto.toFixed(2)),
      margem,
      comissao: parseFloat(totalComissao.toFixed(2)),
      vendedores: vendedoresSet.size,
      ticketMedio,
      totalLinhas: rows.length,
      totalColunas: 14,
    },
    expectedMappings: {
      Receita: "receita",
      Custo: "custo",
      Despesa: "custo",
      Vendedor: "vendedor",
      Mês: "data",
      Empresa: "empresa",
    },
    expectedSheets: ["Dados", "Resumo"],
    sector: "agronegocio",
  };
}
