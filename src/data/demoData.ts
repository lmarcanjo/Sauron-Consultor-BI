import { LancamentoFinanceiro } from "../types";

export function gerarDadosSimulados(): LancamentoFinanceiro[] {
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"];
  const grupos = ["Grupo Topázio"];

  const marcasPorGrupo: Record<string, string[]> = {
    "Grupo Topázio": [
      "Topázio Nissan",
      "Topázio Fiat",
      "Topázio Jeep",
      "Topázio Seminovos",
    ],
  };

  const cnpjsPorMarca: Record<string, string> = {
    "Topázio Nissan": "11.111.111/0001-11",
    "Topázio Fiat": "22.222.222/0001-22",
    "Topázio Jeep": "33.333.333/0001-33",
    "Topázio Seminovos": "44.444.444/0001-44",
  };

  const filiaisPorMarca: Record<string, string[]> = {
    "Topázio Nissan": ["Matriz Nissan", "Filial Nissan Norte"],
    "Topázio Fiat": ["Topázio Fiat Sul"],
    "Topázio Jeep": ["Jeep Premium Center", "Jeep Outback"],
    "Topázio Seminovos": ["Seminovos Mega Store"],
  };

  const vendedoresNomes = [
    "João Silva",
    "Maria Santos",
    "Pedro Oliveira",
    "Lucas Souza",
    "Ana Costa",
    "Carlos Rodrigues",
    "Bruna Pereira",
    "Gabriel Alves",
    "Mariana Lima",
    "Ricardo Santos",
    "Fernanda Gomes",
    "Rafael Silva",
    "Camila Martins",
    "Thiago Moura",
    "Juliana Ribeiro",
    "Marcelo Almeida",
    "Beatriz Rocha",
    "Felipe Carvalho",
    "Isabela Fernandes",
    "Thiago Lacerda",
  ];

  const razoesDespesa: [string, string, string][] = [
    ["Venda de Veículos", "Receitas", "Receita Comercial"],
    ["Serviços Oficina", "Receitas", "Receita Pós-Vendas"],
    ["Custo de Veículos Venda", "CMV", "Custo Direto"],
    ["Custo de Peças Oficina", "CMV Pós-Vendas", "Custo Direto"],
    ["Folha Vendas", "Pessoal Comercial", "Despesa Comercial"],
    ["Comissões", "Pessoal Comercial", "Despesa Comercial"],
    ["Marketing", "Divulgação Médias", "Despesa Comercial"],
    ["Imóveis", "Ocupação", "Despesa Fixa"],
    ["Sistemas TI", "Sistemas", "Despesa Fixa"],
  ];

  const list: LancamentoFinanceiro[] = [];
  let seed = 42;

  function random(min: number, max: number) {
    const x = Math.sin(seed++) * 10000;
    const r = x - Math.floor(x);
    return min + r * (max - min);
  }

  grupos.forEach((grupo) => {
    const marcas = marcasPorGrupo[grupo];
    marcas.forEach((marca) => {
      const cnpj = cnpjsPorMarca[marca];
      const empresa = `${marca} S/A`;
      const filiais = filiaisPorMarca[marca];

      filiais.forEach((filial) => {
        const numSellers = Math.floor(random(2, 5));
        const branchSellers: string[] = [];
        for (let i = 0; i < numSellers; i++) {
          branchSellers.push(
            vendedoresNomes[Math.floor(random(0, vendedoresNomes.length))],
          );
        }

        meses.forEach((mes, mesIdx) => {
          const fatorSazonal = 1.0 + mesIdx * 0.08 + random(-0.04, 0.04);

          razoesDespesa.forEach(([razao, categoria]) => {
            let baseReceita = 95000;
            if (marca === "Topázio Jeep") {
              baseReceita = 180000;
            } else if (marca === "Topázio Fiat" || marca === "Topázio Nissan") {
              baseReceita = 140000;
            }

            const receita =
              Math.round(
                baseReceita * fatorSazonal * random(0.85, 1.15) * 100,
              ) / 100;

            const custoPct = random(0.72, 0.78);
            const custo = Math.round(receita * custoPct * 100) / 100;

            let baseDespesa = baseReceita * 0.02;
            if (razao.includes("Folha") || razao.includes("Imóveis")) {
              baseDespesa = baseReceita * 0.08;
            } else if (razao.includes("Marketing")) {
              baseDespesa = baseReceita * 0.04;
            }

            const despesa =
              Math.round(baseDespesa * random(0.8, 1.2) * 100) / 100;

            const lucro = Math.round((receita - custo - despesa) * 100) / 100;
            const margem =
              receita > 0 ? Math.round((lucro / receita) * 100 * 100) / 100 : 0;

            let depto = "Geral";
            let ctc = "3.1.04.10000.10 - Combustível";

            if (razao.includes("Imóveis")) {
              depto = "Administrativo";
              ctc = "3.1.04.30000.30 - Custos Prediais";
            } else if (razao.includes("Folha") || razao.includes("Comissões")) {
              depto = "Comercial";
              ctc = "3.1.03.11100.05 - Commission of Vendas";
            } else if (razao.includes("Sistemas TI")) {
              depto = "Tecnologia";
              ctc = "3.1.04.10000.25 - Suporte e Licenças";
            } else if (razao.includes("Veículos")) {
              depto = "Vendas Novos";
              ctc = "3.0.0.1 - Venda de Veículos";
            } else if (razao.includes("Oficina")) {
              depto = "Pós-Venda (Oficina)";
              ctc = "3.0.3.1 - Serviços de Oficina";
            }

            const vendedor =
              branchSellers[Math.floor(random(0, branchSellers.length))] || "";

            let cc = "cc_veiculos_novos";
            if (depto === "Pós-Venda (Oficina)") cc = "cc_mecanica";
            else if (depto === "Tecnologia" || depto === "Administrativo") cc = "cc_administrativo";
            else if (depto.includes("Novos")) cc = "cc_veiculos_novos";
            
            list.push({
              id: `${cnpj}-${filial}-${mes}-${razao}-${Math.random()}`,
              __isDemo: true,
              Grupo: grupo,
              CNPJ: cnpj,
              Marca: marca,
              Empresa: empresa,
              Locação: filial,
              Filial: filial,
              Loja: filial,
              Vendedor: vendedor,
              Mês: mes,
              Data: `2024-${String(mesIdx + 1).padStart(2, '0')}-01`,
              Competencia: `2024-${String(mesIdx + 1).padStart(2, '0')}`,
              Razão: razao,
              NomeConta: razao,
              CodigoConta: ctc.split(" - ")[0],
              Categoria: categoria,
              Receita: receita,
              Custo: custo,
              Despesa: despesa,
              Valor: receita > 0 ? receita : -despesa,
              Lucro: lucro,
              Margem: margem,
              Departamento: depto,
              ContaContabil: ctc,
              CentroDeCusto: cc,
              Origem: "ERP Dealership",
              DocumentoFiscal: `NF-${Math.floor(random(100000, 999999))}`,
              Usuario: "Sincronização Cloud",
              TipoMovimento: receita > 0 ? "Credito" : "Debito",
              DescricaoLancamento: `Lançamento Ref. ${razao} na loja ${filial}`,
              Observacoes: `Vendedor(a) associado(a): ${vendedor || 'Padrão'}`,
              Orcamento: Math.round(receita * random(0.88, 1.12) * 100) / 100,
            } as any);
          });
        });
      });
    });
  });

  return list;
}

export function exportToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const lines = [headers.join(";")];

  data.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header];
      if (typeof val === "number") {
        return val.toString();
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(values.join(";"));
  });

  return lines.join("\n");
}

export function generateDemoSpreadsheetRows(segment: "automotivo" | "agro" | "servicos" | "industria"): any[] {
  const calculatedRows: any[] = [];
  const meses = ["Janeiro 2026", "Fevereiro 2026", "Março 2026", "Abril 2026"];
  const empresaNomes = segment === "automotivo" ? ["Sauron Veículos SP", "Sauron Veículos RJ", "Sauron Seminovos"] 
                     : segment === "agro" ? ["Fazenda Campo Alto", "Fazenda Vale Verde", "Silo Central"]
                     : segment === "servicos" ? ["Sauron Advising", "Sauron Systems", "Sauron Labs"]
                     : ["Planta Fundição", "Planta Montagem", "P&D Hub"];

  const marcas = segment === "automotivo" ? ["Toyota", "Ford", "Chevrolet", "BMW"]
               : segment === "agro" ? ["Soja Transgênica", "Milho Safrinha", "Trigo Rústico"]
               : segment === "servicos" ? ["Consultoria BI", "Suporte Integrado", "Machine Learning Core"]
               : ["Liga Metálica", "Peça Estampada", "Componente Injetado"];

  for (let i = 0; i < 40; i++) {
    const g = "Grupo Sauron S.A.";
    const e = empresaNomes[i % empresaNomes.length];
    const m = marcas[i % marcas.length];
    const cnpj = `12.345.678/000${(i % 3) + 1}-99`;
    const mes = meses[i % meses.length];
    const rec = Math.round(150000 + Math.random() * 320000);
    const cus = Math.round(rec * (0.45 + Math.random() * 0.15));
    const desp = Math.round(rec * (0.15 + Math.random() * 0.1));
    const luc = rec - cus - desp;
    const margem = parseFloat(((luc / rec) * 100).toFixed(1));

    calculatedRows.push({
      id: `row_${i}`,
      __isDemo: true,
      Grupo: g,
      CNPJ: cnpj,
      Marca: m,
      Empresa: e,
      Mês: mes,
      Razão: i % 2 === 0 ? "Comercial de Vendas" : "Faturamento Consignação",
      Categoria: i % 2 === 0 ? "Produtos do Setor Principal" : "Gerais de Operações",
      Receita: rec,
      Custo: cus,
      Despesa: desp,
      Lucro: luc,
      Margem: margem,
      Regiao: i % 2 === 0 ? "Sudeste" : "Nordeste",
      Vendedor: `Consultor ${(i % 5) + 1}`,
      Safra: "2025/2026",
      CamposVazios: i % 7 === 0 ? "" : "Homologado",
      PossiveisDuplicados: i === 12 || i === 13 ? "Sim" : "Não"
    });
  }
  return calculatedRows;
}
