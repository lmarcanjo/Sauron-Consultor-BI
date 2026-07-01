/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  LayoutGrid, Database, TrendingUp, ShoppingBag, Users, ClipboardList, Target, Sparkles, FileText, Activity 
} from "lucide-react";

interface CaseContextTabsProps {
  activeTabId: string;
  setActiveTabId: (id: string) => void;
}

export const CaseContextTabs: React.FC<CaseContextTabsProps> = ({ activeTabId, setActiveTabId }) => {
  const tabs = [
    { id: "resumo", label: "Resumo do Projeto", icon: LayoutGrid },
    { id: "dados", label: "Dados Conectados", icon: Database },
    { id: "financeiro", label: "Financeiro & DRE", icon: TrendingUp },
    { id: "comercial", label: "Comercial", icon: ShoppingBag },
    { id: "pessoas", label: "Pessoas / Performance", icon: Users },
    { id: "reunioes", label: "Reuniões", icon: ClipboardList },
    { id: "planos", label: "Planos Táticos", icon: Target },
    { id: "apresentacoes", label: "Apresentações", icon: Sparkles },
    { id: "dossie", label: "Dossiê do Cliente", icon: FileText },
    { id: "historico", label: "Histórico do Cliente", icon: Activity }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xs overflow-x-auto flex gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTabId === tab.id;
        return (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
