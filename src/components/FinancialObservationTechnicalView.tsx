import React from 'react';
import { BusinessArtifact } from '../core/business-insight/BusinessArtifactContracts';

interface TechnicalViewProps {
  artifact: BusinessArtifact;
  onRefresh?: () => void;
}

export const FinancialObservationTechnicalView: React.FC<TechnicalViewProps> = ({ artifact, onRefresh }) => {
  if (!artifact) return null;

  const { analysisScope, businessObservations, calculatedMetrics, unresolvedBusinessQuestions, limitations, provenance, metadata } = artifact;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Observação da Estrutura Financeira (Visualização Técnica)</h3>
          <p className="text-xs text-slate-400">
            Motor: <span className="font-mono text-cyan-400">{artifact.engineId}</span> (v{artifact.engineVersion}) | SDK: v{artifact.sdkVersion}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs font-bold">
            GERADO COM SUCESSO
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              Reavaliar
            </button>
          )}
        </div>
      </div>

      {/* Scope & Context */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-850">
        <div>
          <span className="text-xs text-slate-500 block">Nível do Escopo</span>
          <span className="text-sm font-semibold text-slate-200">{analysisScope.scopeLevel}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">ID do Escopo</span>
          <span className="text-sm font-mono text-cyan-300">{analysisScope.scopeId}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Engajamento</span>
          <span className="text-sm font-mono text-slate-300">{analysisScope.engagementId}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Duração do Cálculo</span>
          <span className="text-sm font-mono text-amber-400">{metadata.executionDurationMs}ms</span>
        </div>
      </div>

      {/* Metrics Summary */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Métricas Estruturais Calculadas</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {calculatedMetrics.map(m => (
            <div key={m.metricId} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">{m.name}</span>
                <span className="text-xs font-mono text-slate-500">Fórmula: {m.formulaReference}</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-cyan-400">
                  {typeof m.value === 'number' ? m.value.toLocaleString('pt-BR') : m.value} {m.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observations */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Observações Neutras de Negócio</h4>
        <div className="space-y-2">
          {businessObservations.map(obs => (
            <div key={obs.observationId} className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">{obs.title}</span>
              <p className="text-xs text-slate-300">{obs.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unresolved Questions */}
      {unresolvedBusinessQuestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-amber-400 mb-3">Perguntas Não Resolvidas de Negócio</h4>
          <div className="space-y-2">
            {unresolvedBusinessQuestions.map(q => (
              <div key={q.questionId} className="bg-amber-950/30 border border-amber-900/50 p-3 rounded-lg">
                <span className="text-xs font-bold text-amber-300 block mb-1">[{q.category}] {q.question}</span>
                <p className="text-xs text-amber-200/80">{q.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Limitations & Provenance */}
      <div className="border-t border-slate-800 pt-4 flex flex-col md:flex-row justify-between text-xs text-slate-500 gap-4">
        <div>
          <span className="font-semibold text-slate-400 block mb-1">Limitações Propagadas:</span>
          {limitations.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          ) : (
            <span>Nenhuma limitação declarada.</span>
          )}
        </div>
        <div className="text-right font-mono">
          <span className="block text-slate-400 font-semibold mb-1">Proveniência</span>
          <span>Policy: {provenance.policyId} (v{provenance.policyVersion})</span>
          <span className="block">Fingerprint: {artifact.fingerprint.artifactHash}</span>
        </div>
      </div>
    </div>
  );
};
