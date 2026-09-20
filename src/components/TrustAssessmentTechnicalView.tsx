import React from 'react';
import { TrustArtifact } from '../core/trust/TrustContracts';

interface TrustAssessmentTechnicalViewProps {
  artifact: TrustArtifact;
}

export const TrustAssessmentTechnicalView: React.FC<TrustAssessmentTechnicalViewProps> = ({ artifact }) => {
  const { trustAssessment, dimensionAssessments, usageAssessments, blockingConditions, limitations, evaluatedAt, version } = artifact;

  const stateColors: Record<string, string> = {
    TRUSTED: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
    CONDITIONALLY_TRUSTED: 'bg-blue-900/50 text-blue-300 border-blue-700',
    LIMITED: 'bg-amber-900/50 text-amber-300 border-amber-700',
    BLOCKED: 'bg-rose-900/50 text-rose-300 border-rose-700',
    INVALIDATED: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 text-slate-200">
      {/* Header técnico */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Trust Assessment Technical Summary</h3>
          <p className="text-xs text-slate-400">
            Artifact ID: <span className="font-mono text-slate-300">{artifact.artifactId}</span> | Version: v{version} | Policy: <span className="font-mono text-slate-300">{artifact.provenance.policyId || 'asterion_trust_policy_v1'} ({artifact.provenance.policyVersion || '1.0.0'})</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1 italic">
            "Os critérios da política vigente foram satisfeitos para os usos indicados com base nos artefatos e limitações registradas. O score numérico é uma métrica de governança e não representa probabilidade estatística."
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${stateColors[trustAssessment.overallState] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
          {trustAssessment.overallState} {!trustAssessment.scoreSuppressed && trustAssessment.overallScore !== undefined ? `(Score: ${(trustAssessment.overallScore * 100).toFixed(0)}%)` : '(Score Suprimido)'}
        </div>
      </div>

      {/* Primary Blocker Warning if present */}
      {trustAssessment.primaryBlockingReason && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs">
          <strong>Primary Blocking Reason:</strong> {trustAssessment.primaryBlockingReason}
        </div>
      )}

      {/* Dimensões */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Avaliação por Dimensão de Confiabilidade</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dimensionAssessments.map(d => (
            <div key={d.dimension} className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-mono font-medium text-slate-200">
                <span>{d.dimension}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${d.status === 'TRUSTED' ? 'text-emerald-400' : d.status === 'BLOCKED' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {d.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{d.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Usos Certificáveis */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Aptidão por Uso Certificável</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {usageAssessments.map(u => (
            <div key={u.usageType} className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span>{u.usageType}</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${u.status === 'TRUSTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : u.status === 'BLOCKED' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                  {u.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{u.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bloqueios e Limitações */}
      {(blockingConditions.length > 0 || limitations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
          {blockingConditions.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-rose-400 mb-2">Blocking Conditions ({blockingConditions.length})</h5>
              <ul className="space-y-1 text-xs text-rose-300/80 list-disc list-inside">
                {blockingConditions.map(b => (
                  <li key={b.code}>
                    <strong>[{b.code}]</strong>: {b.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {limitations.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-amber-400 mb-2">Limitações Observadas ({limitations.length})</h5>
              <ul className="space-y-1 text-xs text-amber-300/80 list-disc list-inside">
                {limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
