/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * DashboardPage.tsx — Dashboard dinâmico com consolidação de grupo ou visão individual por escopo.
 */

import React, { useEffect, useState } from "react";
import { Database, FileSpreadsheet, TableProperties, Network, Building, Layers, Activity, ShieldAlert } from "lucide-react";
import { LancamentoFinanceiro } from "../../types";
import { ActiveDataset } from "../../types/dataSource";
import { activeDatasetStore } from "../../core/data/ActiveDatasetStore";
import { getDefaultProjectId, listModuleMappings, subscribeModuleMappings } from "../../core/data/moduleMapping";
import { buildExecutiveDashboard, ExecutiveDashboard } from "../../core/dashboard-engine";
import { ActiveDatasetRawPreview } from "../ActiveDatasetRawPreview";
import { DashboardBlocksRenderer } from "../DashboardBlocksRenderer";
import { SmartConfigurationPanel } from "../SmartConfigurationPanel";
import { DomainContextPanel } from "../DomainContextPanel";
import { getEnterpriseContext, subscribeEnterpriseContext, enterpriseConsolidationService } from "../../core/enterprise-consolidation";
import { enterpriseRepository, Enterprise, Company, BusinessGroup, Unit } from "../../core/persistence/EnterpriseRepository";

interface DashboardPageProps {
  filteredData: LancamentoFinanceiro[];
  formatCurrency: (value: number) => string;
  activeDataset?: ActiveDataset | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ activeDataset: activeDatasetProp, formatCurrency }) => {
  const activeDataset = activeDatasetProp || activeDatasetStore.getActiveDataset();
  
  const [context, setContext] = useState(getEnterpriseContext());
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null);
  const [mappingRevision, setMappingRevision] = useState(0);

  // Group Consolidation State
  const [groupMetrics, setGroupMetrics] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [compatibility, setCompatibility] = useState<any>(null);

  useEffect(() => {
    // Sintonizar contexto ativo
    const unsubscribeCtx = subscribeEnterpriseContext(setContext);
    const handleContextEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) setContext(customEvent.detail);
    };
    window.addEventListener("sauron:context-updated", handleContextEvent);

    return () => {
      unsubscribeCtx();
      window.removeEventListener("sauron:context-updated", handleContextEvent);
    };
  }, []);

  useEffect(() => {
    return subscribeModuleMappings(() => setMappingRevision(revision => revision + 1));
  }, []);

  // Recalcular métricas consolidadas ou instanciar dashboard individual
  useEffect(() => {
    let isMounted = true;
    if (!activeDataset) return;

    enterpriseRepository.getAll().then(list => {
      if (isMounted) setEnterprises(list);
    });

    if (context.scope === "GROUP") {
      // Calcular métricas consolidadas do Grupo
      enterpriseConsolidationService.calculateConsolidatedMetrics(context).then(metrics => {
        if (isMounted) setGroupMetrics(metrics);
      });
      enterpriseConsolidationService.getConsolidationCompatibility(context).then(comp => {
        if (isMounted) setCompatibility(comp);
      });
      setDashboard(null);
    } else {
      // Escopo individual (COMPANY ou UNIT): Instanciar usando rowProvider seguro
      const projectId = getDefaultProjectId(activeDataset);
      const moduleMappings = listModuleMappings(activeDataset.datasetId, projectId);

      enterpriseConsolidationService.getRecordsForContext(context, 1, 100000).then(({ records }) => {
        if (!isMounted) return;

        const rowProvider = async (sheetName: string, limit: number) => {
          return records.slice(0, limit);
        };

        buildExecutiveDashboard({
          activeDataset,
          moduleMappings,
          rowProvider
        }).then(result => {
          if (isMounted) setDashboard(result);
        });
      });
    }

    return () => {
      isMounted = false;
    };
  }, [activeDataset?.datasetId, activeDataset?.importedAt, mappingRevision, context]);

  if (!activeDataset) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in bg-white dark:bg-slate-950 text-left">
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
          <FileSpreadsheet className="text-emerald-500 w-12 h-12" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Nenhuma fonte de dados ativa.
            Importe uma planilha ou conecte um banco para gerar análises.
          </p>
        </div>
      </div>
    );
  }

  const activeGroup = enterprises.find(e => e.id === context.groupId) as BusinessGroup;
  const activeCompany = enterprises.find(e => e.id === context.companyId) as Company;
  const activeUnit = enterprises.find(e => e.id === context.unitId) as Unit;

  return (
    <div className="flex flex-col gap-6 animate-fade-in bg-white dark:bg-slate-950 text-left font-sans">
      
      {/* Context Indicator Header */}
      <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl text-white flex justify-between items-center shadow-md">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-450">Contexto Analítico Ativo</span>
          <h2 className="text-base font-black tracking-tight mt-0.5">
            {context.scope === "GROUP" ? `Visão Consolidada — Grupo ${activeGroup?.name || "Holding"}` :
             context.scope === "COMPANY" ? `Visão Individual — Empresa ${activeCompany?.name || "Unidade"}` :
             `Visão Local — Unidade ${activeUnit?.name || "Filial"}`}
          </h2>
        </div>
        <span className="text-[10px] font-mono font-black uppercase text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/10">
          {context.scope} SCOPE
        </span>
      </div>

      {context.scope === "GROUP" ? (
        /* Renderização da Visão Consolidada do Grupo */
        <div className="space-y-6">
          
          {/* Compatibility Checker Alert */}
          {compatibility && !compatibility.compatible && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 rounded-xl flex items-start gap-3">
              <ShieldAlert className="shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider">Aviso de Inconsistência</h4>
                <p className="text-[11px] leading-normal">{compatibility.message}</p>
              </div>
            </div>
          )}

          {/* Quick Metrics Widgets */}
          {groupMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-[9px] font-black uppercase text-slate-400">Faturamento Consolidado</span>
                <p className="text-lg font-black text-slate-850 dark:text-white mt-1">{formatCurrency(groupMetrics.receita)}</p>
                <span className="text-[8px] font-mono text-slate-400 block mt-1">Lineage: Coluna Receita</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-[9px] font-black uppercase text-slate-400">Custos Combinados</span>
                <p className="text-lg font-black text-slate-850 dark:text-white mt-1">{formatCurrency(groupMetrics.custo)}</p>
                <span className="text-[8px] font-mono text-slate-400 block mt-1">Lineage: Coluna Custo</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-[9px] font-black uppercase text-slate-400">Resultado Operacional</span>
                <p className={`text-lg font-black mt-1 ${groupMetrics.lucro >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {formatCurrency(groupMetrics.lucro)}
                </p>
                <span className="text-[8px] font-mono text-slate-400 block mt-1">Margem: {groupMetrics.margem.toFixed(1)}%</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-[9px] font-black uppercase text-slate-400">Força Comercial</span>
                <p className="text-lg font-black text-slate-850 dark:text-white mt-1">{groupMetrics.sellersCount} Vendedores</p>
                <span className="text-[8px] font-mono text-slate-400 block mt-1">Ticket Médio: {formatCurrency(groupMetrics.ticketAvg)}</span>
              </div>
            </div>
          )}

          {/* Group Companies Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <Network size={14} className="text-blue-500" /> Ranking e Disponibilidade das Empresas
            </h3>
            
            <div className="space-y-3">
              {enterprises
                .filter(e => e.type === "Empresa" && e.parentId === context.groupId)
                .map(company => {
                  const hasWorkbooks = (company as any).workbookIds?.length > 0;
                  return (
                    <div key={company.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-slate-450" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{company.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          hasWorkbooks ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {hasWorkbooks ? "Dados disponíveis" : "Sem workbook vinculado"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      ) : (
        /* Renderização do Dashboard Executivo Padrão da Empresa/Unidade */
        <>
          <ActiveDatasetRawPreview />
          <DomainContextPanel />
          <SmartConfigurationPanel activeDataset={activeDataset} onApplied={() => setMappingRevision(revision => revision + 1)} />

          {!dashboard ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Preparando blocos executivos da empresa...</p>
            </div>
          ) : (
            <DashboardBlocksRenderer blocks={dashboard.blocks} />
          )}
        </>
      )}

    </div>
  );
};
export default DashboardPage;
