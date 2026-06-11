/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../types";

export function gerarDadosSimulados(): LancamentoFinanceiro[] {
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"];
  const grupos = ["Grupo Carbon Motors", "Grupo Prime Auto"];
  
  const marcasPorGrupo: Record<string, string[]> = {
    "Grupo Carbon Motors": ["Toyota", "Chevrolet", "Jeep"],
    "Grupo Prime Auto": ["BMW", "BYD", "Hyundai"]
  };
  
  const cnpjsPorMarca: Record<string, string> = {
    "Toyota": "12.345.678/0001-90",
    "Chevrolet": "98.765.432/0001-10",
    "Jeep": "45.678.901/0001-22",
    "BMW": "55.444.333/0001-44",
    "BYD": "22.333.444/0001-55",
    "Hyundai": "88.777.666/0001-88"
  };
  
  const razoesDespesa: [string, string, string][] = [
    ["Custo de Ocupação", "Infraestrutura", "Despesa Fixa"],
    ["Pessoal de Vendas", "Comissões", "Despesa Comercial"],
    ["Pessoal Administrativo", "Salários & Encargos", "Despesa de Pessoal"],
    ["Propaganda e Marketing", "Divulgação Médias", "Despesa Comercial"],
    ["Serviços Terceirizados", "Manutenção e Segurança", "Despesa Fixa"],
    ["Despesas com Viagens", "Transporte e Estadias", "Despesa Operacional"],
    ["Sistemas de TI e Telecom", "Software e Licenças", "Despesa Fixa"],
    ["Material de Consumo", "Administração Geral", "Despesa Operacional"]
  ];
  
  const list: LancamentoFinanceiro[] = [];
  let seed = 42;
  
  // pseudo-random helper to make it deterministic but diverse
  function random(min: number, max: number) {
    const x = Math.sin(seed++) * 10000;
    const r = x - Math.floor(x);
    return min + r * (max - min);
  }
  
  grupos.forEach((grupo) => {
    const marcas = marcasPorGrupo[grupo];
    marcas.forEach((marca) => {
      const cnpj = cnpjsPorMarca[marca];
      const empresa = `${grupo} - ${marca} S/A`;
      const filiais = [`Filial ${marca} Centro`, `Filial ${marca} Norte`];
      
      filiais.forEach((filial) => {
        meses.forEach((mes, mesIdx) => {
          const fatorSazonal = 1.0 + (mesIdx * 0.08) + random(-0.04, 0.04);
          
          razoesDespesa.forEach(([razao, categoria]) => {
            // Base revenue depends on the brand's position
            let baseReceita = 95000;
            if (marca === "Toyota" || marca === "BMW") {
              baseReceita = 180000;
            } else if (marca === "BYD" || marca === "Chevrolet") {
              baseReceita = 140000;
            }
            
            const receita = Math.round(baseReceita * fatorSazonal * random(0.85, 1.15) * 100) / 100;
            
            // Vehicles have an elevated purchase cost (CMV) usually 72-78% of revenue
            const custoPct = random(0.72, 0.78);
            const custo = Math.round(receita * custoPct * 100) / 100;
            
            // Operational expenses by account
            let baseDespesa = baseReceita * 0.02;
            if (razao.includes("Pessoal") || razao.includes("Ocupação")) {
              baseDespesa = baseReceita * 0.08;
            } else if (razao.includes("Propaganda")) {
              baseDespesa = baseReceita * 0.04;
            }
            
            const despesa = Math.round(baseDespesa * random(0.8, 1.2) * 100) / 100;
            
            const lucro = Math.round((receita - custo - despesa) * 100) / 100;
            const margem = receita > 0 ? Math.round((lucro / receita) * 100 * 100) / 100 : 0;
            
            list.push({
              Grupo: grupo,
              CNPJ: cnpj,
              Marca: marca,
              Empresa: empresa,
              Filial: filial,
              Mês: mes,
              Razão: razao,
              Categoria: categoria,
              Receita: receita,
              Custo: custo,
              Despesa: despesa,
              Lucro: lucro,
              Margem: margem
            });
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
        // use standard decimal display or simple raw float
        return val.toString();
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(values.join(";"));
  });
  
  return lines.join("\n");
}
