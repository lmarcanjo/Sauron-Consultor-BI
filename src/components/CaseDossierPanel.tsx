import React from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import { SauronCard } from "../sauron-sdk/ui/SauronCard";
import { CaseDossierReport } from "../core/workspace-intelligence/CaseDossierEngine";

interface CaseDossierPanelProps {
  dossierLog: CaseDossierReport;
}

export const CaseDossierPanel: React.FC<CaseDossierPanelProps> = ({ dossierLog }) => {
  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800/80 pb-4 gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-blue-500" />
            <span>Dossiê Consolidado de Desempenho</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Relatório analítico dinâmico agregando todos os ativos estruturais do caso.</p>
        </div>
        <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
          Gerado em: {new Date(dossierLog.generatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Informações Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
          <span className="text-[9px] font-black uppercase text-slate-400">Cliente</span>
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{dossierLog.client}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
          <span className="text-[9px] font-black uppercase text-slate-400">Grupo Econômico</span>
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{dossierLog.group}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
          <span className="text-[9px] font-black uppercase text-slate-400">Segmento do Caso</span>
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{dossierLog.segment}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
          <span className="text-[9px] font-black uppercase text-slate-400">Rastreabilidade / Origem</span>
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5 truncate">{dossierLog.dataSourceTrace}</p>
        </div>
      </div>

      {/* Grid of aggregated indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ativos de Dados e Metas */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">Unidades & Contratos</h3>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Empresas e CNPJs cobertos:</p>
            <div className="flex flex-wrap gap-1.5">
              {dossierLog.companies.map((c, i) => (
                <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded">
                  {c}
                </span>
              ))}
              {dossierLog.cnpjs.length > 0 ? dossierLog.cnpjs.map((cnpj, i) => (
                <span key={i} className="text-[10px] font-mono bg-slate-100 dark:bg-slate-850 text-slate-500 px-2.5 py-1 rounded">
                  {cnpj}
                </span>
              )) : (
                <span className="text-[10px] font-mono text-slate-400">Sem CNPJs adicionais</span>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs text-slate-500 font-medium">Fontes de Dados Conectadas:</p>
            {dossierLog.connectedDataSources.length > 0 ? (
              <div className="space-y-1.5">
                {dossierLog.connectedDataSources.map((src, i) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{src.name}</span>
                    <span className="text-[10px] font-mono bg-blue-100/50 dark:bg-blue-900/10 text-blue-500 px-1.5 py-0.5 rounded">{src.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-500 rounded-lg">
                Nenhuma fonte de dados ativa. Adicione uma planilha para gerar o dossiê.
              </div>
            )}
          </div>
        </div>

        {/* Performance de Pessoas e Consultores */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">Equipes & Pessoas</h3>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Consultores e Colaboradores em Destaque:</p>
            <div className="space-y-2">
              {dossierLog.people.employees.map((emp) => (
                <div key={emp.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg">
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{emp.fullName}</p>
                    <p className="text-[10px] text-slate-500">{emp.role} • {emp.branch}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded font-black uppercase">Ativo</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Relação de Rituais e Decisões */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Decisões Administrativas Registradas</h3>
        {dossierLog.decisions.length > 0 ? (
          <ul className="space-y-2">
            {dossierLog.decisions.map((dec, idx) => (
              <li key={idx} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <CheckCircle2 size={13} className="text-blue-500 mt-0.5 shrink-0" />
                <span>{dec}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">Nenhuma decisão registrada formalmente em atas.</p>
        )}
      </div>
    </div>
  );
};
