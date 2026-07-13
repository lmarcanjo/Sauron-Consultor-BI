/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MarketNews {
  id: string;
  title: string;
  source: string;
  url?: string;
  summary: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  lastUpdated: string;
}

export interface MarketSignal {
  id: string;
  type: "alert" | "opportunity" | "risk";
  title: string;
  description: string;
  strength: "low" | "medium" | "high";
  source: string;
}

export interface MarketIntelligenceConfig {
  apiKey?: string;
  apiUrl?: string;
  enabled: boolean;
}
