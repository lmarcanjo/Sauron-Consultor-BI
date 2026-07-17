import { businessDomainRegistry } from "./BusinessDomainRegistry";

export interface DomainDisplayOption {
  id: string;
  label: string;
}

export function getDomainDisplayOptions(): DomainDisplayOption[] {
  return businessDomainRegistry.list().map(pack => ({
    id: pack.manifest.id,
    label: pack.manifest.id === "shared" ? "Geral / Compartilhado" : (pack.manifest.displayName || pack.manifest.name),
  }));
}

export function getDomainDisplayLabel(domainId: string | null | undefined): string {
  return getDomainDisplayOptions().find(option => option.id === domainId)?.label || "Geral / Compartilhado";
}
