import { BusinessDomainManifest } from "../BusinessDomainTypes";

export const manifest: BusinessDomainManifest = {
  id: "healthcare",
  name: "Saúde",
  description: "Domain-specific concepts and indicators for healthcare providers, hospitals, patient admissions, and medical procedures.",
  subdomains: ["paciente", "convenio", "internacao"]
};
