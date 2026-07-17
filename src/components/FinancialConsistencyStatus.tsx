import React from "react";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { ConsistencyReadinessReport } from "../core/financial-consistency";

interface FinancialConsistencyStatusProps {
  consistency: ConsistencyReadinessReport;
}

export const FinancialConsistencyStatus: React.FC<FinancialConsistencyStatusProps> = ({ consistency }) => {
  const isReady = consistency.status === "consistent";
  const isBlocked = consistency.status === "inconsistent";
  const Icon = isReady ? CheckCircle2 : isBlocked ? ShieldAlert : Clock3;
  const colors = isReady
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
    : isBlocked
      ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300";

  return (
    <section className={`rounded-xl border p-3 flex items-start gap-2.5 ${colors}`} aria-live="polite">
      <Icon size={17} className="shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="text-xs font-black">{consistency.message}</p>
        <p className="text-[11px] leading-normal opacity-90">
          {isReady
            ? "Os valores aplicáveis estão iguais à fonte selecionada."
            : isBlocked
              ? "Revise a configuração antes de apresentar estes dados."
              : "Algumas etapas ainda aguardam confirmação para liberar a apresentação."}
        </p>
      </div>
    </section>
  );
};

