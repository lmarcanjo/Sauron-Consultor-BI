/**
 * MVP-3 executive summary. It only projects the persisted analysis artifact.
 */

import React from "react";
import { Activity, AlertTriangle, Calendar, Database, FileSpreadsheet, Layers, ShieldAlert } from "lucide-react";
import type { PreliminaryFinancialAnalysisArtifact } from "../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ModuleActivationProjection } from "../core/module-activation/ModuleActivationContracts";
import type { WorkspaceProject } from "../modules/consultant-workspace/types";

interface ExecutiveSummaryPanelProps {
  artifact: PreliminaryFinancialAnalysisArtifact;
  project?: WorkspaceProject | null;
  moduleProjections?: readonly ModuleActivationProjection[];
  onOpenDashboard?: () => void;
  onOpenPresentation?: () => void;
}

const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const ExecutiveSummaryPanel: React.FC<ExecutiveSummaryPanelProps> = ({
  artifact,
  project,
  moduleProjections = [],
  onOpenDashboard,
  onOpenPresentation,
}) => {
  const metric = (code: string) => artifact.metrics.find(item => item.code === code)?.value;
  const periodItems = artifact.temporalSeries.flatMap(series => series.items);
  const period = periodItems.length > 0
    ? `${periodItems[0].periodKey} a ${periodItems[periodItems.length - 1].periodKey}`
    : "Não disponível no artefato";
  const usedFields = artifact.physicalFields.filter(field => field.usageStatus === "USED");
  const unresolvedFields = artifact.physicalFields.filter(field => field.usageStatus !== "USED");

  return (
    <section className="space-y-5" data-testid="executive-summary-panel">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <Activity size={12} /> PRELIMINARY
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ANÁLISE CONCLUÍDA</span>
            </div>
            <h1 className="mt-2 text-xl font-black">Resumo Executivo</h1>
            <p className="mt-1 text-xs font-semibold text-slate-400">Fatos observados na fonte, sem opinião ou recomendação automática.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {onOpenDashboard && <button type="button" onClick={onOpenDashboard} className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white" data-testid="open-executive-dashboard">ABRIR DASHBOARD</button>}
            {onOpenPresentation && <button type="button" onClick={onOpenPresentation} className="rounded-lg border border-slate-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-100" data-testid="open-executive-presentation">ABRIR APRESENTAÇÃO</button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3" data-testid="executive-context">
        {[
          ["Cliente", project?.client || artifact.clientId || "Cliente", Database],
          ["Engajamento", project?.id || artifact.engagementId, Layers],
          ["Fonte", artifact.sourceFileName, FileSpreadsheet],
          ["Escopo", `${artifact.organizationalScope.scopeType}: ${artifact.organizationalScope.targetId}`, Layers],
          ["Análise", new Date(artifact.generatedAt).toLocaleString("pt-BR"), Calendar],
          ["Versão", String(artifact.artifactVersion), ShieldAlert],
        ].map(([label, value, Icon]) => {
          const ContextIcon = Icon as React.ComponentType<{ size?: number; className?: string }>;
          return <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"><ContextIcon size={13} /> {String(label)}</div><p className="mt-1 truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={String(value)}>{String(value)}</p></div>;
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" data-testid="executive-summary-facts">
        <FactCard label="Registros" value={artifact.validRowCount.toLocaleString("pt-BR")} testId="summary-valid-rows" />
        <FactCard label="Campos" value={artifact.columnCount.toLocaleString("pt-BR")} testId="summary-columns" />
        <FactCard label="Valor Total" value={metric("VALUE_TOTAL") === undefined ? "Não disponível" : currency(metric("VALUE_TOTAL")!)} testId="summary-value-total" />
        <FactCard label="Valor Pago" value={metric("PAID_VALUE_TOTAL") === undefined ? "Não disponível" : currency(metric("PAID_VALUE_TOTAL")!)} testId="summary-paid-total" />
        <FactCard label="Saldo" value={metric("BALANCE_TOTAL") === undefined ? "Não disponível" : currency(metric("BALANCE_TOTAL")!)} testId="summary-balance-total" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="executive-period">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Resumo</h2>
          <dl className="mt-3 space-y-2 text-xs"><Row label="Registros físicos" value={artifact.physicalRowCount.toLocaleString("pt-BR")} /><Row label="Registros excluídos" value={artifact.excludedRowCount.toLocaleString("pt-BR")} /><Row label="Período observado" value={period} /><Row label="Moeda observada" value={artifact.metrics[0]?.unit || "Não disponível no artefato"} /><Row label="Status" value={artifact.status} /></dl>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="executive-visualizations">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Visualizações disponíveis</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">{artifact.groupings.map(group => <span key={group.dimensionCode} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">{group.dimensionLabel}</span>)}{artifact.temporalSeries.map(series => <span key={series.seriesCode} className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{series.seriesLabel}</span>)}</div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="executive-quality-summary">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Qualidade e limitações</h2>
          <dl className="mt-3 space-y-2 text-xs"><Row label="Campos utilizados" value={String(usedFields.length)} /><Row label="Campos não utilizados" value={String(unresolvedFields.length)} /><Row label="Achados" value={String(artifact.qualityFindings.length)} /><Row label="Limitações" value={String(artifact.limitations.length)} /></dl>
          {(artifact.limitations.length > 0 || artifact.qualityFindings.length > 0) && <ul className="mt-3 space-y-1 text-[11px] text-amber-700 dark:text-amber-300">{[...artifact.limitations.map(item => item.message), ...artifact.qualityFindings.map(item => item.message)].slice(0, 4).map((item, index) => <li key={`${artifact.artifactId}-quality-${index}`} className="flex gap-1"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{item}</li>)}</ul>}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid="executive-module-status">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Status dos módulos</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-5">{moduleProjections.map(projection => { const label: Record<string, string> = { FINANCIAL: "Financeiro", COMMERCIAL: "Comercial", INVENTORY: "Estoque", ITEMS: "Itens", AFTER_SALES: "Pós-vendas" }; const reason = projection.missingRequirements.join(", ") || projection.limitations[0]; return <div key={projection.moduleId} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"><p className="text-[10px] font-black uppercase text-slate-500">{label[projection.moduleId] || projection.moduleId}</p><p className="mt-1 text-xs font-black text-slate-900 dark:text-white">{projection.status}</p>{reason && <p className="mt-1 text-[10px] font-semibold text-slate-500">{reason}</p>}</div>; })}</div>
      </section>
    </section>
  );
};

const FactCard: React.FC<{ label: string; value: string; testId: string }> = ({ label, value, testId }) => <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid={testId}><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-base font-black text-slate-900 dark:text-white">{value}</p></div>;
const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="flex justify-between gap-3"><dt className="font-semibold text-slate-500">{label}</dt><dd className="text-right font-black text-slate-800 dark:text-slate-200">{value}</dd></div>;

export default ExecutiveSummaryPanel;
