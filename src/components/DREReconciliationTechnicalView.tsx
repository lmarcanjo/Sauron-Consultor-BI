import React from 'react';
import { DREReconciliationArtifact } from '../core/dre-reconciliation/DREReconciliationContracts';
import { CheckCircle2, AlertTriangle, XCircle, Shield, Info, ArrowRight } from 'lucide-react';

interface DREReconciliationTechnicalViewProps {
  artifact: DREReconciliationArtifact;
}

export const DREReconciliationTechnicalView: React.FC<DREReconciliationTechnicalViewProps> = ({ artifact }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECONCILED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> RECONCILED</span>;
      case 'RECONCILED_WITH_LIMITATIONS':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> RECONCILED WITH LIMITATIONS</span>;
      case 'PARTIALLY_RECONCILED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> PARTIALLY RECONCILED</span>;
      case 'BLOCKED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> BLOCKED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header com Disclaimer */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Certificação de Reconciliação Técnica Estrutural</h3>
          </div>
          {getStatusBadge(artifact.reconciliationStatus)}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
          {artifact.metadata.disclaimer}
        </p>
      </div>

      {/* Resumo da Reconciliação da Fonte */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reconciliação da Fonte de Dados</h4>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Registros Elegíveis</span>
            <div className="font-bold text-base text-slate-200">{artifact.sourceReconciliation.eligiblePhysicalRecordCount}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Registros Integrados (USED)</span>
            <div className="font-bold text-base text-emerald-400">{artifact.sourceReconciliation.usedPhysicalRecordCount}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Exclusões Governaods</span>
            <div className="font-bold text-base text-amber-400">{artifact.sourceReconciliation.excludedPhysicalRecordCount}</div>
          </div>
        </div>

        {/* Equação Estrutural */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Equação de Integridade Estrutural</div>
          <div className="text-amber-300">
            Valor Elegível ({artifact.sourceReconciliation.eligibleSignedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) = 
            Usado ({artifact.sourceReconciliation.usedSignedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) + 
            Excluído ({artifact.sourceReconciliation.excludedSignedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) + 
            Diferença ({artifact.sourceReconciliation.unexplainedDifference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
          </div>
        </div>
      </div>

      {/* Reconciliação dos 13 Subtotais */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reconciliação Independente dos 13 Subtotais V3</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {artifact.subtotalReconciliations.map(sub => (
            <div key={sub.subtotalId} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 font-mono">
              <div className="flex items-center justify-between font-bold text-slate-300">
                <span>{sub.subtotalCode}</span>
                <span className={sub.status === 'MATCHED' ? 'text-emerald-400' : 'text-rose-400'}>{sub.status}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Artefato: R$ {sub.artifactRawValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Oracle: R$ {sub.independentlyCalculatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500">
                Fórmula: {sub.formulaId} ({sub.formulaVersion}) | Operação: {sub.operation} | Tolerância: {sub.tolerance}
              </div>
              {sub.inputLineIds.length > 0 && (
                <div className="text-[10px] text-slate-500 truncate">
                  Inputs Linhas: {sub.inputLineIds.join(', ')}
                </div>
              )}
              {sub.inputSubtotalIds.length > 0 && (
                <div className="text-[10px] text-slate-500 truncate">
                  Inputs Subtotais: {sub.inputSubtotalIds.join(', ')}
                </div>
              )}
              {sub.findings.length > 0 && (
                <div className="text-[10px] text-rose-400 mt-1 font-sans bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                  {sub.findings.join('; ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
