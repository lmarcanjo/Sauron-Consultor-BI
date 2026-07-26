import React from "react";
import { ArrowRight } from "lucide-react";

interface ReviewSourceAnalysisActionProps {
  onOpen?: () => void;
}

/** Keeps the only configuration action pointing back to Structural Analysis. */
export const ReviewSourceAnalysisAction: React.FC<ReviewSourceAnalysisActionProps> = ({ onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-300 dark:hover:bg-amber-950/40"
  >
    Revisar análise da fonte
    <ArrowRight size={12} aria-hidden="true" />
  </button>
);
