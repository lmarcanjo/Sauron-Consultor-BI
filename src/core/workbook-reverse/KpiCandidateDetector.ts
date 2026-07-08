import { WorkbookCatalog } from "../workbook";
import { KpiCandidate, SheetRoleClassification } from "./WorkbookReverseTypes";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function findColumns(catalog: WorkbookCatalog, patterns: RegExp[]): Array<{ sheetName: string; columnName: string }> {
  return catalog.columns
    .filter(column => patterns.some(pattern => pattern.test(normalize(column.originalName))))
    .map(column => ({ sheetName: column.sheetName, columnName: column.originalName }));
}

function roleSheets(sheetRoles: SheetRoleClassification[], role: string): string[] {
  return sheetRoles
    .filter(sheet => sheet.roles.some(item => item.role === role && item.confidence >= 0.45))
    .map(sheet => sheet.sheetName);
}

function buildCandidate(params: {
  id: string;
  name: string;
  category: KpiCandidate["category"];
  confidence: number;
  columns: Array<{ sheetName: string; columnName: string }>;
  extraSheets?: string[];
  evidence: string[];
}): KpiCandidate | null {
  const sheetNames = unique([...(params.extraSheets || []), ...params.columns.map(item => item.sheetName)]).slice(0, 12);
  const relatedColumns = unique(params.columns.map(item => item.columnName)).slice(0, 12);
  if (sheetNames.length === 0 && relatedColumns.length === 0) return null;

  return {
    id: params.id,
    name: params.name,
    category: params.category,
    confidence: params.confidence,
    sheetNames,
    relatedColumns,
    evidence: params.evidence,
  };
}

export function detectKpiCandidates(catalog: WorkbookCatalog, sheetRoles: SheetRoleClassification[]): KpiCandidate[] {
  const reportSheets = roleSheets(sheetRoles, "relatorio");
  const commissionSheets = roleSheets(sheetRoles, "comissao");
  const dreSheets = roleSheets(sheetRoles, "dre");
  const peopleSheets = roleSheets(sheetRoles, "cadastro");
  const salesColumns = findColumns(catalog, [/venda/, /valor/, /total/, /produto/, /peca/, /item/, /cliente/]);
  const marginColumns = findColumns(catalog, [/margem/, /lucro/, /rentabilidade/, /custo/]);
  const commissionColumns = findColumns(catalog, [/comissao/, /premio/, /bonificacao/, /percentual/]);
  const peopleColumns = findColumns(catalog, [/vendedor/, /consultor/, /funcionario/, /colaborador/, /gerente/, /cpf/, /matricula/]);
  const financialColumns = findColumns(catalog, [/receita/, /despesa/, /custo/, /valor/, /total/, /pagamento/, /financeiro/]);
  const operationalColumns = findColumns(catalog, [/pendencia/, /quantidade/, /qtd/, /estoque/, /prazo/, /status/]);
  const dreColumns = findColumns(catalog, [/receita/, /custo/, /despesa/, /lucro/, /margem/, /resultado/, /ebitda/]);

  return [
    buildCandidate({
      id: "kpi:sales",
      name: "Vendas / valor vendido",
      category: "sales",
      confidence: salesColumns.length > 0 ? 0.75 : 0.4,
      columns: salesColumns,
      extraSheets: reportSheets,
      evidence: [`${salesColumns.length} colunas candidatas a vendas/valor/produto/cliente.`],
    }),
    buildCandidate({
      id: "kpi:margin",
      name: "Margem, lucro ou rentabilidade",
      category: "margin",
      confidence: marginColumns.length > 0 ? 0.75 : 0.35,
      columns: marginColumns,
      extraSheets: reportSheets,
      evidence: [`${marginColumns.length} colunas candidatas a margem/lucro/custo.`],
    }),
    buildCandidate({
      id: "kpi:commission",
      name: "Comissão de vendedores",
      category: "commission",
      confidence: commissionSheets.length > 0 ? 0.9 : 0.6,
      columns: commissionColumns,
      extraSheets: commissionSheets,
      evidence: [
        commissionSheets.length > 0
          ? `Abas de comissão detectadas: ${commissionSheets.join(", ")}.`
          : `${commissionColumns.length} colunas candidatas a comissão.`,
      ],
    }),
    buildCandidate({
      id: "kpi:people",
      name: "Performance por vendedor/funcionário",
      category: "people",
      confidence: peopleColumns.length > 0 ? 0.72 : 0.4,
      columns: peopleColumns,
      extraSheets: peopleSheets,
      evidence: [`${peopleColumns.length} colunas candidatas a vendedor, funcionário ou cadastro.`],
    }),
    buildCandidate({
      id: "kpi:financial",
      name: "Totais financeiros e custos",
      category: "financial",
      confidence: financialColumns.length > 0 ? 0.68 : 0.35,
      columns: financialColumns,
      extraSheets: reportSheets,
      evidence: [`${financialColumns.length} colunas candidatas a valor, custo, despesa ou total financeiro.`],
    }),
    buildCandidate({
      id: "kpi:operational",
      name: "Pendências, quantidade e status operacional",
      category: "operational",
      confidence: operationalColumns.length > 0 ? 0.68 : 0.35,
      columns: operationalColumns,
      extraSheets: reportSheets.filter(sheet => normalize(sheet).includes("pendencia")),
      evidence: [`${operationalColumns.length} colunas candidatas a pendência, quantidade ou status.`],
    }),
    buildCandidate({
      id: "kpi:dre",
      name: "Resultado gerencial / DRE candidata",
      category: "dre",
      confidence: dreSheets.length > 0 ? 0.82 : 0.55,
      columns: dreColumns,
      extraSheets: dreSheets,
      evidence: [
        dreSheets.length > 0
          ? `Abas DRE candidatas: ${dreSheets.join(", ")}.`
          : `${dreColumns.length} colunas candidatas a receita, custo, despesa, lucro ou resultado.`,
      ],
    }),
  ]
    .filter((candidate): candidate is KpiCandidate => candidate !== null)
    .sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
}
