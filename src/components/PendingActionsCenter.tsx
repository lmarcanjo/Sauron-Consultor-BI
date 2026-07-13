/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PendingActionsCenter — Centro de Pendências com Impacto e Ações Diretas
 *
 * Lê dados dos repositórios existentes sem modificá-los.
 * Focado na jornada de consultoria estratégica: mapeamento de problemas, impactos e resoluções.
 */

import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { Enterprise } from "../core/persistence/EnterpriseRepository";
import { ActiveDataset, SpreadsheetFile } from "../types/dataSource";

export type PendingPriority = "critical" | "important" | "optional";

export interface PendingAction {
  id: string;
  priority: PendingPriority;
  problem: string;      // O problema
  impact: string;       // O impacto para a tomada de decisão
  howToFix: string;     // Como resolver
  actionLabel: string;  // Label do botão de ação
  actionTab: string;    // Tab destino para resolver
}

interface PendingActionsCenterProps {
  enterprises: Enterprise[];
  activeDataset: ActiveDataset | null;
  activeFiles: SpreadsheetFile[];
  isMarketConfigured: boolean;
  onSelectTab: (tab: string) => void;
}

function buildPendingActions(
  enterprises: Enterprise[],
  activeDataset: ActiveDataset | null,
  activeFiles: SpreadsheetFile[],
  isMarketConfigured: boolean
): PendingAction[] {
  const actions: PendingAction[] = [];

  // 🔴 CRÍTICO: Nenhuma empresa
  if (enterprises.length === 0) {
    actions.push({
      id: "no_enterprise",
      priority: "critical",
      problem: "Nenhuma empresa cadastrada",
      impact: "Sem uma entidade jurídica ou operacional cadastrada, não é possível consolidar dados ou gerar relatórios.",
      howToFix: "Cadastre um grupo empresarial ou uma empresa individual no painel principal.",
      actionLabel: "Cadastrar Empresa",
      actionTab: "enterprise_center"
    });
  }

  // 🔴 CRÍTICO: Sem dados importados
  if (!activeDataset || activeDataset.rowCount === 0) {
    actions.push({
      id: "no_data",
      priority: "critical",
      problem: "Planilha de dados não importada",
      impact: "O sistema fica vazio e impossibilitado de calcular qualquer indicador ou apresentar diagnósticos financeiros.",
      howToFix: "Acesse a área de Importação e envie uma planilha Excel ou CSV com o histórico de lançamentos.",
      actionLabel: "Importar Planilha",
      actionTab: "importacao"
    });
  }

  // 🟡 IMPORTANTE: Sem mapeamento financeiro
  if (
    activeDataset &&
    activeDataset.rowCount > 0 &&
    (!activeDataset.columnProfiles || activeDataset.columnProfiles.length === 0)
  ) {
    actions.push({
      id: "no_mapping",
      priority: "important",
      problem: "Mapeamento financeiro não configurado",
      impact: "Os demonstrativos financeiros (DRE) e os KPIs não serão exibidos ou trarão valores distorcidos.",
      howToFix: "Acesse Configurações → Mapeamento de Campos e vincule as colunas originais aos termos Receita, Custo e Despesa.",
      actionLabel: "Mapear Campos",
      actionTab: "perfis"
    });
  }

  // 🟡 IMPORTANTE: Sem segmento
  if (enterprises.length > 0 && enterprises.some(e => !e.segment)) {
    actions.push({
      id: "no_segment",
      priority: "important",
      problem: "Segmento de mercado não identificado",
      impact: "O consultor perde o benchmark setorial, o vocabulário adaptativo e a inteligência de KPIs específicos do setor.",
      howToFix: "Selecione o segmento operacional correto na ficha cadastral da empresa no Enterprise Center.",
      actionLabel: "Configurar Segmento",
      actionTab: "enterprise_center"
    });
  }

  // 🟢 OPCIONAL: Sem mercado
  if (!isMarketConfigured) {
    actions.push({
      id: "no_market",
      priority: "optional",
      problem: "Inteligência de mercado inativa",
      focus: "comparação estratégica",
      impact: "A análise externa de cotações, Selic, IPCA e taxas setoriais não é exibida na apresentação final.",
      howToFix: "Habilite a integração das fontes externas no menu de Inteligência de Mercado.",
      actionLabel: "Ativar Fontes",
      actionTab: "enterprise_center"
    } as any);
  }

  // 🟢 OPCIONAL: Sem dicionário customizado
  let dictCustomized = false;
  try {
    dictCustomized = !!localStorage.getItem("sauron_custom_dictionary");
  } catch (e) {}

  if (!dictCustomized) {
    actions.push({
      id: "no_terminology",
      priority: "optional",
      problem: "Terminologia padrão em uso",
      impact: "A interface exibe termos genéricos. Rótulos como \"Empresas\" ou \"Vendedores\" podem não fazer sentido para a operação do cliente.",
      howToFix: "Customize os termos padrão no painel de Terminologia da Empresa.",
      actionLabel: "Mapear Termos",
      actionTab: "perfis"
    });
  }

  return actions;
}

const priorityConfig: Record<PendingPriority, {
  badgeText: string;
  border: string;
  bg: string;
  textColor: string;
  Icon: React.ElementType;
}> = {
  critical: {
    badgeText: "Ação Imediata",
    border: "border-rose-900/50 dark:border-rose-900/50",
    bg: "bg-rose-950/10",
    textColor: "text-rose-400",
    Icon: AlertTriangle
  },
  important: {
    badgeText: "Importante",
    border: "border-amber-900/50 dark:border-amber-900/50",
    bg: "bg-amber-950/10",
    textColor: "text-amber-400",
    Icon: AlertCircle
  },
  optional: {
    badgeText: "Recomendado",
    border: "border-slate-800 dark:border-slate-800",
    bg: "bg-slate-950/20",
    textColor: "text-slate-400",
    Icon: Info
  }
};

export const PendingActionsCenter: React.FC<PendingActionsCenterProps> = ({
  enterprises,
  activeDataset,
  activeFiles,
  isMarketConfigured,
  onSelectTab
}) => {
  const actions = buildPendingActions(enterprises, activeDataset, activeFiles, isMarketConfigured);

  const criticals = actions.filter(a => a.priority === "critical");
  const importants = actions.filter(a => a.priority === "important");
  const optionals = actions.filter(a => a.priority === "optional");

  const hasUrgent = criticals.length > 0 || importants.length > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800">
            <ClipboardList size={14} className="text-slate-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Painel de Pendências
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              {!hasUrgent
                ? "Ambiente totalmente estruturado"
                : `${criticals.length + importants.length} pendências que limitam a apresentação`}
            </p>
          </div>
        </div>
        {!hasUrgent && (
          <CheckCircle2 size={18} className="text-emerald-500 animate-pulse" />
        )}
      </div>

      {/* State A: All resolved */}
      {!hasUrgent && (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
          <CheckCircle2 size={32} className="text-emerald-500" />
          <h4 className="text-xs font-black uppercase text-emerald-400">Excelente Trabalho</h4>
          <p className="text-[10px] text-slate-550 leading-relaxed max-w-[280px]">
            Não há pendências críticas pendentes. O projeto está 100% pronto para a apresentação executiva.
          </p>
        </div>
      )}

      {/* State B: Has actions */}
      {hasUrgent && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850">
          {[...criticals, ...importants, ...optionals].map((action) => {
            const config = priorityConfig[action.priority];
            const Icon = config.Icon;

            return (
              <div
                key={action.id}
                className={`flex flex-col gap-2 p-3 rounded-xl border ${config.border} ${config.bg} transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={config.textColor} />
                    <span className="text-[10px] font-black uppercase text-white">
                      {action.problem}
                    </span>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-current ${config.textColor}`}>
                    {config.badgeText}
                  </span>
                </div>

                <div className="space-y-1 pl-6">
                  <p className="text-[9px] text-slate-550 font-semibold leading-relaxed">
                    <strong className="text-slate-400 font-bold">Impacto estratégico:</strong> {action.impact}
                  </p>
                  <p className="text-[9px] text-slate-550 font-semibold leading-relaxed">
                    <strong className="text-slate-400 font-bold">Como resolver:</strong> {action.howToFix}
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onSelectTab(action.actionTab)}
                    className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded transition-all cursor-pointer bg-slate-900 hover:bg-slate-800 ${config.textColor}`}
                  >
                    {action.actionLabel} <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
