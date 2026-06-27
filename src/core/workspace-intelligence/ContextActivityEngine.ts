/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContextActivity, WorkspaceContext } from "./types";

export class ContextActivityEngine {
  private static instance: ContextActivityEngine;
  private activities: ContextActivity[] = [];

  private constructor() {
    this.seedDefaultActivities();
  }

  public static getInstance(): ContextActivityEngine {
    if (!ContextActivityEngine.instance) {
      ContextActivityEngine.instance = new ContextActivityEngine();
    }
    return ContextActivityEngine.instance;
  }

  private seedDefaultActivities() {
    this.activities = [
      {
        id: "act_1",
        title: "Relatório de Fechamento Emitido",
        description: "PDF executivo consolidado exportado para o conselho fiscal da holding.",
        category: "pdf_exported",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        user: { name: "Lennon Marcanjo" },
        contextTags: { orgId: "org_arcanjo", caseId: "case_alpha", companyId: "company_alpha_nissan" }
      },
      {
        id: "act_2",
        title: "Integração do Banco de Dados Relacional",
        description: "Tabelas de faturamento real sincronizadas via IPsec Tunneling com o PostgreSQL.",
        category: "db_synced",
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
        user: { name: "Sauron Core DB System" },
        contextTags: { orgId: "org_arcanjo" }
      },
      {
        id: "act_3",
        title: "Auditoria de Comissão Aprovada",
        description: "Aprovação de comissões calculadas para o vendedor destaque Carlos Silva.",
        category: "commission_approved",
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        user: { name: "Aline Santos" },
        contextTags: { orgId: "org_arcanjo", caseId: "case_alpha", vendedorId: "vendedor_1" }
      },
      {
        id: "act_4",
        title: "Plano Estratégico Atualizado",
        description: "Novo plano estratégico 'Aceleração Nissan Feira' ativado com 5 ações pendentes.",
        category: "plan_created",
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        user: { name: "Lennon Marcanjo" },
        contextTags: { orgId: "org_arcanjo", caseId: "case_alpha" }
      },
      {
        id: "act_5",
        title: "Ata de Reunião de Alinhamento",
        description: "Ata de reunião gerada automaticamente pelo assistente de IA Sauron.",
        category: "session_realized",
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        user: { name: "Aline Santos" },
        contextTags: { orgId: "org_arcanjo", caseId: "case_alpha", companyId: "company_alpha_renault" }
      }
    ];
  }

  /**
   * Fetch all activities in the feed.
   */
  public getActivities(): ContextActivity[] {
    return this.activities;
  }

  /**
   * Logs/Appends a new business activity to the unified stream.
   */
  public logActivity(
    title: string,
    description: string,
    category: ContextActivity["category"],
    userName: string,
    tags: ContextActivity["contextTags"]
  ): ContextActivity {
    const newAct: ContextActivity = {
      id: "act_" + crypto.randomUUID().substring(0, 8),
      title,
      description,
      category,
      timestamp: new Date().toISOString(),
      user: { name: userName },
      contextTags: tags
    };
    this.activities.unshift(newAct);
    return newAct;
  }

  /**
   * Filters the activity stream dynamically based on the active user context scope.
   */
  public getFilteredActivities(context: WorkspaceContext): ContextActivity[] {
    const { currentUser, currentOrganization, currentCase, CNPJ, vendedor, entidadeSelecionada } = context;

    return this.activities.filter((act) => {
      // 1. Organization filtering
      if (act.contextTags.orgId && act.contextTags.orgId !== currentOrganization.id) {
        return false;
      }

      // 2. Access bounds by role: if Guest or Viewer, filter by specific target stores/vendedores
      if (currentUser.role === "Viewer" || currentUser.role === "Guest") {
        // Simple constraint: Viewer only sees general or specific non-restricted activities
        if (vendedor && act.contextTags.vendedorId && act.contextTags.vendedorId !== vendedor.id) {
          return false;
        }
      }

      // 3. Drill-down filtering based on context selections
      if (entidadeSelecionada) {
        if (entidadeSelecionada.type === "company" && act.contextTags.companyId) {
          return act.contextTags.companyId === entidadeSelecionada.id || act.contextTags.companyId.includes(entidadeSelecionada.name);
        }
        if (entidadeSelecionada.type === "vendedor" && act.contextTags.vendedorId) {
          return act.contextTags.vendedorId === entidadeSelecionada.id;
        }
        if (entidadeSelecionada.type === "case" && act.contextTags.caseId) {
          return act.contextTags.caseId === entidadeSelecionada.id;
        }
      } else if (currentCase) {
        // If case is active but no specific entity selected, filter by current case
        if (act.contextTags.caseId && act.contextTags.caseId !== currentCase.id) {
          return false;
        }
      }

      return true;
    });
  }
}

export const contextActivityEngine = ContextActivityEngine.getInstance();
