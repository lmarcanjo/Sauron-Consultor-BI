/**
 * tests/fixtures/generators/generateServicesWorkbook.ts
 * Gerador para setor de serviços (consultoria, TI, educação).
 */
import path from "path";
import fs from "fs";
import type { GeneratedFixture } from "./index";

function rand(min: number, max: number, dec = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

export async function generateServicesWorkbook(outputDir?: string): Promise<GeneratedFixture> {
  const dir = outputDir ?? path.resolve(process.cwd(), "tests/fixtures/generated/services");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "servicos_teste.xlsx");

  const servicos = ["Consultoria Estratégica", "Treinamento Corporativo", "Auditoria", "Implantação ERP", "Suporte TI"];
  const clientes = ["Cliente Alfa", "Cliente Beta", "Cliente Gamma", "Cliente Delta"];
  const consultores = ["Patrícia Neves", "Roberto Alves", "Sandra Cruz", "Tânia Moura"];
  const meses = ["Jan/25", "Fev/25", "Mar/25", "Abr/25", "Mai/25", "Jun/25"];

  const rows: Record<string, any>[] = [];
  let totalReceita = 0, totalCusto = 0, totalComissao = 0;
  const consulSet = new Set<string>();

  for (let i = 0; i < 60; i++) {
    const servico = servicos[i % servicos.length];
    const cliente = clientes[i % clientes.length];
    const consultor = consultores[i % consultores.length];
    const mes = meses[i % meses.length];
    const horas = Math.floor(rand(10, 200, 0));
    const valorHora = rand(150, 800);
    const receita = parseFloat((horas * valorHora).toFixed(2));
    const custo = parseFloat((receita * rand(0.2, 0.4)).toFixed(2));
    const despesa = parseFloat((receita * rand(0.05, 0.15)).toFixed(2));
    const lucro = parseFloat((receita - custo - despesa).toFixed(2));
    const margem = parseFloat((lucro / receita * 100).toFixed(2));
    const comissao = parseFloat((receita * 0.03).toFixed(2));
    const nps = Math.floor(rand(6, 10, 0));

    totalReceita += receita;
    totalCusto += custo;
    totalComissao += comissao;
    consulSet.add(consultor);

    rows.push({
      Empresa: "Consultoria Sauron Ltda",
      CNPJ: "77.888.999/0001-00",
      Cliente: cliente,
      Serviço: servico,
      Consultor: consultor,
      Mês: mes,
      "Horas Trabalhadas": horas,
      "Valor/Hora": valorHora,
      Receita: receita,
      Custo: custo,
      Despesa: despesa,
      Lucro: lucro,
      Margem: margem,
      Comissão: comissao,
      NPS: nps,
    });
  }

  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wsPessoas = XLSX.utils.json_to_sheet(
    consultores.map((c) => {
      const cRows = rows.filter((r) => r.Consultor === c);
      return {
        Consultor: c,
        "Projetos": cRows.length,
        "Total Receita": parseFloat(cRows.reduce((a, r) => a + r.Receita, 0).toFixed(2)),
        "Total Comissão": parseFloat(cRows.reduce((a, r) => a + r.Comissão, 0).toFixed(2)),
        "NPS Médio": parseFloat((cRows.reduce((a, r) => a + r.NPS, 0) / cRows.length).toFixed(1)),
      };
    })
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Serviços");
  XLSX.utils.book_append_sheet(wb, wsPessoas, "Equipe");
  XLSX.writeFile(wb, filePath);

  return {
    filePath,
    fileName: "servicos_teste.xlsx",
    format: "xlsx",
    expectedMetrics: {
      receita: parseFloat(totalReceita.toFixed(2)),
      custo: parseFloat(totalCusto.toFixed(2)),
      margem: parseFloat(((totalReceita - totalCusto) / totalReceita * 100).toFixed(2)),
      comissao: parseFloat(totalComissao.toFixed(2)),
      vendedores: consulSet.size,
      ticketMedio: parseFloat((totalReceita / 60).toFixed(2)),
      totalLinhas: rows.length,
      totalColunas: 15,
    },
    expectedMappings: {
      Receita: "receita", Custo: "custo", Despesa: "custo",
      Consultor: "vendedor", Mês: "data", Empresa: "empresa",
    },
    expectedSheets: ["Serviços", "Equipe"],
    sector: "servicos",
  };
}
