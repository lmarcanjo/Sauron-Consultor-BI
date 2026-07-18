/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GlobalContextBar.tsx — Painel interativo permanente de contexto cognitivo e fiscal.
 * Clique em qualquer propriedade altera imediatamente todo o sistema.
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Building, Network, Calendar, Sliders, Database, ChevronDown, CheckCircle2, Layers 
} from "lucide-react";
import { enterpriseRepository, Enterprise, BusinessGroup, Company, Unit } from "../core/persistence/EnterpriseRepository";
import { getEnterpriseContext, setEnterpriseContext, subscribeEnterpriseContext, enterpriseConsolidationService } from "../core/enterprise-consolidation";
import { identityEngine } from "../core/identity/IdentityEngine";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { Workspace } from "../core/workspace-intelligence/WorkspaceIntelligenceTypes";
import { useDataSourceManager } from "../hooks/useDataSourceManager";
import { timelineRepository } from "../core/persistence/TimelineRepository";
import { showToast } from "./Toast";
import { PLATFORM_EVENTS, subscribePlatformEvent } from "../core/events/PlatformEvents";
import { getDomainDisplayOptions, getDomainDisplayLabel } from "../core/business-domains";
import { consultingModelRepository, setActiveConsultingModelConfigSync } from "../core/business-intelligence/ConsultingModelRepository";

export const GlobalContextBar: React.FC = () => {
  const { activeRecords, activeDataset } = useDataSourceManager();

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [context, setContext] = useState(getEnterpriseContext());
  
  const [groups, setGroups] = useState<BusinessGroup[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isUpdatingContext, setIsUpdatingContext] = useState(false);

  const [displayHistory, setDisplayHistory] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("sauron_display_activity_history") === "true";
    }
    return false;
  });

  const handleHistoryToggle = (checked: boolean) => {
    setDisplayHistory(checked);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sauron_display_activity_history", String(checked));
      window.dispatchEvent(new CustomEvent("sauron:preference-updated", { detail: { displayActivityHistory: checked } }));
    }
  };

  const loadData = React.useCallback(async () => {
    const list = await enterpriseRepository.getAll();
    setEnterprises(list);

    setGroups(list.filter(e => e.type === "Grupo") as BusinessGroup[]);
    setCompanies(list.filter(e => e.type === "Empresa") as Company[]);
    setUnits(list.filter(e => e.type === "Unidade") as Unit[]);
    setWorkspaces(identityEngine.getVisibleWorkspaces());

    const activeWs = identityEngine.getCurrentWorkspace() as any;
    if (activeWs) {
      const allWss = workspaceIntelligenceEngine.getWorkspaceRegistry().workspaces;
      setCurrentWorkspace(allWss[activeWs.id] || activeWs);
    }

    const uniquePeriods = Array.from(
      new Set(activeRecords.map(r => r.Mês || r["mês"] || r["Mes"] || "").filter(Boolean))
    ).sort();
    setPeriods(uniquePeriods);
  }, [activeRecords]);

  useEffect(() => {
    loadData();

    const unsubscribe = subscribeEnterpriseContext(setContext);
    
    const handleUpdate = () => loadData();
    window.addEventListener("sauron:dictionary-updated", handleUpdate);
    const unsubscribePlatform = subscribePlatformEvent(PLATFORM_EVENTS.ENTERPRISE_CONTEXT_CHANGED, handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("sauron:dictionary-updated", handleUpdate);
      unsubscribePlatform();
    };
  }, [loadData]);

  // Context Switchers
  const handleGroupChange = async (groupId: string) => {
    const target = groups.find(g => g.id === groupId);
    if (!target) return;
    const nextContext = {
      ...context,
      scope: "GROUP" as const,
      groupId,
      companyId: undefined,
      unitId: undefined,
      // Resolved sources belong to the previous scope. The consolidation
      // service repopulates them for the new scope after this event.
      workbookIds: [],
      datasetIds: []
    };
    setIsUpdatingContext(true);
    try {
      setEnterpriseContext(nextContext);
      await timelineRepository.log("LINK", "Foco do Grupo alterado", `Novo Grupo: ${target.name}`);
      showToast("success", `Visualizando ${target.name}.`);
    } finally {
      window.setTimeout(() => setIsUpdatingContext(false), 800);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    const workspaceId = context.workspaceId || "workspace_default";
    const groupId = context.groupId || "group_default";

    if (companyId === "all") {
      if (context.groupId) {
        let config = await consultingModelRepository.getConfiguration(workspaceId);
        if (!config) {
          config = consultingModelRepository.createDefaultConfiguration(workspaceId, groupId);
          await consultingModelRepository.saveConfiguration(config);
        }
        setActiveConsultingModelConfigSync(config);

        const nextContext = {
          ...context,
          scope: "GROUP" as const,
          companyId: undefined,
          unitId: undefined,
          workbookIds: context.workbookIds || [],
          datasetIds: context.datasetIds || []
        };
        setIsUpdatingContext(true);
        try {
          setEnterpriseContext(nextContext);
          await enterpriseConsolidationService.refreshActiveDatasetForContext(nextContext);
          await timelineRepository.log("LINK", "Foco do Grupo alterado", "Visão consolidada do grupo");
          showToast("success", "Visão consolidada do grupo ativada.");
        } finally {
          window.setTimeout(() => setIsUpdatingContext(false), 800);
        }
      }
      return;
    }
    const target = companies.find(c => c.id === companyId);
    if (!target) return;

    let config = await consultingModelRepository.getConfiguration(workspaceId, companyId);
    if (!config) {
      config = consultingModelRepository.createDefaultConfiguration(workspaceId, groupId, companyId);
      await consultingModelRepository.saveConfiguration(config);
    }
    setActiveConsultingModelConfigSync(config);

    const nextContext = {
      ...context,
      scope: "COMPANY" as const,
      companyId,
      groupId: target.parentId,
      unitId: undefined,
      workbookIds: context.workbookIds || [],
      datasetIds: context.datasetIds || []
    };
    setIsUpdatingContext(true);
    try {
      setEnterpriseContext(nextContext);
      await enterpriseConsolidationService.refreshActiveDatasetForContext(nextContext);
      await timelineRepository.log("LINK", "Foco da Empresa alterado", `Nova Empresa: ${target.name}`);
      showToast("success", `Visualizando ${target.name}.`);
    } finally {
      window.setTimeout(() => setIsUpdatingContext(false), 800);
    }
  };

  const handleUnitChange = async (unitId: string) => {
    if (unitId === "all") {
      if (context.companyId) {
        handleCompanyChange(context.companyId);
      }
      return;
    }
    const target = units.find(u => u.id === unitId);
    if (!target) return;

    const workspaceId = context.workspaceId || "workspace_default";
    const groupId = context.groupId || "group_default";
    const parentCompany = companies.find(c => c.id === target.parentId);
    const parentCompanyId = parentCompany?.id;
    
    let config = await consultingModelRepository.getConfiguration(workspaceId, parentCompanyId);
    if (!config) {
      config = consultingModelRepository.createDefaultConfiguration(workspaceId, groupId, parentCompanyId);
      await consultingModelRepository.saveConfiguration(config);
    }
    setActiveConsultingModelConfigSync(config);

    const nextContext = {
      ...context,
      scope: "UNIT" as const,
      unitId,
      companyId: target.parentId,
      groupId: parentCompany?.parentId,
      workbookIds: context.workbookIds || [],
      datasetIds: context.datasetIds || []
    };
    setIsUpdatingContext(true);
    try {
      setEnterpriseContext(nextContext);
      await enterpriseConsolidationService.refreshActiveDatasetForContext(nextContext);
      await timelineRepository.log("LINK", "Foco da Unidade alterado", `Nova Unidade: ${target.name}`);
      showToast("success", `Visualizando ${target.name}.`);
    } finally {
      window.setTimeout(() => setIsUpdatingContext(false), 800);
    }
  };

  const handleWorkspaceChange = async (wsId: string) => {
    try {
      const available = identityEngine.getVisibleWorkspaces().some(workspace => workspace.id === wsId);
      if (!available) {
        showToast("warning", "Este projeto não está mais disponível. Selecione outro projeto para continuar.");
        return;
      }
      identityEngine.switchWorkspace(wsId);
      await timelineRepository.log("LINK", "Mudança de Workspace", `Selecionado: ${wsId}`);
      showToast("success", "Projeto alternado com sucesso.");
      window.location.reload();
    } catch (e: any) {
      showToast("warning", "Este projeto não está mais disponível. Selecione outro projeto para continuar.");
    }
  };

  const handlePeriodChange = async (val: string) => {
    setEnterpriseContext({
      ...context,
      period: val ? { start: val, end: val } : undefined
    });
    await timelineRepository.log("LINK", "Período fiscal alterado", val ? `Foco em: ${val}` : "Todos os períodos");
    showToast("info", val ? `Período focado em: ${val}` : "Exibindo todos os períodos");
  };

  const handleSegmentChange = async (domainId: string) => {
    if (!currentWorkspace) {
      showToast("warning", "Este projeto não está mais disponível. Selecione outro projeto para continuar.");
      return;
    }
    try {
      workspaceIntelligenceEngine.updateWorkspaceDomain(currentWorkspace.id, domainId);
      await timelineRepository.log("LINK", "Área de atuação redefinida", `Área escolhida: ${getDomainDisplayLabel(domainId)}`);
      showToast("success", `Área de atuação definida como: ${getDomainDisplayLabel(domainId)}.`);
      // Reload mappings and reload page logic
      window.location.reload();
    } catch {
      showToast("warning", "Este projeto não está mais disponível. Selecione outro projeto para continuar.");
    }
  };

  // Resolved Display Values
  const activeGroup = groups.find(g => g.id === context.groupId) || groups[0];
  const activeCompany = companies.find(c => c.id === context.companyId);
  const activeUnit = units.find(u => u.id === context.unitId);
  
  const currentSegment = currentWorkspace?.manualDomain || currentWorkspace?.detectedDomain || "neutral";
  const numFontes = activeDataset
    ? activeDataset.sourceWorkbookIds?.length || activeDataset.sourceDatasetIds?.length || 1
    : 0;
  const numRegistros = activeRecords.length;

  // Filter companies/units down by current parent hierarchy
  const availableCompanies = context.groupId 
    ? companies.filter(c => c.parentId === context.groupId)
    : companies;

  const availableUnits = context.companyId
    ? units.filter(u => u.parentId === context.companyId)
    : units;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 px-4 shadow-sm text-slate-350 text-[11px] font-sans flex flex-wrap items-center justify-between gap-4 select-none" aria-busy={isUpdatingContext}>
      
      {/* Scope Selector Section */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* GROUP SELECTOR */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors">
          <Network size={12} className="text-blue-400 shrink-0" aria-hidden="true" />
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Grupo:</span>
          <select
            aria-label="Selecionar grupo"
            value={context.groupId || ""} 
            onChange={(e) => handleGroupChange(e.target.value)}
            className="bg-transparent text-white font-bold pr-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded cursor-pointer text-[11px] max-w-[120px]"
          >
            {groups.length === 0 && <option value="" className="bg-slate-900">Nenhum</option>}
            {groups.map(g => (
              <option key={g.id} value={g.id} className="bg-slate-900 text-slate-200">{g.name}</option>
            ))}
          </select>
        </div>

        {/* COMPANY SELECTOR */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors">
          <Building size={12} className="text-emerald-450 shrink-0" aria-hidden="true" />
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Empresa:</span>
          <select
            aria-label="Selecionar empresa"
            value={context.companyId || "all"} 
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="bg-transparent text-white font-bold pr-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded cursor-pointer text-[11px] max-w-[120px]"
          >
            <option value="all" className="bg-slate-900 text-slate-400">Consolidado</option>
            {availableCompanies.map(c => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">{c.name}</option>
            ))}
          </select>
        </div>

        {/* UNIT SELECTOR */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors">
          <Layers size={12} className="text-purple-400 shrink-0" aria-hidden="true" />
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Unidade:</span>
          <select
            aria-label="Selecionar unidade"
            value={context.unitId || "all"} 
            disabled={!context.companyId}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="bg-transparent text-white font-bold pr-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded cursor-pointer text-[11px] max-w-[120px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="all" className="bg-slate-900 text-slate-400">Geral</option>
            {availableUnits.map(u => (
              <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">{u.name}</option>
            ))}
          </select>
        </div>

        {/* WORKSPACE SELECTOR */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors">
          <Building size={12} className="text-amber-400 shrink-0" aria-hidden="true" />
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Projeto:</span>
          <select
            aria-label="Selecionar projeto"
            value={currentWorkspace?.id || ""} 
            onChange={(e) => handleWorkspaceChange(e.target.value)}
            className="bg-transparent text-white font-bold pr-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded cursor-pointer text-[11px] max-w-[120px]"
          >
            {workspaces.map(w => (
              <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">{w.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Stats and Period Section */}
      <div className="flex flex-wrap items-center gap-3">

        {/* PERIOD SELECTOR */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors">
          <Calendar size={12} className="text-indigo-400 shrink-0" aria-hidden="true" />
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Período:</span>
          <select
            aria-label="Selecionar período"
            value={context.period?.start || ""} 
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="bg-transparent text-white font-bold pr-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded cursor-pointer text-[11px]"
          >
            <option value="" className="bg-slate-900 text-slate-400">Todos</option>
            {periods.map(p => (
              <option key={p} value={p} className="bg-slate-900 text-slate-200">{p}</option>
            ))}
          </select>
        </div>

        {/* SEGMENT/DOMAIN SELECTOR */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors">
          <Sliders size={12} className="text-slate-400 shrink-0" aria-hidden="true" />
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Área de atuação:</span>
          <select
            aria-label="Selecionar área de atuação"
            value={currentSegment} 
            onChange={(e) => handleSegmentChange(e.target.value)}
            className="bg-transparent text-white font-bold pr-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded cursor-pointer text-[11px]"
          >
            {getDomainDisplayOptions().map(option => (
              <option key={option.id} value={option.id} className="bg-slate-900 text-slate-200">{option.label}</option>
            ))}
          </select>
        </div>

        {/* DISPLAY HISTORY PREFERENCE TOGGLE */}
        <label className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors text-slate-400 text-[10px] font-bold cursor-pointer">
          <input
            id="display-history-checkbox"
            type="checkbox"
            checked={displayHistory}
            onChange={(e) => handleHistoryToggle(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>Exibir histórico</span>
        </label>

        {/* INGESTION SUMMARY */}
        <div className="flex items-center gap-3 text-[10px] font-mono bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-850">
          <div className="flex items-center gap-1 text-slate-400">
            <Database size={11} className="text-blue-400 shrink-0" />
            <span>Fontes: <strong className="text-white">{numFontes}</strong></span>
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-1 text-slate-400">
            <CheckCircle2 size={11} className="text-emerald-450 shrink-0" />
            <span>Registros: <strong className="text-white">{numRegistros.toLocaleString("pt-BR")}</strong></span>
          </div>
        </div>

      </div>

      {isUpdatingContext && (
        <div className="w-full flex items-center gap-2 text-[10px] font-bold text-blue-300" role="status" aria-live="polite">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Atualizando a visão selecionada...
        </div>
      )}

    </div>
  );
};
export default GlobalContextBar;
