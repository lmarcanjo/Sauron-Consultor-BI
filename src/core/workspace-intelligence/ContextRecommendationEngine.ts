/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceContext, ContextRecommendation } from "./types";

export class ContextRecommendationEngine {
  private static instance: ContextRecommendationEngine;

  private constructor() {}

  public static getInstance(): ContextRecommendationEngine {
    if (!ContextRecommendationEngine.instance) {
      ContextRecommendationEngine.instance = new ContextRecommendationEngine();
    }
    return ContextRecommendationEngine.instance;
  }

  /**
   * Resolves contextual alerts, recommendations and strategic recommendations based on current workspace context state.
   */
  public getRecommendationsForContext(context: WorkspaceContext): ContextRecommendation[] {
    const { entidadeSelecionada, currentCase, currentUser } = context;

    if (!entidadeSelecionada) {
      return [
        {
          id: "rec_1",
          title: "Sincronização de Dados Pendente",
          description: "O banco de dados relacional PostgreSQL possui novos lançamentos. Execute a sincronização para atualizar os relatórios executivos.",
          priority: "high",
          type: "action",
          actionLabel: "Sincronizar Banco",
          actionId: "open_central_dados"
        },
        {
          id: "rec_2",
          title: "Plano de Metas Trimestral",
          description: "Estabeleça as metas dos consultores no painel de Pessoas para o fechamento do trimestre.",
          priority: "medium",
          type: "insight",
          actionLabel: "Ver Performance",
          actionId: "open_filters"
        }
      ];
    }

    if (entidadeSelecionada.type === "company" || entidadeSelecionada.type === "store") {
      const companyName = entidadeSelecionada.name;
      return [
        {
          id: "rec_comp_1",
          title: `Alerta de Margem: ${companyName}`,
          description: "A margem média operacional de faturamento encontra-se em 9.2%, abaixo do limite estratégico estabelecido de 10.0%.",
          priority: "high",
          type: "alert"
        },
        {
          id: "rec_comp_2",
          title: "Aceleração Comercial Recomendada",
          description: "O setor comercial indica ociosidade no mix de marcas importadas. Otimizar as comissões no pós-vendas.",
          priority: "medium",
          type: "insight"
        },
        {
          id: "rec_comp_3",
          title: "Ata de Reunião Pendente",
          description: "Última sessão de auditoria executiva realizada ontem ainda não possui ata assinada.",
          priority: "high",
          type: "action",
          actionLabel: "Lavrar Ata",
          actionId: "create_meeting"
        }
      ];
    }

    if (entidadeSelecionada.type === "vendedor") {
      const name = entidadeSelecionada.name;
      return [
        {
          id: "rec_vend_1",
          title: `${name} — Meta Bronze Batida`,
          description: `${name} atingiu 92% da meta mensal. Faltam apenas R$ 8.450,00 em faturamento para desbloquear a comissão de nível Ouro.`,
          priority: "high",
          type: "insight"
        },
        {
          id: "rec_vend_2",
          title: "Auditoria de Campanhas Pendente",
          description: "A comissão do último ciclo de vendas de pós-vendas precisa ser aprovada pelo Diretor.",
          priority: "medium",
          type: "alert"
        }
      ];
    }

    if (entidadeSelecionada.type === "presentation") {
      return [
        {
          id: "rec_pres_1",
          title: "Sincronia de Gráficos Executivos",
          description: "Certifique-se de que os slides gerados pelo assistente tático Sauron estão alinhados com a última planilha ativa.",
          priority: "medium",
          type: "action",
          actionLabel: "Verificar Slides",
          actionId: "open_central_dados"
        }
      ];
    }

    // Default
    return [
      {
        id: "rec_def_1",
        title: "Diagnóstico de Performance",
        description: "Configure filtros de CNPJ ou Grupo para estreitar as anomalias detectadas pelo AnalyticsEngine.",
        priority: "low",
        type: "insight"
      }
    ];
  }
}

export const contextRecommendationEngine = ContextRecommendationEngine.getInstance();
