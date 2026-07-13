import { BusinessDomainManifest } from "../BusinessDomainTypes";

export const manifest: BusinessDomainManifest = {
  id: "retail",
  name: "Varejo",
  description: "Domain-specific concepts and indicators for retail, store performance, point of sales (PDV), and SKU management.",
  subdomains: ["loja", "pdv", "caixa"]
};
