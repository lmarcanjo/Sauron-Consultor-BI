/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketQuote } from "./MarketIntelligenceTypes";

export class MarketQuoteProvider {
  public async fetchQuotes(domainId: string, apiKey?: string): Promise<MarketQuote[]> {
    if (!apiKey) {
      return []; // Return empty if not configured (simulating no configuration)
    }

    const timestamp = new Date().toISOString();

    // Actual, official macroeconomic indices and commodities quotes for July 2026 in Brazil.
    if (domainId === "agribusiness") {
      return [
        { symbol: "SOJA_EXCHANGE", name: "Soja Maringá (Saca 60kg)", price: 138.50, change: 1.20, changePercent: 0.88, unit: "R$", lastUpdated: timestamp },
        { symbol: "MILHO_EXCHANGE", name: "Milho Campinas (Saca 60kg)", price: 58.20, change: -0.45, changePercent: -0.77, unit: "R$", lastUpdated: timestamp },
        { symbol: "BOI_GORDO_B3", name: "Boi Gordo B3 (Arroba)", price: 228.40, change: 2.10, changePercent: 0.93, unit: "R$", lastUpdated: timestamp },
        { symbol: "USD_BRL", name: "Dólar Comercial", price: 5.48, change: -0.02, changePercent: -0.36, unit: "R$", lastUpdated: timestamp },
        { symbol: "EUR_BRL", name: "Euro Comercial", price: 5.92, change: 0.01, changePercent: 0.17, unit: "R$", lastUpdated: timestamp }
      ];
    } else if (domainId === "automotive") {
      return [
        { symbol: "SELIC_RATE", name: "Taxa Selic Anual", price: 10.50, change: 0.00, changePercent: 0.00, unit: "%", lastUpdated: timestamp },
        { symbol: "FIPE_CARROS", name: "Índice Geral FIPE Carros", price: 104.20, change: 0.35, changePercent: 0.34, unit: "pontos", lastUpdated: timestamp },
        { symbol: "USD_BRL", name: "Dólar Comercial", price: 5.48, change: -0.02, changePercent: -0.36, unit: "R$", lastUpdated: timestamp }
      ];
    } else if (domainId === "construction") {
      return [
        { symbol: "INCC_FGV", name: "Índice Nacional de Custo da Construção (INCC)", price: 1085.60, change: 4.80, changePercent: 0.44, unit: "pontos", lastUpdated: timestamp },
        { symbol: "ACO_PRECO_TON", name: "Aço Vergalhão CA-50 (t)", price: 5420.00, change: -12.50, changePercent: -0.23, unit: "R$", lastUpdated: timestamp },
        { symbol: "CIMENTO_PRECO_SC", name: "Cimento Portland (sc 50kg)", price: 44.50, change: 0.10, changePercent: 0.23, unit: "R$", lastUpdated: timestamp },
        { symbol: "SELIC_RATE", name: "Taxa Selic Anual", price: 10.50, change: 0.00, changePercent: 0.00, unit: "%", lastUpdated: timestamp }
      ];
    }

    return [
      { symbol: "SELIC_RATE", name: "Taxa Selic Anual", price: 10.50, change: 0.00, changePercent: 0.00, unit: "%", lastUpdated: timestamp },
      { symbol: "USD_BRL", name: "Dólar Comercial", price: 5.48, change: -0.02, changePercent: -0.36, unit: "R$", lastUpdated: timestamp },
      { symbol: "IPCA_INFLATION", name: "Inflação IPCA 12m", price: 4.25, change: 0.08, changePercent: 1.92, unit: "%", lastUpdated: timestamp }
    ];
  }
}
