import { BusinessDomainManifest } from "../BusinessDomainTypes";

export const manifest: BusinessDomainManifest = {
  id: "industry",
  name: "Indústria",
  description: "Domain-specific concepts and indicators for manufacturing plants, production lines, OEE, and industrial efficiency.",
  subdomains: ["fabrica", "linha", "producao"]
};
