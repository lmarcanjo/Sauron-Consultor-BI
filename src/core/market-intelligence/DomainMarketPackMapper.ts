/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DomainMarketPack {
  domainId: string;
  quotesToWatch: string[]; // List of quote codes/symbols
  signalsToWatch: string[];
  externalIndicators: string[];
  feedQueries: string[];
}

export class DomainMarketPackMapper {
  public static getPackForDomain(domainId: string): DomainMarketPack {
    switch (domainId) {
      case "agribusiness":
        return {
          domainId,
          quotesToWatch: ["SOJA_EXCHANGE", "MILHO_EXCHANGE", "BOI_GORDO_B3", "USD_BRL", "EUR_BRL"],
          signalsToWatch: ["CLIMA_PROD", "LOGISTICA_FRETE", "EXPORTACOES_MDIC"],
          externalIndicators: ["Preço da Soja (Saca)", "Preço do Milho (Saca)", "Boi Gordo (Arroba)", "Dólar Comercial", "Frete Reboque/km"],
          feedQueries: ["agronegocio", "agropecuaria", "safra", "commodities agricolas"],
        };
      case "automotive":
        return {
          domainId,
          quotesToWatch: ["SELIC_RATE", "FIPE_CARROS", "USD_BRL"],
          signalsToWatch: ["TAXA_JUROS_CREDITO", "DADOS_MONTADORAS", "EMPLACAMENTOS_FENABRAVE"],
          externalIndicators: ["Taxa Selic Anual", "Índice de Preços Setoriais", "Crédito Comercial", "Vendas do segmento"],
          feedQueries: ["mercado especializado", "vendas do segmento", "indicadores comerciais"],
        };
      case "construction":
        return {
          domainId,
          quotesToWatch: ["INCC_FGV", "ACO_PRECO_TON", "CIMENTO_PRECO_SC", "SELIC_RATE"],
          signalsToWatch: ["FINANCIAMENTO_IMOBILIARIO", "CUSTOS_INCC"],
          externalIndicators: ["Taxa Selic", "Índice INCC (FGV)", "Custo Aço/t", "Crédito Imobiliário Caixa"],
          feedQueries: ["construcao civil", "mercado imobiliario", "incc fgv", "incorporadoras pib"],
        };
      default:
        // Fallback for generic or unknown domains (e.g. shared / services)
        return {
          domainId: domainId || "shared",
          quotesToWatch: ["SELIC_RATE", "USD_BRL", "IPCA_INFLATION"],
          signalsToWatch: ["INFLACAO_PAIS", "PIB_CRESCIMENTO"],
          externalIndicators: ["Taxa Selic Anual", "Dólar Comercial", "Inflação IPCA (Acumulada)"],
          feedQueries: ["economia brasileira", "mercado financeiro", "pib brasil"],
        };
    }
  }
}
