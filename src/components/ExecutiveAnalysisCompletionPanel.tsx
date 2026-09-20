import React from "react";
import { CheckCircle2, Presentation, BarChart3, ArrowRight } from "lucide-react";
import type { PreliminaryFinancialAnalysisArtifact } from "../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts";

interface ExecutiveAnalysisCompletionPanelProps {
  artifact: PreliminaryFinancialAnalysisArtifact;
  onOpenSummary?: () => void;
  onOpenDashboard?: () => void;
  onGeneratePresentation?: () => void;
}

export const ExecutiveAnalysisCompletionPanel: React.FC<ExecutiveAnalysisCompletionPanelProps> = ({ artifact, onOpenSummary, onOpenDashboard, onGeneratePresentation }) => (
  <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20" data-testid="analysis-completed-panel">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={22} />
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200">ANÁLISE CONCLUÍDA</h2>
        <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">Os materiais executivos foram preparados a partir do artefato {artifact.artifactVersion} da fonte {artifact.sourceFileName}.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {onOpenSummary && <button type="button" onClick={onOpenSummary} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white" data-testid="open-executive-summary"><ArrowRight size={13} /> ABRIR RESUMO EXECUTIVO</button>}
          {onOpenDashboard && <button type="button" onClick={onOpenDashboard} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200" data-testid="open-executive-dashboard-action"><BarChart3 size={13} /> ABRIR DASHBOARD</button>}
          {onGeneratePresentation && <button type="button" onClick={onGeneratePresentation} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200" data-testid="generate-executive-presentation"><Presentation size={13} /> GERAR APRESENTAÇÃO</button>}
        </div>
      </div>
    </div>
  </section>
);

export default ExecutiveAnalysisCompletionPanel;
