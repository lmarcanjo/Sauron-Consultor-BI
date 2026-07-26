/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  AlertTriangle,
  Building,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  GitPullRequest,
  ShieldCheck,
  X,
} from "lucide-react";
import type { OrganizationalReconciliationProposal } from "../core/enterprise-consolidation/OrganizationalReconciliationTypes";

interface ReconciliationPanelProps {
  proposal: OrganizationalReconciliationProposal;
  onConfirmReconciliation: (approvedCreations: string[], approvedAssociations: string[]) => void;
  onKeepUnreconciled: () => void;
}

export const ReconciliationPanel: React.FC<ReconciliationPanelProps> = ({
  proposal,
  onConfirmReconciliation,
  onKeepUnreconciled,
}) => {
  const [selectedCreations, setSelectedCreations] = useState<string[]>(
    proposal.proposedCreations.map(c => c.id)
  );

  const toggleCreation = (id: string) => {
    setSelectedCreations(curr =>
      curr.includes(id) ? curr.filter(item => item !== id) : [...curr, id]
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-6 font-sans shadow-xl" data-testid="reconciliation-panel">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <GitPullRequest size={20} className="text-indigo-400" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Estrutura Organizacional Encontrada na Fonte
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Conciliação entre o cadastro atual e as estruturas reveladas pelos dados
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
          Status: {proposal.status}
        </span>
      </div>

      {/* CONFLITOS EXPLICITOS */}
      {proposal.conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-black text-amber-300 uppercase tracking-wider">
            <AlertTriangle size={15} /> Atenção — Divergência de Contexto Detectada
          </div>
          {proposal.conflicts.map((conf, idx) => (
            <p key={idx} className="text-amber-200/90">• {conf}</p>
          ))}
        </div>
      )}

      {/* SUBSEÇÕES DA RECONCILIAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* O QUE JÁ ESTÁ CADASTRADO */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">O que já está cadastrado</span>
          <div className="space-y-1 text-slate-300 font-medium">
            <p>• Grupo Ativo: <strong className="text-white">{proposal.currentContext.groupId || "Nenhum (Empresa Independente)"}</strong></p>
            <p>• Empresa Ativa: <strong className="text-white">{proposal.currentContext.companyId || "Nenhuma"}</strong></p>
            <p>• Unidade Ativa: <strong className="text-white">{proposal.currentContext.unitId || "Nenhuma"}</strong></p>
          </div>
        </div>

        {/* O QUE ENCONTRAMOS NA FONTE */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">O que encontramos na fonte</span>
          <div className="space-y-1 text-slate-300 font-medium">
            <p>• Empresas reveladas: <strong className="text-white">{proposal.discoveredOrganization.discoveredCompanies.join(", ") || "Nenhuma adicional"}</strong></p>
            <p>• Unidades reveladas: <strong className="text-white">{proposal.discoveredOrganization.discoveredUnits.join(", ") || "Nenhuma adicional"}</strong></p>
          </div>
        </div>
      </div>

      {/* PROPOSTAS DE INCORPORAÇÃO ORGANIZACIONAL */}
      {proposal.proposedCreations.length > 0 && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
            Propostas de Incorporação ao Cadastro (Aprovação Explícita)
          </h4>
          <div className="space-y-2">
            {proposal.proposedCreations.map(creation => (
              <div key={creation.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCreations.includes(creation.id)}
                    onChange={() => toggleCreation(creation.id)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <div>
                    <strong className="font-extrabold text-white">{creation.suggestedName}</strong>
                    <span className="text-[10px] text-slate-400 block">{creation.evidence.description}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
                  {Math.round(creation.evidence.confidence * 100)}% Confiança
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTÕES DE CONFIRMAÇÃO FINAL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={onKeepUnreconciled}
          className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
        >
          Manter empresa independente / sem vincular
        </button>

        <button
          type="button"
          onClick={() => onConfirmReconciliation(selectedCreations, proposal.proposedAssociations.map(a => a.id))}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
        >
          <ShieldCheck size={16} /> Aprovar reconciliação selecionada
        </button>
      </div>
    </div>
  );
};

export default ReconciliationPanel;
