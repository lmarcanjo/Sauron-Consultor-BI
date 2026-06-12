/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../types";

export function parseCSV(text: string): { data: LancamentoFinanceiro[]; missingFields: string[] } {
  const result: LancamentoFinanceiro[] = [];
  const missingFields: string[] = [];
  
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { data: [], missingFields: ["Nenhum dado legível encontrado"] };
  }
  
  // Detect delimiter (semicolon vs comma)
  const firstLine = lines[0];
  let delimiter = ",";
  if (firstLine.includes(";")) {
    delimiter = ";";
  }
  
  // Extract and clean headers
  const headers = firstLine.split(delimiter).map(h => 
    h.trim().replace(/^["']|["']$/g, "").replace('Mes', 'Mês').replace('Razao', 'Razão')
  );
  
  const requiredColumns = [
    "Grupo", "CNPJ", "Marca", "Empresa", "Filial", "Mês", "Razão", "Categoria", "Receita", "Custo", "Despesa"
  ];
  
  // Check which mandatory columns are missing
  const absentFields = requiredColumns.filter(col => !headers.includes(col));
  
  // Loop through lines
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i], delimiter);
    if (cells.length < headers.length) continue;
    
    const row: any = {};
    headers.forEach((h, index) => {
      row[h] = cells[index] || "";
    });
    
    // Convert numerical values
    const parseNum = (val: any): number => {
      if (!val) return 0;
      // Handle Brazilian comma decimal separator (e.g. 1500,50 -> 1500.50)
      const sanitized = String(val).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
      const num = parseFloat(sanitized);
      return isNaN(num) ? 0 : num;
    };
    
    const receita = parseNum(row["Receita"]);
    const custo = parseNum(row["Custo"]);
    const despesa = parseNum(row["Despesa"]);
    
    // Dynamic fallback for Lucro and Margem
    const lucro = row["Lucro"] !== undefined ? parseNum(row["Lucro"]) : Math.round((receita - custo - despesa) * 100) / 100;
    const margem = row["Margem"] !== undefined ? parseNum(row["Margem"]) : (receita > 0 ? Math.round((lucro / receita) * 100 * 100) / 100 : 0);
    const orcamento = row["Orçamento"] !== undefined ? parseNum(row["Orçamento"]) : (row["Orcamento"] !== undefined ? parseNum(row["Orcamento"]) : Math.round((receita * 0.95) * 100) / 100);
    
    result.push({
      Grupo: row["Grupo"] || "Geral",
      CNPJ: row["CNPJ"] || "00.000.000/0001-00",
      Marca: row["Marca"] || "N/D",
      Empresa: row["Empresa"] || "Empresa Geral",
      Filial: row["Filial"] || "Matriz",
      Mês: row["Mês"] || "N/D",
      Razão: row["Razão"] || "Outros",
      Categoria: row["Categoria"] || "Sem Categoria",
      Receita: receita,
      Custo: custo,
      Despesa: despesa,
      Lucro: lucro,
      Margem: margem,
      Orcamento: orcamento
    });
  }
  
  return { 
    data: result, 
    missingFields: absentFields 
  };
}

// Safely split line respecting surrounding quotes and escapes
function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ""));
  
  return result;
}
