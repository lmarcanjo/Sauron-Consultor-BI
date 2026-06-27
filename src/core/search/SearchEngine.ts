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
        const clients: SearchResultItem[] = [
          { 
            id: "proj_1", 
            title: "Grupo Comercial Alpha", 
            subtitle: "Caso de concessionárias ativas", 
            category: "Caso", 
            targetTab: "executive_workspace",
            requiredPermission: "workspace.view",
            contextEntity: { id: "case_alpha", type: "case", name: "Grupo Comercial Alpha" }
          },
          { 
            id: "c_1", 
            title: "Alpha Nissan", 
            subtitle: "Concessionária Nissan do Grupo Alpha (Feira de Santana)", 
            category: "Empresa", 
            targetTab: "executive_workspace",
            requiredPermission: "analytics.view",
            contextEntity: { id: "company_alpha_nissan", type: "company", name: "Alpha Nissan", metadata: { brand: "Nissan" } }
          },
          { 
            id: "c_2", 
            title: "Alpha Renault", 
            subtitle: "Concessionária Renault do Grupo Alpha (Feira de Santana)", 
            category: "Empresa", 
            targetTab: "executive_workspace",
            requiredPermission: "analytics.view",
            contextEntity: { id: "company_alpha_renault", type: "company", name: "Alpha Renault", metadata: { brand: "Renault" } }
          },
          { 
            id: "cnpj_1", 
            title: "00.123.456/0001-01", 
            subtitle: "CNPJ Alpha Nissan (Feira de Santana)", 
            category: "CNPJ", 
            targetTab: "executive_workspace",
            requiredPermission: "analytics.view",
            contextEntity: { id: "company_alpha_nissan", type: "company", name: "Alpha Nissan", metadata: { brand: "Nissan" } }
          }
        ];
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
        const sellers: SearchResultItem[] = [
          {
            id: "vend_1",
            title: "Carlos Silva",
            subtitle: "Consultor de Vendas Destaque — Unidade Alpha Nissan",
            category: "Vendedor",
            targetTab: "executive_workspace",
            requiredPermission: "action.view", // Under commissions or people intelligence
            contextEntity: { id: "vendedor_1", type: "vendedor", name: "Carlos Silva", metadata: { role: "Destaque Nissan", store: "Nissan Feira" } }
          },
          {
            id: "vend_2",
            title: "Amanda Souza",
            subtitle: "Consultor de Vendas Destaque — Unidade Alpha Renault",
            category: "Vendedor",
            targetTab: "executive_workspace",
            requiredPermission: "action.view",
            contextEntity: { id: "vendedor_2", type: "vendedor", name: "Amanda Souza", metadata: { role: "Destaque Renault", store: "Renault Feira" } }
          }
        ];
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
        const plans: SearchResultItem[] = [
          { id: "act_1", title: "Renegociar taxas de recebíveis", subtitle: "Finanças • Alta Prioridade", category: "Plano", targetTab: "executive_workspace", requiredPermission: "action.view" },
          { id: "act_2", title: "Rito de precificação de Seminovos", subtitle: "Giro de Estoque • Média Prioridade", category: "Plano", targetTab: "executive_workspace", requiredPermission: "action.view" },
          { id: "act_3", title: "Revisar comissão técnica da Oficina", subtitle: "Operações • Baixa Prioridade", category: "Plano", targetTab: "executive_workspace", requiredPermission: "action.view" }
        ];
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
        const pres: SearchResultItem[] = [
          { id: "pres_1", title: "Relatório de Fechamento Operacional Q2", subtitle: "Apresentação para o Conselho", category: "Apresentação", targetTab: "apresentacoes", requiredPermission: "presentation.view" },
          { id: "pres_2", title: "Ata da Reunião de Diretoria de Finanças", subtitle: "Comitê de Auditoria", category: "Ata", targetTab: "modo_reuniao", requiredPermission: "meeting.view" },
          { id: "rep_1", title: "Análise Tributária Monofásica de Autopeças", subtitle: "Estudo Fiscal", category: "Relatório", targetTab: "resumo", requiredPermission: "analytics.view" }
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
