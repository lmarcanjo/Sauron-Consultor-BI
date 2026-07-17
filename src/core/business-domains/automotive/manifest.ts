import { BusinessDomainManifest } from "../BusinessDomainTypes";

export const manifest: BusinessDomainManifest = {
  id: "automotive",
  name: "Automotivo",
  displayName: "Operação Especializada",
  description: "Domain-specific concepts and indicators for automotive dealerships, including sales, workshop, and financing.",
  subdomains: ["vendas", "oficina", "pecas", "pos-venda"]
};
