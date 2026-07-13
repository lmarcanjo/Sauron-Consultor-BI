import { BusinessDomainManifest } from "../BusinessDomainTypes";

export const manifest: BusinessDomainManifest = {
  id: "agribusiness",
  name: "Agronegócio",
  description: "Domain-specific concepts and indicators for agribusiness, farming, crop management, and supply chain.",
  subdomains: ["lavoura", "packing", "armazem", "safra"]
};
