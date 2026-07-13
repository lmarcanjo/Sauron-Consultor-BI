import { BusinessVocabulary } from "../BusinessDomainTypes";

export const vocabulary: BusinessVocabulary = {
  terms: [
    { term: "Fazenda", synonyms: ["Propriedade", "Sítio", "Gleba", "Estância"] },
    { term: "Talhão", synonyms: ["Lote", "Área de Plantio", "Parcela", "Divisão"] },
    { term: "Safra", synonyms: ["Ciclo", "Colheita do Ano", "Temporada", "Período Produtivo"] },
    { term: "Packing", synonyms: ["Embalagem", "Linha de Seleção", "Processamento"] },
    { term: "Packing House", synonyms: ["Galpão de Embalagem", "Centro de Processamento", "Beneficiadora"] },
    { term: "Armazém", synonyms: ["Silo", "Depósito", "Estoque de Grãos", "Tulha"] },
    { term: "Hectare", synonyms: ["Área Cultivada", "HA", "Medida de Terra"] },
    { term: "Lavoura", synonyms: ["Plantio", "Cultura", "Área Plantada"] },
    { term: "Insumo", synonyms: ["Fertilizante", "Defensivo", "Semente", "Adubo"] },
    { term: "Produtor", synonyms: ["Fornecedor", "Cooperado", "Agricultor", "Fazendeiro"] }
  ]
};
