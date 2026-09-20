/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Settings, Database, ArrowRight, Info, Shield, Clock
} from 'lucide-react';
import type { ModuleActivationProjection, ModuleRequirement, ModulePrimaryAction } from '../core/module-activation';

interface ModuleStatusPanelProps {
  projection: ModuleActivationProjection;
  moduleLabel: string;
  moduleIcon: React.ReactNode;
  onPrimaryAction: () => void;
  onChangeSource?: () => void;
  sourceFileName?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'Ativo', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/25', icon: <CheckCircle2 size={12} /> },
  REQUIRES_CONFIGURATION: { label: 'Configuração Necessária', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/25', icon: <Settings size={12} /> },
  INSUFFICIENT_DATA: { label: 'Dados Insuficientes', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/25', icon: <AlertTriangle size={12} /> },
  BLOCKED: { label: 'Bloqueado', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/25', icon: <XCircle size={12} /> },
  ERROR: { label: 'Erro', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/25', icon: <XCircle size={12} /> },
};

const ACTION_LABELS: Record<ModulePrimaryAction, string> = {
  OPEN_DASHBOARD: 'Abrir Dashboard',
  CONFIGURE: 'Configurar Módulo',
  REVIEW_FIELDS: 'Revisar Campos',
  CHANGE_SOURCE: 'Alterar / Adicionar Fonte',
  NONE: '',
};

export const ModuleStatusPanel: React.FC<ModuleStatusPanelProps> = ({
  projection,
  moduleLabel,
  moduleIcon,
  onPrimaryAction,
  onChangeSource,
  sourceFileName,
}) => {
  const config = STATUS_CONFIG[projection.status] || STATUS_CONFIG.ERROR;
  const satisfiedReqs = projection.requirements.filter(r => r.status === 'SATISFIED');
  const missingReqs = projection.requirements.filter(r => r.status === 'MISSING');
  const optionalReqs = projection.requirements.filter(r => r.status === 'OPTIONAL');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-white font-sans" data-testid={`module-status-${projection.moduleId.toLowerCase()}`}>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.bgColor} ${config.color} border ${config.borderColor} flex items-center gap-1.5`}>
              {config.icon} {config.label}
            </span>
            {(sourceFileName || projection.sourceFileName) && (
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Database size={11} /> {sourceFileName || projection.sourceFileName}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {moduleIcon}
            {moduleLabel}
          </h2>
          {projection.lastUpdated && (
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock size={11} /> Última atualização: {new Date(projection.lastUpdated).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* REQUIREMENTS — Found vs Missing */}
      {projection.requirements.length > 0 && (
        <div className="space-y-4">
          {satisfiedReqs.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Campos Encontrados ({satisfiedReqs.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {satisfiedReqs.map(req => (
                  <RequirementCard key={req.requirementId} requirement={req} />
                ))}
              </div>
            </div>
          )}

          {missingReqs.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 mb-2 flex items-center gap-1.5">
                <XCircle size={13} /> Campos Necessários / Não Identificados ({missingReqs.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {missingReqs.map(req => (
                  <RequirementCard key={req.requirementId} requirement={req} />
                ))}
              </div>
            </div>
          )}

          {optionalReqs.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Info size={13} /> Campos Opcionais ({optionalReqs.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {optionalReqs.map(req => (
                  <RequirementCard key={req.requirementId} requirement={req} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIMITATIONS */}
      {projection.limitations.length > 0 && (
        <div className="rounded-xl bg-amber-950/20 border border-amber-500/15 p-4 space-y-1">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Shield size={12} /> Limitações
          </h4>
          <ul className="text-xs text-amber-200/80 space-y-0.5">
            {projection.limitations.map((lim, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">•</span> {lim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DESCRIPTIVE MESSAGE for INSUFFICIENT_DATA */}
      {projection.status === 'INSUFFICIENT_DATA' && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
          <p className="text-sm font-semibold text-slate-300">
            Esta fonte ainda não possui informações suficientes para ativar o {moduleLabel}.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Os campos listados acima são necessários para construir as visualizações deste módulo.
            Você pode adicionar uma nova fonte ou revisar os campos da fonte atual.
          </p>
        </div>
      )}

      {projection.status === 'REQUIRES_CONFIGURATION' && (
        <div className="rounded-xl bg-amber-950/20 border border-amber-500/20 p-4">
          <p className="text-sm font-semibold text-amber-100">
            Os campos necessários foram encontrados, mas ainda precisam ser associados a este módulo.
          </p>
          <p className="text-xs text-amber-200/70 mt-1">
            A configuração será salva para este Engajamento e esta fonte. Ela não altera a planilha original.
          </p>
        </div>
      )}

      {/* CTA ACTIONS */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {projection.primaryAction !== 'NONE' && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all"
            data-testid={`module-cta-${projection.moduleId.toLowerCase()}`}
          >
            {ACTION_LABELS[projection.primaryAction]}
            <ArrowRight size={14} />
          </button>
        )}
        {onChangeSource && projection.primaryAction !== 'CHANGE_SOURCE' && (
          <button
            type="button"
            onClick={onChangeSource}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            <Database size={13} /> Alterar Fonte
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

const RequirementCard: React.FC<{ requirement: ModuleRequirement }> = ({ requirement }) => {
  const isSatisfied = requirement.status === 'SATISFIED';
  const isMissing = requirement.status === 'MISSING';

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${
      isSatisfied
        ? 'border-emerald-500/20 bg-emerald-950/20'
        : isMissing
          ? 'border-orange-500/20 bg-orange-950/15'
          : 'border-slate-700 bg-slate-800/50'
    }`}>
      <div className="flex items-center gap-1.5">
        {isSatisfied ? (
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
        ) : isMissing ? (
          <XCircle size={13} className="text-orange-400 shrink-0" />
        ) : (
          <Info size={13} className="text-slate-500 shrink-0" />
        )}
        <span className={`text-xs font-black ${isSatisfied ? 'text-emerald-300' : isMissing ? 'text-orange-300' : 'text-slate-400'}`}>
          {requirement.label}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 mt-0.5 ml-5">{requirement.description}</p>
      {isSatisfied && requirement.matchingPhysicalFields.length > 0 && (
        <p className="text-[10px] text-emerald-500/70 mt-0.5 ml-5">
          → {requirement.matchingPhysicalFields.join(', ')}
        </p>
      )}
    </div>
  );
};
