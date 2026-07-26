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
  
  // Preserve the physical headers. Semantic interpretation is optional.
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));
  
  // Loop through lines
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i], delimiter);
    if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;
    
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
    
    const newEntry: any = { id: String(i), ...row };
    // Convert only fields that physically exist; no derived defaults.
    ["Receita", "Custo", "Despesa", "Lucro", "Margem", "Orçamento", "Orcamento"].forEach(column => {
      if (Object.prototype.hasOwnProperty.call(row, column)) newEntry[column] = parseNum(row[column]);
    });

    result.push(newEntry);
  }
  
  return { 
    data: result, 
    missingFields: []
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
