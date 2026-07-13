import { BusinessDomainManifest } from "../BusinessDomainTypes";

export const manifest: BusinessDomainManifest = {
  id: "education",
  name: "Educação",
  description: "Domain-specific concepts and indicators for educational institutions, schools, student enrollment, courses, and classes.",
  subdomains: ["aluno", "professor", "turma"]
};
