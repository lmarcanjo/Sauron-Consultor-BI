import React from "react";
import { 
  ClipboardList, CheckCircle2, Database, Sparkles, TrendingUp, Target, Bell
} from "lucide-react";
import { ExecutiveBriefWidget, ClientPulseWidget } from "./ExecutiveWidgets";
import { SauronCard } from "../sauron-sdk/ui/SauronCard";
import { SauronBadge } from "../sauron-sdk/ui/SauronBadge";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { WorkspaceSuggestions } from "../core/workspace-intelligence/WorkspaceSuggestions";

interface CaseOverviewProps {
  widgetContext: any;
  dnaSuggestions: WorkspaceSuggestions;
  activeProject: WorkspaceProject | null;
}

export const CaseOverview: React.FC<CaseOverviewProps> = ({
  widgetContext,
  dnaSuggestions,
  activeProject
}) => {
  const hasRealRows = Array.isArray(widgetContext?.filteredData) && widgetContext.filteredData.length > 0;

  return (
    <div className="space-y-6">
      {/* Executive Brief Widget */}
      <ExecutiveBriefWidget context={widgetContext} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Visual Widget: Maturity Index (IMO) */}
        <SauronCard 
          title="Índice de Maturidade Operacional (IMO)"
        >
          <div className="p-1 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-8 border-slate-100 dark:border-slate-800">
              <span className="text-center text-xs font-black uppercase text-slate-700 dark:text-slate-200">
                {hasRealRows ? "Fonte real ativa" : "Configuração pendente"}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Índice aguardando métricas certificadas</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Nenhum percentual é exibido sem fonte e cálculo auditáveis.</p>
            </div>
          </div>
        </SauronCard>

        {/* Client Pulse Widget */}
        <ClientPulseWidget context={widgetContext} />

      </div>

      {/* Strategic KPIs & Decisions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPIs Estratégicos */}
        <SauronCard title="KPIs Estratégicos">
          <div className="space-y-3">
            {dnaSuggestions.kpis.map((kpi, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{kpi.name}</span>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 dark:text-white">{kpi.target}</span>
                  <SauronBadge type="success">Ativo</SauronBadge>
                </div>
              </div>
            ))}
          </div>
        </SauronCard>

        {/* Centro de Decisões */}
        <SauronCard title="Centro de Decisões">
          {activeProject?.meetings && activeProject.meetings.length > 0 ? (
            <div className="space-y-3">
              {activeProject.meetings.map((m, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-400 uppercase">
                    <ClipboardList size={10} />
                    <span>Sessão Aprovada</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {m.decisions || "Decisão registrada sem descrição."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenhuma decisão registrada ainda.
            </div>
          )}
        </SauronCard>

        {/* Próximas Ações */}
        <SauronCard title="Próximas Ações">
          {activeProject?.actionPlans && activeProject.actionPlans.length > 0 ? (
            <div className="space-y-2.5">
              {activeProject.actionPlans.slice(0, 3).map((p, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 size={13} className="text-blue-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{p.description}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Prazo: {p.deadline} • Resp: {p.responsible}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenhuma ação tática pendente.
            </div>
          )}
        </SauronCard>

      </div>

      {/* Status dos Dados & Teaser Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status dos Dados */}
        <SauronCard title={
          <span className="flex items-center gap-1.5">
            <Database size={13} className="text-blue-500" />
            <span>Status de Integração de Dados</span>
          </span>
        }>
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Última sincronização de dados estruturados com as filiais locais:
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${hasRealRows ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{hasRealRows ? "Fonte real ativa" : "Nenhuma fonte ativa"}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{hasRealRows ? "Linhas disponíveis para análise." : "Importe e ative uma fonte para começar."}</span>
            </div>
          </div>
        </SauronCard>

        {/* Narrativa & Rituais Recomendados */}
        <SauronCard title={
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span>Rituais Recomendados (DNA)</span>
          </span>
        }>
          <div className="space-y-2">
            {dnaSuggestions.rituais.map((rit, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{rit.name}</p>
                  <p className="text-[10px] text-slate-500">{rit.description}</p>
                </div>
                <span className="text-[9px] font-mono bg-blue-150 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">{rit.frequency}</span>
              </div>
            ))}
          </div>
        </SauronCard>

      </div>
    </div>
  );
};
