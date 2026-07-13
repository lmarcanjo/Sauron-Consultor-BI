/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Globe, ShieldAlert, Award, TrendingUp, Key, Calendar, Newspaper, Activity, RefreshCw } from "lucide-react";
import { marketIntelligenceEngine } from "../core/market-intelligence/MarketIntelligenceEngine";
import { DomainMarketPackMapper } from "../core/market-intelligence/DomainMarketPackMapper";
import { MarketNews, MarketQuote, MarketSignal } from "../core/market-intelligence/MarketIntelligenceTypes";

interface MarketIntelligencePanelProps {
  domainId: string;
}

export const MarketIntelligencePanel: React.FC<MarketIntelligencePanelProps> = ({ domainId }) => {
  const [configured, setConfigured] = useState(marketIntelligenceEngine.isConfigured());
  const [apiKeyInput, setApiKeyInput] = useState(marketIntelligenceEngine.getApiKey() || "");
  const [news, setNews] = useState<MarketNews[]>([]);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(false);

  const pack = DomainMarketPackMapper.getPackForDomain(domainId);

  const loadData = async () => {
    if (!marketIntelligenceEngine.isConfigured()) return;
    setLoading(true);
    try {
      const [n, q, s] = await Promise.all([
        marketIntelligenceEngine.getMarketNews(domainId),
        marketIntelligenceEngine.getMarketQuotes(domainId),
        marketIntelligenceEngine.getMarketSignals(domainId)
      ]);
      setNews(n);
      setQuotes(q);
      setSignals(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [domainId, configured]);

  const handleConfigure = (key: string) => {
    marketIntelligenceEngine.setApiKey(key);
    setConfigured(true);
  };

  const handleDeconfigure = () => {
    marketIntelligenceEngine.setApiKey("");
    marketIntelligenceEngine.setConfigured(false);
    setConfigured(false);
    setNews([]);
    setQuotes([]);
    setSignals([]);
  };

  if (!configured) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 font-sans text-slate-100 shadow-lg">
        <Globe size={40} className="mx-auto text-slate-500 animate-pulse" />
        <div>
          <h3 className="text-sm font-black uppercase text-white tracking-wider">Inteligência de mercado não configurada</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm mx-auto">
            Vincule as chaves de API externas do segmento para liberar feeds, cotações de commodities e taxas macroeconômicas.
          </p>
        </div>
        <div className="flex gap-2 justify-center max-w-xs mx-auto">
          <input
            type="password"
            placeholder="Chave de API do Hub"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
          />
          <button
            onClick={() => handleConfigure(apiKeyInput || "SIMULATOR_DEMO_KEY")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase rounded-lg cursor-pointer shrink-0"
          >
            Ativar Hub
          </button>
        </div>
      </div>
    );
  }

  const alerts = signals.filter(s => s.type === "alert");
  const opportunities = signals.filter(s => s.type === "opportunity");
  const risks = signals.filter(s => s.type === "risk");

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6 font-sans text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Globe className="text-blue-500 animate-spin-slow" size={20} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Inteligência de Mercado</h3>
            <p className="text-[10px] font-bold text-slate-450 uppercase">Monitoramento Externo do Setor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-750 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleDeconfigure}
            className="px-2 py-1 bg-slate-800 hover:bg-rose-900 hover:text-white rounded-lg text-[9px] font-black text-slate-400 uppercase transition-all cursor-pointer"
          >
            Desativar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-400">
          Carregando inteligência de mercado...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Quotes */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-slate-300 font-black uppercase text-xs">
              <TrendingUp size={16} className="text-emerald-500" />
              <span>Cotações e Índices</span>
            </div>
            <div className="space-y-2">
              {quotes.map(quote => (
                <div key={quote.symbol} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{quote.symbol}</p>
                    <p className="text-xs font-black text-white mt-0.5">{quote.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-100 font-mono">
                      {quote.unit} {quote.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-[10px] font-bold font-mono ${quote.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {quote.change >= 0 ? "+" : ""}{quote.changePercent}%
                    </span>
                  </div>
                </div>
              ))}
              {quotes.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">Nenhum índice disponível.</p>
              )}
            </div>
          </div>

          {/* Col 2: Risks & Opportunities */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-slate-300 font-black uppercase text-xs">
              <ShieldAlert size={16} className="text-amber-500" />
              <span>Riscos & Oportunidades</span>
            </div>
            <div className="space-y-3">
              {/* Alerts & Risks */}
              {alerts.concat(risks).map(sig => (
                <div key={sig.id} className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase bg-rose-550/20 text-rose-450 px-1.5 py-0.5 rounded">
                      {sig.type === "alert" ? "Alerta" : "Risco"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500">{sig.source}</span>
                  </div>
                  <p className="text-xs font-black text-rose-200">{sig.title}</p>
                  <p className="text-[11px] font-medium text-rose-350 leading-relaxed">{sig.description}</p>
                </div>
              ))}

              {/* Opportunities */}
              {opportunities.map(sig => (
                <div key={sig.id} className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase bg-emerald-550/20 text-emerald-450 px-1.5 py-0.5 rounded">
                      Oportunidade
                    </span>
                    <span className="text-[9px] font-bold text-slate-500">{sig.source}</span>
                  </div>
                  <p className="text-xs font-black text-emerald-200">{sig.title}</p>
                  <p className="text-[11px] font-medium text-emerald-350 leading-relaxed">{sig.description}</p>
                </div>
              ))}

              {signals.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">Nenhum sinal detectado.</p>
              )}
            </div>
          </div>

          {/* Col 3: News */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-slate-300 font-black uppercase text-xs">
              <Newspaper size={16} className="text-blue-500" />
              <span>Notícias do Setor</span>
            </div>
            <div className="space-y-3">
              {news.map(item => (
                <div key={item.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-blue-450 uppercase">{item.source}</span>
                    <span className="text-[9px] font-bold text-slate-550">
                      {new Date(item.publishedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-100 leading-snug">{item.title}</h4>
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed">{item.summary}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[9px] font-black uppercase px-1 py-0.5 rounded ${
                      item.sentiment === "positive" ? "bg-emerald-950 text-emerald-450" :
                      item.sentiment === "negative" ? "bg-rose-950 text-rose-450" : "bg-slate-900 text-slate-400"
                    }`}>
                      Sentimento: {item.sentiment}
                    </span>
                  </div>
                </div>
              ))}
              {news.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">Nenhuma notícia recente.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
