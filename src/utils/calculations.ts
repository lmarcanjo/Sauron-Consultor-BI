import { LancamentoFinanceiro } from "../types";

export function calculateProfit(receita: number, despesa: number, custo: number): number {
  return receita - despesa - custo;
}

export function calculateMargin(lucro: number, receita: number): number {
  if (receita === 0) return 0;
  return Number(((lucro / Math.abs(receita)) * 100).toFixed(2));
}

export function buildSellerRanking(data: LancamentoFinanceiro[]) {
  const ranking: Record<string, { vendedor: string, receitas: number, despesas: number, lucro: number }> = {};
  
  data.forEach((item) => {
    const nome = item.Vendedor || "Padrão";
    if (!ranking[nome]) ranking[nome] = { vendedor: nome, receitas: 0, despesas: 0, lucro: 0 };
    
    // Simplification for the test
    const val = (item.Receita || 0) - ((item.Despesa || 0) + (item.Custo || 0)) || (item.Valor || 0);

    if (item.Receita || val > 0) ranking[nome].receitas += Math.abs(item.Receita || val);
    if (item.Despesa || item.Custo || val < 0) ranking[nome].despesas += Math.abs(item.Despesa || item.Custo || val);
  });

  return Object.values(ranking)
    .map(v => ({ ...v, lucro: v.receitas - v.despesas }))
    .sort((a, b) => b.lucro - a.lucro);
}

export function isQueryReadOnly(query: string): boolean {
  if (!query) return true;
  const q = query.trim().toUpperCase();
  const blockedKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE"];
  for (const keyword of blockedKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(q)) {
      return false;
    }
  }
  return true;
}

export function isMockAllowed(source: string): boolean {
  return false;
}

export function validateFormula(expression: string): boolean {
  if (!expression) return false;
  return expression.includes("[") && expression.includes("]");
}

export function validateTraceability(row: any): boolean {
  return (
    typeof row === "object" &&
    row !== null &&
    "arquivo" in row &&
    "aba" in row &&
    "linha" in row &&
    "coluna" in row &&
    "dataImportacao" in row &&
    "usuario" in row
  );
}
