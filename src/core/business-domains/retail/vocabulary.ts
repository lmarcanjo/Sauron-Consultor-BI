import { BusinessVocabulary } from "../BusinessDomainTypes";

export const vocabulary: BusinessVocabulary = {
  terms: [
    { term: "Loja", synonyms: ["Filial", "Ponto de Venda", "Estabelecimento", "Boutique"] },
    { term: "PDV", synonyms: ["Terminal de Vendas", "Caixa de Loja", "Checkout"] },
    { term: "Caixa", synonyms: ["Operador de Caixa", "Frente de Caixa"] },
    { term: "SKU", synonyms: ["Código do Produto", "Referência", "Código de Barras", "EAN"] },
    { term: "Cliente", synonyms: ["Consumidor", "Comprador", "Freguês"] },
    { term: "Produto", synonyms: ["Mercadoria", "Item de Venda", "Artigo"] }
  ]
};
