/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * DashboardPage.tsx — Dashboard dinâmico com consolidação de grupo ou visão individual por escopo.
 */

import React, { useEffect, useState } from "react";
import { FileSpreadsheet, ShieldAlert } from "lucide-react";
import { LancamentoFinanceiro } from "../../types";
import { ActiveDataset } from "../../types/dataSource";
import { activeDatasetStore } from "../../core/data/ActiveDatasetStore";
import { getDefaultProjectId, listModuleMappings, subscribeModuleMappings } from "../../core/data/moduleMapping";
import { buildExecutiveDashboard, ExecutiveDashboard } from "../../core/dashboard-engine";
import { ActiveDatasetRawPreview } from "../ActiveDatasetRawPreview";
import { DashboardBlocksRenderer } from "../DashboardBlocksRenderer";
import { FinancialConsistencyStatus } from "../FinancialConsistencyStatus";
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
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [compatibility, setCompatibility] = useState<any>(null);

  useEffect(() => {
    // Sintonizar contexto ativo
    const unsubscribeCtx = subscribeEnterpriseContext(setContext);
    return () => {
      unsubscribeCtx();
    };
  }, []);

  useEffect(() => {
    return subscribeModuleMappings(() => setMappingRevision(revision => revision + 1));
  }, []);

  // All scopes use the same dashboard engine. The context service only
  // supplies the bounded rows for the selected company, unit, or group.
  useEffect(() => {
    let isMounted = true;
    if (!activeDataset) return;

    enterpriseRepository.getAll().then(list => {
      if (isMounted) setEnterprises(list);
    });

    if (context.scope === "GROUP") {
      enterpriseConsolidationService.getConsolidationCompatibility(context).then(comp => {
        if (isMounted) setCompatibility(comp);
      });
    } else {
      setCompatibility(null);
    }

    const projectId = getDefaultProjectId(activeDataset);
    const moduleMappings = listModuleMappings(activeDataset.datasetId, projectId);
    enterpriseConsolidationService.getRecordsForContext(context, 1, 100000).then(({ records }) => {
      if (!isMounted) return;
      const rowProvider = async (_sheetName: string, limit: number) => records.slice(0, limit);
      buildExecutiveDashboard({
        activeDataset,
        moduleMappings,
        rowProvider,
        contextType: context.scope,
        contextId: context.unitId || context.companyId || context.groupId || activeDataset.datasetId,
        workspaceId: context.workspaceId,
        period: context.period,
      }).then(result => {
        if (isMounted) setDashboard(result);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [activeDataset?.datasetId, activeDataset?.importedAt, mappingRevision, context]);

  if (!activeDataset) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in bg-white dark:bg-slate-950 text-left">
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
          <FileSpreadsheet className="text-emerald-500 w-12 h-12" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Nenhuma fonte de dados ativa.</h3>
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Nenhuma fonte de dados ativa.
            Importe uma planilha real para começar a análise.
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
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-450">Visão selecionada</span>
          <h2 className="text-base font-black tracking-tight mt-0.5">
            {context.scope === "GROUP" ? `Visão consolidada - ${activeGroup?.name || "grupo não selecionado"}` :
             context.scope === "COMPANY" ? `Visão da empresa - ${activeCompany?.name || "não selecionada"}` :
             `Visão da unidade - ${activeUnit?.name || "não selecionada"}`}
          </h2>
        </div>
        <span className="text-[10px] font-mono font-black uppercase text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/10">
          {context.scope === "GROUP" ? "Grupo" : context.scope === "COMPANY" ? "Empresa" : "Unidade"}
        </span>
      </div>

      {context.scope === "GROUP" && compatibility && !compatibility.compatible && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 rounded-xl flex items-start gap-3">
          <ShieldAlert className="shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider">Aviso de compatibilidade</h4>
            <p className="text-[11px] leading-normal">{compatibility.message}</p>
          </div>
        </div>
      )}

      <ActiveDatasetRawPreview />
      {dashboard?.consistency && <FinancialConsistencyStatus consistency={dashboard.consistency} />}
      <DomainContextPanel />
      <SmartConfigurationPanel activeDataset={activeDataset} onApplied={() => setMappingRevision(revision => revision + 1)} />

      {!dashboard ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">Preparando sua visão executiva...</p>
        </div>
      ) : (
        <DashboardBlocksRenderer blocks={dashboard.blocks} />
      )}

    </div>
  );
};
export default DashboardPage;
