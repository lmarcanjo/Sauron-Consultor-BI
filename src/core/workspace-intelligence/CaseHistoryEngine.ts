/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { eventBus } from "../events/EventBus";
import { auditEngine } from "../audit/AuditEngine";

export interface CaseHistoryEvent {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: "data_imported" | "diagnostic_generated" | "anomaly_detected" | "plan_created" | "session_realized" | "metric_achieved" | "commission_approved" | "dossier_generated";
  timestamp: string;
  formattedTime: string;
}

export class CaseHistoryEngine {
  private static instance: CaseHistoryEngine;
  private historyEvents: CaseHistoryEvent[] = [];

  private constructor() {
    this.seedDefaultEvents();
    this.setupEventSubscriptions();
  }

  public static getInstance(): CaseHistoryEngine {
    if (!CaseHistoryEngine.instance) {
      CaseHistoryEngine.instance = new CaseHistoryEngine();
    }
    return CaseHistoryEngine.instance;
  }

  private seedDefaultEvents() {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      this.historyEvents = [
        {
          id: "h_1",
          caseId: "case_alpha",
          title: "Dados importados",
          description: "Importação realizada com sucesso do fechamento comercial do cliente.",
          category: "data_imported",
          timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          formattedTime: "Há 2 dias"
        },
        {
          id: "h_2",
          caseId: "case_alpha",
          title: "Primeiro diagnóstico gerado",
          description: "Mapeamento inicial do DRE identificou anomalias críticas no CMV.",
          category: "diagnostic_generated",
          timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          formattedTime: "Há 1 dia"
        },
        {
          id: "h_3",
          caseId: "case_alpha",
          title: "Margem caiu",
          description: "Identificada redução na margem de uma linha comercial relevante.",
          category: "anomaly_detected",
          timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          formattedTime: "Há 24 horas"
        },
        {
          id: "h_4",
          caseId: "case_alpha",
          title: "Plano executivo criado",
          description: "Criadas 5 ações prioritárias voltadas à retenção de clientes.",
          category: "plan_created",
          timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          formattedTime: "Há 12 horas"
        },
        {
          id: "h_5",
          caseId: "case_alpha",
          title: "Reunião realizada",
          description: "Apresentação executiva conduzida para aprovação dos planos táticos da operação.",
          category: "session_realized",
          timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          formattedTime: "Há 6 horas"
        },
        {
          id: "h_6",
          caseId: "case_alpha",
          title: "Comissão aprovada",
          description: "Aprovados os pagamentos e premiações dos consultores de alta performance.",
          category: "commission_approved",
          timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          formattedTime: "Há 2 horas"
        },
        {
          id: "h_7",
          caseId: "case_alpha",
          title: "Dossiê gerado",
          description: "Dossiê de desempenho operacional ativo consolidado para o comitê administrativo.",
          category: "dossier_generated",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          formattedTime: "Há 30 minutos"
        }
      ];
    } else {
      this.historyEvents = [];
    }
  }

  private setupEventSubscriptions() {
    eventBus.subscribe("DataImported", (payload) => {
      this.logNarrativeEvent(
        "case_alpha",
        "Dados importados",
        `Planilhas consolidadas contendo ${payload.rowCount} registros foram importadas com sucesso.`,
        "data_imported"
      );
    });

    eventBus.subscribe("DatabaseSynced", (payload) => {
      this.logNarrativeEvent(
        "case_alpha",
        "Banco de dados sincronizado",
        `Base de dados ${payload.sourceName} integrada, adicionando ${payload.count} novos lançamentos.`,
        "data_imported"
      );
    });

    eventBus.subscribe("MeetingStarted", (payload) => {
      this.logNarrativeEvent(
        "case_alpha",
        "Reunião realizada",
        `Sessão de alinhamento comitê iniciada pelo apresentador ${payload.presenter}.`,
        "session_realized"
      );
    });

    eventBus.subscribe("ActionCompleted", (payload) => {
      this.logNarrativeEvent(
        "case_alpha",
        "Meta atingida",
        `Concluída ação de plano de negócio: ${payload.description}`,
        "metric_achieved"
      );
    });
  }

  /**
   * Logs a new narrative event for a case and triggers an audit log.
   */
  public logNarrativeEvent(
    caseId: string,
    title: string,
    description: string,
    category: CaseHistoryEvent["category"]
  ): CaseHistoryEvent {
    const newEvent: CaseHistoryEvent = {
      id: `h_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`,
      caseId,
      title,
      description,
      category,
      timestamp: new Date().toISOString(),
      formattedTime: "Agora"
    };

    this.historyEvents.unshift(newEvent);

    // Sync with AuditEngine
    auditEngine.logEvent(
      "NARRATIVE_EVENT",
      `[Narrativa do Caso] ${title}: ${description}`,
      "INFO",
      { caseId, category }
    );

    return newEvent;
  }

  /**
   * Get events for a specific case.
   */
  public getEventsForCase(caseId: string): CaseHistoryEvent[] {
    return this.historyEvents.filter(e => e.caseId === caseId);
  }

  /**
   * Get all registered events.
   */
  public getAllEvents(): CaseHistoryEvent[] {
    return [...this.historyEvents];
  }
}

export const caseHistoryEngine = CaseHistoryEngine.getInstance();
export default caseHistoryEngine;
