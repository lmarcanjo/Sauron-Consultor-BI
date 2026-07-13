/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketNews, MarketQuote, MarketSignal } from "./MarketIntelligenceTypes";
import { MarketNewsProvider } from "./MarketNewsProvider";
import { MarketQuoteProvider } from "./MarketQuoteProvider";
import { MarketSignalProvider } from "./MarketSignalProvider";

export class MarketIntelligenceEngine {
  private newsProvider = new MarketNewsProvider();
  private quoteProvider = new MarketQuoteProvider();
  private signalProvider = new MarketSignalProvider();

  public isConfigured(): boolean {
    if (typeof window === "undefined" || !window.localStorage) return false;
    return window.localStorage.getItem("sauron_market_api_configured") === "true";
  }

  public setConfigured(configured: boolean): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem("sauron_market_api_configured", configured ? "true" : "false");
  }

  public getApiKey(): string | undefined {
    if (typeof window === "undefined" || !window.localStorage) return undefined;
    return window.localStorage.getItem("sauron_market_api_key") || undefined;
  }

  public setApiKey(key: string): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem("sauron_market_api_key", key);
    this.setConfigured(!!key.trim());
  }

  public async getMarketNews(domainId: string): Promise<MarketNews[]> {
    if (!this.isConfigured()) return [];
    return this.newsProvider.fetchNews(domainId, this.getApiKey());
  }

  public async getMarketQuotes(domainId: string): Promise<MarketQuote[]> {
    if (!this.isConfigured()) return [];
    return this.quoteProvider.fetchQuotes(domainId, this.getApiKey());
  }

  public async getMarketSignals(domainId: string): Promise<MarketSignal[]> {
    if (!this.isConfigured()) return [];
    return this.signalProvider.fetchSignals(domainId, this.getApiKey());
  }
}

export const marketIntelligenceEngine = new MarketIntelligenceEngine();
