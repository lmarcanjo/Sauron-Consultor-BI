/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceContext, ContextTab } from "./types";
import { accessControlEngine } from "../identity/AccessControlEngine";

export class ContextTabsEngine {
  private static instance: ContextTabsEngine;

  private constructor() {}

  public static getInstance(): ContextTabsEngine {
    if (!ContextTabsEngine.instance) {
      ContextTabsEngine.instance = new ContextTabsEngine();
    }
    return ContextTabsEngine.instance;
  }

  /**
   * Generates permissible tabs list depending on what kind of entity is currently selected in context.
   */
  public getTabsForContext(context: WorkspaceContext): ContextTab[] {
    const user = context.currentUser;
    const entity = context.entidadeSelecionada;

    if (!entity) {
      // Default macro-workspace tabs
      const tabs: ContextTab[] = [
        { id: "resumo", label: "Cockpit Executivo", icon: "LayoutGrid" },
        { id: "financeiro", label: "Análise Contábil/Financeira", icon: "TrendingUp" },
        { id: "comercial", label: "Visão Comercial", icon: "ShoppingBag" },
        { id: "pos_vendas", label: "Pós-Vendas", icon: "Users" },
        { id: "plano_executivo", label: "Plano Estratégico", icon: "Target" },
        { id: "auditoria_logs", label: "Trilha de Auditoria", icon: "FileCode" }
      ];

      return tabs.filter(t => {
        if (t.id === "auditoria_logs") return accessControlEngine.can(user, "audit.view");
        if (t.id === "plano_executivo") return accessControlEngine.can(user, "action.view");
        return true;
      });
    }

    // Entity is selected
    if (entity.type === "company" || entity.type === "group" || entity.type === "store") {
      const tabs: ContextTab[] = [
        { id: "resumo", label: "Resumo", icon: "BarChart3" },
        { id: "financeiro", label: "Financeiro", icon: "DollarSign" },
        { id: "comercial", label: "Comercial", icon: "ShoppingBag" },
        { id: "pos_vendas", label: "Pessoas", icon: "UserCheck" },
        { id: "plano_executivo", label: "Plano Executivo", icon: "ShieldAlert" },
        { id: "auditoria_logs", label: "Histórico", icon: "History" }
      ];

      return tabs.filter(t => {
        if (t.id === "auditoria_logs") return accessControlEngine.can(user, "audit.view");
        if (t.id === "plano_executivo") return accessControlEngine.can(user, "action.view");
        return true;
      });
    }

    if (entity.type === "vendedor") {
      return [
        { id: "vendedor_resumo", label: "Resumo Vendedor", icon: "User" },
        { id: "vendedor_performance", label: "Performance & Metas", icon: "Flame" },
        { id: "vendedor_comissoes", label: "Comissões & Campanhas", icon: "Wallet" },
        { id: "vendedor_observacoes", label: "Observações & Feedbacks", icon: "MessageSquare" },
        { id: "vendedor_documentos", label: "Assinaturas & Contratos", icon: "FileText" }
      ];
    }

    if (entity.type === "presentation") {
      return [
        { id: "slides", label: "Slides Ativos", icon: "Presentation" },
        { id: "insights", label: "Geração de Narrativa", icon: "Sparkles" },
        { id: "decisoes", label: "Ata de Decisões", icon: "CheckSquare" },
        { id: "notas", label: "Notas do Consultor", icon: "ClipboardList" }
      ];
    }

    // Fallback default
    return [
      { id: "resumo", label: "Resumo Geral", icon: "LayoutGrid" },
      { id: "financeiro", label: "Finanças", icon: "TrendingUp" },
      { id: "comercial", label: "Vendas", icon: "ShoppingBag" }
    ];
  }
}

export const contextTabsEngine = ContextTabsEngine.getInstance();
