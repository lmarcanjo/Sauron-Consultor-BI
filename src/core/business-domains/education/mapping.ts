import { BusinessDomainMapping } from "../BusinessDomainTypes";

export const mapping: BusinessDomainMapping = {
  suggestedMappings: {
    "Aluno": "Cliente",
    "Professor": "Vendedor",
    "Turma": "Departamento",
    "Disciplina": "Produto",
    "Matrículas": "Receita",
    "Frequência": "Frequencia"
  }
};
