import React from 'react';
import { DREArtifact } from '../core/dre-composition/DRECompositionContracts';
import { FileText, ShieldAlert, CheckCircle2, Layers, DollarSign, Calendar, Lock } from 'lucide-react';

interface DREArtifactTechnicalViewProps {
  artifact: DREArtifact | null;
  onRefresh?: () => void;
}

export const DREArtifactTechnicalView: React.FC<DREArtifactTechnicalViewProps> = ({ artifact, onRefresh }) => {
  if (!artifact) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-medium text-slate-300">Nenhum DREArtifact gerado para esta fonte.</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Execute a composição determinística a partir de uma Classificação Financeira confirmada pelo consultor.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              DREArtifact (Homologação Técnica)
            </h3>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              {artifact.status}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-500 mt-1">ID: {artifact.artifactId} | Versão: {artifact.version}</p>
        </div>

        <div className="text-right text-xs text-slate-400 font-mono space-y-1">
          <div>Policy: {artifact.policyId} ({artifact.policyVersion})</div>
          <div>Fingerprint: {artifact.fingerprint}</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Governança & Rastreabilidade:</span> {artifact.metadata.disclaimer}
        </div>
      </div>

      {/* Resumo Estrutural */}
      <div className="grid grid-cols-4 gap-4 text-xs">
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <div className="text-slate-400 flex items-center gap-1.5 font-medium">
            <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Moeda Declarada
          </div>
          <div className="text-slate-200 font-mono font-bold">
            {artifact.metadata.currencyCode} {artifact.metadata.currencyCode === 'UNKNOWN' ? '(LIMITADA)' : ''}
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <div className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Períodos Cobertos
          </div>
          <div className="text-slate-200 font-bold">{artifact.periods.length} Período(s) ({artifact.periods.map(p => p.label).join(', ')})</div>
        </div>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <div className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Seções & Linhas
          </div>
          <div className="text-slate-200 font-bold">{artifact.sections.length} Seção(ões), {artifact.lines.length} Linha(s)</div>
        </div>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <div className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-rose-400" /> Subtotais Calculados
          </div>
          <div className="text-slate-200 font-bold font-mono">{artifact.subtotals.length} Subtotal(is) V2</div>
        </div>
      </div>

      {/* Tabela de Seções e Linhas */}
      <div className="space-y-4">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Estrutura Composta de DRE</h4>
        
        {artifact.sections.map(sec => (
          <div key={sec.sectionId} className="border border-slate-800 rounded-lg overflow-hidden">
            <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-slate-800 text-xs font-bold text-slate-200">
              <span>{sec.order}. {sec.label}</span>
              <span className="font-mono text-emerald-400">R$ {sec.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="divide-y divide-slate-800/60 bg-slate-900/40">
              {artifact.lines.filter(l => l.statementGroup === sec.statementGroup).map(line => (
                <div key={line.lineId} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/30">
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-300 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">{line.lineCode}</span>
                      {line.label}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Identity: {line.sourceCategoryIdentities.join(', ')} | SignPolicy: {line.signPoliciesApplied.join(', ')}
                    </div>
                  </div>

                  <div className="text-right font-mono font-medium text-slate-200">
                    R$ {line.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}

              {artifact.lines.filter(l => l.statementGroup === sec.statementGroup).length === 0 && (
                <div className="p-2.5 text-xs text-slate-500 italic text-center">
                  Nenhuma categoria vinculada a esta seção.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Subtotais Financeiros V2 / V3 */}
      {artifact.subtotals.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Subtotais Financeiros Governaods ({artifact.policyId.includes('v3') ? 'Política V3 — Estrutura Estendida' : 'Política V2 — SIGNED_VALUE_MODEL'})
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {artifact.subtotals.map(sub => (
              <div key={sub.subtotalId} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span>{sub.label}</span>
                  <span className={`font-mono ${sub.roundedValue < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    R$ {sub.roundedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Expressão Efetiva: <span className="text-amber-300">{sub.provenance?.expression || sub.rawValue}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Código: {sub.subtotalCode} | Fórmula: {sub.formulaId} ({sub.formulaVersion})
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Período: {sub.periodId} | Status: {sub.calculationStatus} | Convenção: {sub.provenance?.signSemantics || 'SIGNED_VALUE_MODEL'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proveniência */}
      <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2 font-mono text-slate-400">
        <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Trilha de Proveniência</div>
        <div>FinancialClassificationArtifact: {artifact.provenance.financialClassificationArtifactIds.join(', ')}</div>
        <div>TrustArtifact: {artifact.provenance.trustArtifactIds.join(', ')}</div>
        <div>SemanticConfirmationArtifact: {artifact.provenance.semanticConfirmationArtifactIds.join(', ')}</div>
      </div>
    </div>
  );
};
