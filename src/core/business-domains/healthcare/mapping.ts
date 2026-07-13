import { BusinessDomainMapping } from "../BusinessDomainTypes";

export const mapping: BusinessDomainMapping = {
  suggestedMappings: {
    "Paciente": "Cliente",
    "Convênio": "Produto",
    "Internação": "Departamento",
    "Procedimento": "Categoria",
    "Taxa de ocupação": "TaxaDeOcupacao",
    "Tempo médio": "TempoMedio"
  }
};
