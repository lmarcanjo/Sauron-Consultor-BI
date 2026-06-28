import React from "react";
import { Target, X, Bell, Award } from "lucide-react";
import { WorkspaceContext } from "../core/workspace-intelligence/types";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { DNASuggestions } from "../core/workspace-intelligence/WorkspaceDNAEngine";

interface CaseDataPanelProps {
  context: WorkspaceContext;
  dnaSuggestions: DNASuggestions;
}

export const CaseDataPanel: React.FC<CaseDataPanelProps> = ({ context, dnaSuggestions }) => {
  return (
    <aside className="w-full lg:w-1/3 xl:w-1/4 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-300 space-y-5 shadow-sm shrink-0">
      
      {/* Header: Focus Entity status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
            <Target size={14} />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">DNA do Caso</h3>
            <p className="text-[10px] text-slate-400 font-medium">Ritos & Alertas de Segmento</p>
          </div>
        </div>
        {context.entidadeSelecionada && (
          <button
            onClick={() => workspaceIntelligenceEngine.switchEntity(null)}
            className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Limpar seleção"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Industry Segment DNA */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-extrabold text-blue-400 uppercase bg-blue-950 border border-blue-900 px-2 py-0.5 rounded">
            {dnaSuggestions.segmentName}
          </span>
          <span className="text-[9px] font-mono text-slate-500">Workspace DNA</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Sugerindo tabulações, alertas, ações táticas e KPIs calibrados para o segmento <strong>{dnaSuggestions.segmentName}</strong>.
        </p>
      </div>

      {/* DNA-based Alertas */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Bell size={12} className="text-amber-500" />
          <span>Alertas de Negócio</span>
        </h4>
        <div className="space-y-2.5">
          {dnaSuggestions.alertas.map((al, i) => {
            const isHigh = al.priority === "high";
            return (
              <div key={i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-850/80 text-[11px] leading-relaxed relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${isHigh ? "bg-rose-500" : "bg-amber-500"}`} />
                <p className="font-bold text-white pl-1">{al.title}</p>
                <p className="text-slate-400 mt-0.5 pl-1">{al.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* DNA-based Ações Recomendadas */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Award size={12} className="text-blue-400" />
          <span>Ações Recomendadas</span>
        </h4>
        <div className="space-y-2">
          {dnaSuggestions.acoesRecomendadas.map((act, i) => (
            <div key={i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-850/80 text-[11px] space-y-1">
              <p className="font-bold text-slate-200">{act.label}</p>
              <p className="text-slate-400 leading-normal">{act.description}</p>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
};
