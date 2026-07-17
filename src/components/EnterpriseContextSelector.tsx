/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * EnterpriseContextSelector.tsx — Seletor global de contexto organizacional e período fiscal.
 */

import React, { useState, useEffect } from "react";
import { Network, Building, Layers, ChevronDown, CheckCircle2, ShieldAlert } from "lucide-react";
import { enterpriseRepository, Enterprise, BusinessGroup, Company, Unit } from "../core/persistence/EnterpriseRepository";
import { getEnterpriseContext, setEnterpriseContext, subscribeEnterpriseContext } from "../core/enterprise-consolidation";
import { useDataSourceManager } from "../hooks/useDataSourceManager";
import { PLATFORM_EVENTS, subscribePlatformEvent } from "../core/events/PlatformEvents";

export const EnterpriseContextSelector: React.FC = () => {
  const { activeRecords } = useDataSourceManager();

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [context, setContext] = useState(getEnterpriseContext());
  
  const [groups, setGroups] = useState<BusinessGroup[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  // Load structures and hook store listener
  useEffect(() => {
    const loadData = async () => {
      const list = await enterpriseRepository.getAll();
      setEnterprises(list);

      setGroups(list.filter(e => e.type === "Grupo") as BusinessGroup[]);
      setCompanies(list.filter(e => e.type === "Empresa") as Company[]);
      setUnits(list.filter(e => e.type === "Unidade") as Unit[]);

      const uniquePeriods = Array.from(
        new Set(activeRecords.map(r => r.Mês || r["mês"] || r["Mes"] || "").filter(Boolean))
      ).sort();
      setPeriods(uniquePeriods);
    };

    loadData();

    // Subscribe to global context updates
    const unsubscribe = subscribeEnterpriseContext(setContext);
    
    // Listen to changes in persistence to reload lists
    const handleDictUpdate = () => loadData();
    window.addEventListener("sauron:dictionary-updated", handleDictUpdate);
    const unsubscribePlatform = subscribePlatformEvent(PLATFORM_EVENTS.ENTERPRISE_CONTEXT_CHANGED, handleDictUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("sauron:dictionary-updated", handleDictUpdate);
      unsubscribePlatform();
    };
  }, [activeRecords]);

  // Handler for context changes
  const changeScope = (scope: "GROUP" | "COMPANY" | "UNIT", id?: string) => {
    const nextContext = { ...context, scope };

    if (scope === "GROUP") {
      nextContext.groupId = id || groups[0]?.id;
      nextContext.companyId = undefined;
      nextContext.unitId = undefined;
    } else if (scope === "COMPANY") {
      nextContext.companyId = id || companies[0]?.id;
      const comp = companies.find(c => c.id === nextContext.companyId);
      nextContext.groupId = comp?.parentId;
      nextContext.unitId = undefined;
    } else if (scope === "UNIT") {
      nextContext.unitId = id || units[0]?.id;
      const u = units.find(unit => unit.id === nextContext.unitId);
      nextContext.companyId = u?.parentId;
      const comp = companies.find(c => c.id === nextContext.companyId);
      nextContext.groupId = comp?.parentId;
    }

    setEnterpriseContext(nextContext);
  };

  const changePeriod = (val: string) => {
    setEnterpriseContext({
      ...context,
      period: val ? { start: val, end: val } : undefined
    });
  };

  const activeGroup = groups.find(g => g.id === context.groupId) || groups[0];
  const activeCompany = companies.find(c => c.id === context.companyId);
  const activeUnit = units.find(u => u.id === context.unitId);

  return (
    <div className="relative font-sans text-xs" id="enterprise-context-selector">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-100 rounded-xl cursor-pointer transition-all shadow-sm select-none"
      >
        <Network size={13} className="text-blue-400" />
        <span className="font-extrabold uppercase tracking-tight">
          {context.scope === "GROUP" ? `Grupo: ${activeGroup?.name || "Consolidado"}` :
           context.scope === "COMPANY" ? `Empresa: ${activeCompany?.name || "Individual"}` :
           `Unidade: ${activeUnit?.name || "Local"}`}
        </span>
        {context.period?.start && (
          <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-blue-300 font-bold font-mono">
            {context.period.start}
          </span>
        )}
        <ChevronDown size={11} className="text-slate-400" />
      </div>

      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Selector Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-left space-y-4 text-slate-200 animate-fade-in">
            
            {/* Scope selectors */}
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Escopo de Consolidação</span>
              
              {/* Group consolidator selector */}
              {groups.map(g => (
                <div 
                  key={g.id}
                  onClick={() => { changeScope("GROUP", g.id); setIsOpen(false); }}
                  className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                    context.scope === "GROUP" && context.groupId === g.id
                      ? "bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold"
                      : "bg-slate-950/20 border-slate-800 hover:bg-slate-800/50 text-slate-350"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers size={13} />
                    <span>Consolidado Grupo: {g.name}</span>
                  </div>
                  {context.scope === "GROUP" && context.groupId === g.id && <CheckCircle2 size={11} />}
                </div>
              ))}

              {/* Companies selector */}
              <div className="space-y-1 pt-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase block pl-1">Filtrar por Empresa</span>
                <div className="max-h-[120px] overflow-y-auto pr-1 space-y-1">
                  {companies.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => { changeScope("COMPANY", c.id); setIsOpen(false); }}
                      className={`flex items-center justify-between p-1.5 pl-3 rounded-lg border text-[11px] cursor-pointer transition-all ${
                        context.scope === "COMPANY" && context.companyId === c.id
                          ? "bg-emerald-600/15 border-emerald-500 text-emerald-400 font-bold"
                          : "bg-slate-950/10 border-slate-850 hover:bg-slate-800/40 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Building size={11} />
                        <span>{c.name}</span>
                      </div>
                      {context.scope === "COMPANY" && context.companyId === c.id && <CheckCircle2 size={10} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Units selector */}
              {units.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase block pl-1">Filtrar por Unidade</span>
                  <div className="max-h-[100px] overflow-y-auto pr-1 space-y-1">
                    {units.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => { changeScope("UNIT", u.id); setIsOpen(false); }}
                        className={`flex items-center justify-between p-1.5 pl-3 rounded-lg border text-[11px] cursor-pointer transition-all ${
                          context.scope === "UNIT" && context.unitId === u.id
                            ? "bg-purple-600/15 border-purple-500 text-purple-400 font-bold"
                            : "bg-slate-950/10 border-slate-850 hover:bg-slate-800/40 text-slate-400"
                        }`}
                      >
                        <span>{u.name}</span>
                        {context.scope === "UNIT" && context.unitId === u.id && <CheckCircle2 size={10} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Period filter selector */}
            {periods.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Período de Dados</span>
                <select
                  value={context.period?.start || ""}
                  onChange={e => { changePeriod(e.target.value); setIsOpen(false); }}
                  className="w-full bg-slate-950 text-[11px] font-bold text-slate-300 px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-hidden"
                >
                  <option value="">-- Todos os períodos --</option>
                  {periods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};
export default EnterpriseContextSelector;
