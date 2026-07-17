export interface FilterConfig {
  column: string;
  label: string;
  active: boolean;
  type: string;
  scope: string;
}

const DEFAULT_FILTERS: FilterConfig[] = [
  { column: "Grupo", label: "Grupo Empresarial", active: true, type: "multi", scope: "manager" },
  { column: "CNPJ", label: "Chave CNPJ", active: true, type: "list", scope: "standard" },
  { column: "Marca", label: "Bandeira / Marca", active: true, type: "multi", scope: "standard" },
  { column: "Empresa", label: "Estabelecimento Filial", active: true, type: "multi", scope: "standard" },
  { column: "Mês", label: "Meses de Competência", active: true, type: "date", scope: "standard" },
  { column: "Razão", label: "Tipo de Operação", active: false, type: "list", scope: "consultant" },
];

class ClientFilterManagerClass {
  private configs: FilterConfig[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sauron_client_filters");
        if (stored) {
          this.configs = JSON.parse(stored);
          return;
        }
      } catch (err) {
        console.error("Error loading filters from storage:", err);
      }
    }
    this.configs = [...DEFAULT_FILTERS];
  }

  public saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sauron_client_filters", JSON.stringify(this.configs));
        window.dispatchEvent(new Event("sauron_filters_updated"));
      } catch (err) {
        console.error("Error saving filters to storage:", err);
      }
    }
  }

  public getFilters(): FilterConfig[] {
    return this.configs;
  }

  public getActiveFilters(): FilterConfig[] {
    return this.configs.filter(c => c.active);
  }

  public setFilters(newConfigs: FilterConfig[]) {
    this.configs = [...newConfigs];
    this.saveToStorage();
  }

  public addFilter(column: string, label: string, type: string, scope: string) {
    if (this.configs.some(c => c.column.toLowerCase() === column.toLowerCase())) {
      return;
    }
    this.configs.push({
      column,
      label,
      active: true,
      type,
      scope,
    });
    this.saveToStorage();
  }

  public removeFilter(column: string) {
    this.configs = this.configs.filter(c => c.column.toLowerCase() !== column.toLowerCase());
    this.saveToStorage();
  }

  public updateFilter(column: string, updates: Partial<FilterConfig>) {
    this.configs = this.configs.map(c => {
      if (c.column.toLowerCase() === column.toLowerCase()) {
        return { ...c, ...updates };
      }
      return c;
    });
    this.saveToStorage();
  }

  public isFilterActive(col: string): boolean {
    const found = this.configs.find(c => c.column.toLowerCase() === col.toLowerCase());
    return found ? found.active : false;
  }

  public getFilterLabel(col: string): string {
    const found = this.configs.find(c => c.column.toLowerCase() === col.toLowerCase());
    return found ? found.label : col;
  }
}

export const ClientFilterManager = new ClientFilterManagerClass();
