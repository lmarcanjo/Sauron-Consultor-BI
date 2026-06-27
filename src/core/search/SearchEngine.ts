/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Cliente" | "Empresa" | "CNPJ" | "Plano" | "Apresentação" | "Ata" | "Reunião" | "Relatório" | "Caso";
  targetTab?: string;
  metadata?: any;
}

export interface SearchProvider {
  name: string;
  search(query: string): SearchResultItem[];
}

class SearchEngine {
  private providers: Set<SearchProvider> = new Set();

  constructor() {
    this.registerDefaultProviders();
  }

  /**
   * Register a search provider.
   */
  public registerProvider(provider: SearchProvider): void {
    this.providers.add(provider);
  }

  /**
   * Unregister a search provider.
   */
  public unregisterProvider(provider: SearchProvider): void {
    this.providers.delete(provider);
  }

  /**
   * Search across all registered providers.
   */
  public search(query: string): SearchResultItem[] {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const results: SearchResultItem[] = [];
    this.providers.forEach((p) => {
      try {
        const provRes = p.search(cleanQuery);
        results.push(...provRes);
      } catch (e) {
        console.error(`Error querying search provider [${p.name}]:`, e);
      }
    });

    return results;
  }

  private registerDefaultProviders(): void {
    // 1. Cases/Clients provider
    this.registerProvider({
      name: "cases-provider",
      search: (q) => {
        const clients = [
          { id: "proj_1", title: "Grupo Topázio Veículos", subtitle: "Automotivo (Concessionárias)", category: "Caso" as const, targetTab: "central_dados" },
          { id: "c_1", title: "Topázio Nissan", subtitle: "Grupo Topázio Veículos", category: "Empresa" as const, targetTab: "central_dados" },
          { id: "c_2", title: "Topázio Renault", subtitle: "Grupo Topázio Veículos", category: "Empresa" as const, targetTab: "central_dados" },
          { id: "cnpj_1", title: "00.123.456/0001-01", subtitle: "CNPJ Topázio Nissan", category: "CNPJ" as const, targetTab: "central_dados" }
        ];
        return clients.filter(c => 
          c.title.toLowerCase().includes(q) || 
          c.subtitle.toLowerCase().includes(q)
        );
      }
    });

    // 2. Action plans/Tasks provider
    this.registerProvider({
      name: "action-plans-provider",
      search: (q) => {
        const plans = [
          { id: "act_1", title: "Renegociar taxas de recebíveis", subtitle: "Finanças • Alta Prioridade", category: "Plano" as const, targetTab: "consultor_workspace" },
          { id: "act_2", title: "Rito de precificação de Seminovos", subtitle: "Giro de Estoque • Média Prioridade", category: "Plano" as const, targetTab: "consultor_workspace" },
          { id: "act_3", title: "Revisar comissão técnica da Oficina", subtitle: "Operações • Baixa Prioridade", category: "Plano" as const, targetTab: "consultor_workspace" }
        ];
        return plans.filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.subtitle.toLowerCase().includes(q)
        );
      }
    });

    // 3. Slides & Presentations provider
    this.registerProvider({
      name: "presentations-provider",
      search: (q) => {
        const pres = [
          { id: "pres_1", title: "Relatório de Fechamento Operacional Q2", subtitle: "Apresentação para o Conselho", category: "Apresentação" as const, targetTab: "apresentacoes" },
          { id: "pres_2", title: "Ata da Reunião de Diretoria de Finanças", subtitle: "Comitê de Auditoria", category: "Ata" as const, targetTab: "modo_reuniao" },
          { id: "rep_1", title: "Análise Tributária Monofásica de Autopeças", subtitle: "Estudo Fiscale", category: "Relatório" as const, targetTab: "contabil" }
        ];
        return pres.filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.subtitle.toLowerCase().includes(q)
        );
      }
    });
  }
}

export const searchEngine = new SearchEngine();
export default searchEngine;
