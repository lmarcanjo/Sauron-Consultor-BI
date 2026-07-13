import { BusinessVocabulary } from "../BusinessDomainTypes";

export const vocabulary: BusinessVocabulary = {
  terms: [
    { term: "Paciente", synonyms: ["Cliente", "Beneficiário", "Usuário", "Admitido"] },
    { term: "Convênio", synonyms: ["Plano de Saúde", "Operadora", "Seguro Saúde"] },
    { term: "Internação", synonyms: ["Admissão", "Hospitalização", "Estadia em Leito"] },
    { term: "Procedimento", synonyms: ["Exame", "Cirurgia", "Consulta", "Atendimento Médico"] }
  ]
};
