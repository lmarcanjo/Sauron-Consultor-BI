/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  AlertCircle,
  ArrowDownRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  GitCommit,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import type { EnterpriseModel } from "../core/enterprise-consolidation/EnterpriseDiscoveryTypes";

interface EnterpriseMapViewProps {
  model: EnterpriseModel;
}

export const EnterpriseMapView: React.FC<EnterpriseMapViewProps> = ({ model }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-6 font-sans shadow-lg" data-testid="enterprise-map-view">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="text-indigo-400" size={20} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Mapa Corporativo da Empresa
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Representação visual da organização baseada em evidências
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1.5">
          <Sparkles size={12} /> {model.areas.length} Áreas Mapeadas
        </span>
      </div>

      {/* NARRATIVA EXECUTIVA */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 text-xs text-slate-200 leading-relaxed font-medium">
        "{model.executiveNarrative}"
      </div>

      {/* ÁREAS E PROCESSOS DA EMPRESA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {model.areas.map(area => (
          <div key={area.id} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                {area.name}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
                {Math.round(area.coverage * 100)}% Cobertura
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Processos Relacionados:</span>
              {model.processes
                .filter(p => p.areaId === area.id)
                .map(proc => (
                  <div key={proc.id} className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-850">
                    <span className="font-semibold">{proc.name}</span>
                    <span className="text-[9px] font-black text-slate-400">{proc.status}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* RELACIONAMENTOS CORPORATIVOS */}
      {model.relationships.length > 0 && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <GitCommit size={14} className="text-indigo-400" /> Relacionamentos entre Entidades
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {model.relationships.map(rel => (
              <div key={rel.id} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
                <span className="font-bold">{rel.sourceEntityId.replace("ent_", "")}</span>
                <ChevronRight size={12} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-indigo-300">{rel.relationType}</span>
                <ChevronRight size={12} className="text-indigo-400" />
                <span className="font-bold">{rel.targetEntityId.replace("ent_", "")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LACUNAS IDENTIFICADAS */}
      {model.gaps.length > 0 && (
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertCircle size={14} /> Lacunas de Informações da Empresa
          </h4>
          <div className="space-y-2">
            {model.gaps.map(gap => (
              <div key={gap.id} className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 flex items-center justify-between gap-3">
                <div>
                  <strong className="font-bold block text-amber-100">{gap.areaName}: {gap.missingConcept}</strong>
                  <span className="text-[11px] text-amber-300/70">{gap.impact}</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-950 px-2 py-1 rounded-lg border border-amber-800 shrink-0">
                  {gap.recommendation}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseMapView;
