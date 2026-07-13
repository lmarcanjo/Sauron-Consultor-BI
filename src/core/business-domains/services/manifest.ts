import { BusinessDomainManifest } from "../BusinessDomainTypes";

export const manifest: BusinessDomainManifest = {
  id: "services",
  name: "Serviços",
  description: "Domain-specific concepts and indicators for professional services, project allocation, contracts, consultant hours, and billing.",
  subdomains: ["projeto", "contrato", "consultor"]
};
