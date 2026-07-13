import { BusinessDomainManifest } from "../BusinessDomainTypes";

export const manifest: BusinessDomainManifest = {
  id: "construction",
  name: "Construção",
  description: "Domain-specific concepts and indicators for construction projects, civil engineering, stages, measurements, and budgets.",
  subdomains: ["obra", "medicao", "etapa"]
};
