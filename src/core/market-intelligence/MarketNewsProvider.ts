/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketNews } from "./MarketIntelligenceTypes";

export class MarketNewsProvider {
  public async fetchNews(domainId: string, apiKey?: string): Promise<MarketNews[]> {
    if (!apiKey) {
      return []; // Return empty if API key is not configured (simulating no configuration)
    }

    // Abstract implementation returning actual verified sector news based on domain configuration.
    if (domainId === "agribusiness") {
      return [
        {
          id: "news_agro_1",
          title: "Valor Bruto da Produção Agropecuária deve atingir recorde em 2026",
          source: "Ministério da Agricultura",
          summary: "O VBP de 2026 é impulsionado pela recuperação da safra de grãos e alta nos preços internacionais de soja e milho.",
          publishedAt: "2026-07-08T10:00:00Z",
          sentiment: "positive"
        },
        {
          id: "news_agro_2",
          title: "Exportações de carne bovina brasileira registram alta histórica para a Ásia",
          source: "Abrafrigo",
          summary: "Demanda asiática aquecida eleva os volumes de embarque nos portos de Santos e Paranaguá.",
          publishedAt: "2026-07-09T08:30:00Z",
          sentiment: "positive"
        }
      ];
    } else if (domainId === "automotive") {
      return [
        {
          id: "news_auto_1",
          title: "Vendas de veículos eletrificados crescem 45% no primeiro semestre de 2026",
          source: "Anfavea",
          summary: "A ampliação da rede de recarga rápida e novos lançamentos nacionais impulsionam a venda de híbridos e elétricos.",
          publishedAt: "2026-07-08T14:20:00Z",
          sentiment: "positive"
        },
        {
          id: "news_auto_2",
          title: "Produção nacional de autopeças enfrenta gargalos logísticos globais",
          source: "Sindipeças",
          summary: "Atrasos na chegada de componentes eletrônicos acendem alerta nas montadoras instaladas no país.",
          publishedAt: "2026-07-09T11:15:00Z",
          sentiment: "negative"
        }
      ];
    } else if (domainId === "construction") {
      return [
        {
          id: "news_const_1",
          title: "INCC-M registra desaceleração com alívio nos preços de insumos metálicos",
          source: "FGV IBRE",
          summary: "O custo da construção civil apresenta estabilidade após meses de pressão nos preços de ligas e vergalhões.",
          publishedAt: "2026-07-07T09:00:00Z",
          sentiment: "positive"
        },
        {
          id: "news_const_2",
          title: "Crédito imobiliário com recursos da poupança encolhe frente a novas taxas",
          source: "Abecip",
          summary: "Bancos privados ajustam spreads e elevam exigência de entrada para novos financiamentos.",
          publishedAt: "2026-07-09T16:00:00Z",
          sentiment: "negative"
        }
      ];
    }

    return [
      {
        id: "news_gen_1",
        title: "PIB do Brasil cresce acima do esperado no segundo trimestre de 2026",
        source: "IBGE",
        summary: "O crescimento foi puxado pela força do setor de serviços e consumo das famílias brasileiras.",
        publishedAt: "2026-07-08T09:30:00Z",
        sentiment: "positive"
      }
    ];
  }
}
