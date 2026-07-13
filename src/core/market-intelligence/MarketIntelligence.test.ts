/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { DomainMarketPackMapper } from "./DomainMarketPackMapper";
import { marketIntelligenceEngine } from "./MarketIntelligenceEngine";

describe("F12 — Market Intelligence Test Suite", () => {
  beforeAll(() => {
    if (typeof window === "undefined") {
      const storage: Record<string, string> = {};
      (globalThis as any).window = {
        localStorage: {
          getItem: (key: string) => storage[key] || null,
          setItem: (key: string, value: string) => { storage[key] = value; },
          removeItem: (key: string) => { delete storage[key]; },
          clear: () => {
            for (const key in storage) {
              delete storage[key];
            }
          }
        }
      };
    }
  });

  beforeEach(() => {
    // Reset configuration
    marketIntelligenceEngine.setConfigured(false);
    marketIntelligenceEngine.setApiKey("");
  });

  it("1. should map domain segments correctly", () => {
    const agroPack = DomainMarketPackMapper.getPackForDomain("agribusiness");
    expect(agroPack.quotesToWatch).toContain("SOJA_EXCHANGE");
    expect(agroPack.externalIndicators).toContain("Preço da Soja (Saca)");

    const autoPack = DomainMarketPackMapper.getPackForDomain("automotive");
    expect(autoPack.quotesToWatch).toContain("SELIC_RATE");
    expect(autoPack.externalIndicators).toContain("Taxa Selic Anual");

    const constPack = DomainMarketPackMapper.getPackForDomain("construction");
    expect(constPack.quotesToWatch).toContain("INCC_FGV");
    expect(constPack.externalIndicators).toContain("Índice INCC (FGV)");
  });

  it("2. should return empty list if API is not configured", async () => {
    expect(marketIntelligenceEngine.isConfigured()).toBe(false);

    const news = await marketIntelligenceEngine.getMarketNews("agribusiness");
    const quotes = await marketIntelligenceEngine.getMarketQuotes("agribusiness");
    const signals = await marketIntelligenceEngine.getMarketSignals("agribusiness");

    expect(news.length).toBe(0);
    expect(quotes.length).toBe(0);
    expect(signals.length).toBe(0);
  });

  it("3. should load market intelligence indicators when API is configured", async () => {
    marketIntelligenceEngine.setApiKey("TEST_API_KEY");
    expect(marketIntelligenceEngine.isConfigured()).toBe(true);

    // Agribusiness
    const agroQuotes = await marketIntelligenceEngine.getMarketQuotes("agribusiness");
    expect(agroQuotes.length).toBeGreaterThan(0);
    const soja = agroQuotes.find(q => q.symbol === "SOJA_EXCHANGE");
    expect(soja).toBeDefined();
    expect(soja?.price).toBe(138.50);

    const agroSignals = await marketIntelligenceEngine.getMarketSignals("agribusiness");
    const climateAlert = agroSignals.find(s => s.type === "alert");
    expect(climateAlert?.title).toContain("La Niña");

    // Automotive
    const autoQuotes = await marketIntelligenceEngine.getMarketQuotes("automotive");
    const selic = autoQuotes.find(q => q.symbol === "SELIC_RATE");
    expect(selic?.price).toBe(10.50);

    // Construction
    const constQuotes = await marketIntelligenceEngine.getMarketQuotes("construction");
    const incc = constQuotes.find(q => q.symbol === "INCC_FGV");
    expect(incc?.price).toBe(1085.60);
  });
});
