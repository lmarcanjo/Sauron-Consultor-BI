/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { accessControlEngine } from "../identity/AccessControlEngine";
import { identityEngine } from "../identity/IdentityEngine";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Cliente" | "Empresa" | "CNPJ" | "Plano" | "Apresentação" | "Ata" | "Reunião" | "Relatório" | "Caso" | "Vendedor" | "Perfil";
  targetTab?: string;
  metadata?: any;
  requiredPermission?: string;
  contextEntity?: { id: string; type: 'company' | 'store' | 'vendedor' | 'presentation' | 'case' | 'group' | 'other'; name: string; metadata?: any };
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
   * Search across all registered providers, filtering by active user permissions.
   */
  public search(query: string): SearchResultItem[] {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const currentUser = identityEngine.getCurrentUser();
    const results: SearchResultItem[] = [];

    this.providers.forEach((p) => {
      try {
        const provRes = p.search(cleanQuery);
        
        // Securely filter results by checking user permission policies
        const filtered = provRes.filter(item => {
          if (!item.requiredPermission) return true;
          return accessControlEngine.can(currentUser, item.requiredPermission as any);
        });

        results.push(...filtered);
      } catch (e) {
        console.error(`Error querying search provider [${p.name}]:`, e);
      }
    });

    return results;
  }

  private registerDefaultProviders(): void {
    // 1. Cases/Clients/Companies provider (highly context aware)
    this.registerProvider({
      name: "cases-provider",
      search: (q) => {
        const clients: SearchResultItem[] = [];
        return clients.filter(c => 
          c.title.toLowerCase().includes(q) || 
          c.subtitle.toLowerCase().includes(q)
        );
      }
    });

    // 2. Vendedores/Sellers provider
    this.registerProvider({
      name: "vendedores-provider",
      search: (q) => {
        const sellers: SearchResultItem[] = [];
        return sellers.filter(s => 
          s.title.toLowerCase().includes(q) || 
          s.subtitle.toLowerCase().includes(q)
        );
      }
    });

    // 3. Action plans/Tasks provider
    this.registerProvider({
      name: "action-plans-provider",
      search: (q) => {
        const plans: SearchResultItem[] = [];
        return plans.filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.subtitle.toLowerCase().includes(q)
        );
      }
    });

    // 4. Slides & Presentations provider
    this.registerProvider({
      name: "presentations-provider",
      search: (q) => {
        const pres: SearchResultItem[] = [];
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
