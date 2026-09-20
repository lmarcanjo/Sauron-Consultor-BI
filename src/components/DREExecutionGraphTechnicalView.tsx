import React from 'react';
import { DREExecutionGraphArtifact } from '../core/dre-composition/DREExecutionGraphContracts';
import { Shield, Info, Activity } from 'lucide-react';

interface DREExecutionGraphTechnicalViewProps {
  artifact: DREExecutionGraphArtifact;
}

export const DREExecutionGraphTechnicalView: React.FC<DREExecutionGraphTechnicalViewProps> = ({ artifact }) => {
  return (
    <div className="space-y-6 text-slate-200">
      {/* Header com Disclaimer */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Grafo de Execução de Fórmulas e Dependências</h3>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {artifact.graphStatus}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
          {artifact.metadata.disclaimer}
        </p>
      </div>

      {/* DAG e Métricas */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Activity className="w-4 h-4" /> Resumo do Grafo de Execução
        </h4>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Total de Nós</span>
            <div className="font-bold text-base text-slate-200">{artifact.metadata.nodeCount}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Total de Arestas</span>
            <div className="font-bold text-base text-slate-200">{artifact.metadata.edgeCount}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Versão do Grafo</span>
            <div className="font-bold text-base text-slate-200">v{artifact.graphVersion}</div>
          </div>
        </div>

        {/* Sequência Topológica */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Ordem de Execução Topológica</span>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {artifact.executionOrder.map((nodeId, idx) => (
              <div key={nodeId} className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[9px]">{idx + 1}.</span>
                <span className="text-indigo-300 font-bold">{nodeId}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
