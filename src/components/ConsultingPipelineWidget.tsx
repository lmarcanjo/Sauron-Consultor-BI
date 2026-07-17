/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ConsultingPipelineWidget — Novo Pipeline Visual de 7 Etapas da Jornada do Consultor
 *
 * Lê dados dos repositórios existentes sem modificá-los.
 * Focado na jornada consultiva: Cliente → Importação → Validação → Análise → Reunião → Plano → Histórico
 */

import React from "react";
import {
  Building,
  FileSpreadsheet,
  CheckSquare,
  BarChart3,
  Presentation,
  TrendingUp,
  History,
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronRight,
  Zap
} from "lucide-react";
import { Enterprise } from "../core/persistence/EnterpriseRepository";
import { ActiveDataset, SpreadsheetFile } from "../types/dataSource";
import { ExecutivePresentation } from "../core/business-intelligence/ExecutivePresentationEngine";

export type PipelineStepStatus = "done" | "partial" | "pending" | "locked";

export interface PipelineStep {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  status: PipelineStepStatus;
  actionLabel?: string;
  actionTab?: string;
  weight: number;
}

interface ConsultingPipelineWidgetProps {
  enterprises: Enterprise[];
  activeDataset: ActiveDataset | null;
  activeFiles: SpreadsheetFile[];
  presentation: ExecutivePresentation | null;
  onSelectTab: (tab: string) => void;
}

function computePipelineSteps(
  enterprises: Enterprise[],
  activeDataset: ActiveDataset | null,
  activeFiles: SpreadsheetFile[],
  presentation: ExecutivePresentation | null
): PipelineStep[] {
  const hasEnterprise = enterprises.length > 0;
  const hasSegment = enterprises.some(e => e.segment && e.segment !== "");
  const hasData = !!activeDataset && activeDataset.rowCount > 0;
  const hasMapping = !!activeDataset && activeDataset.columnProfiles && activeDataset.columnProfiles.length > 0;
  const hasPresentation = !!presentation && presentation.status === "ready";

  // Check localStorage for action plan and meetings
  let hasActionPlan = false;
  let hasHistory = false;
  try {
    hasActionPlan = !!localStorage.getItem("sauron_plan_created");
    hasHistory = !!localStorage.getItem("sauron_ata_created");
  } catch (e) {}

  return [
    {
      id: "cliente",
      label: "Cliente",
      sublabel: hasEnterprise ? (hasSegment ? "Confirmado" : "Aguardando confirmação") : "Aguardando cadastro",
      icon: Building,
      status: hasEnterprise && hasSegment ? "done" : hasEnterprise ? "partial" : "pending",
      actionLabel: hasEnterprise ? undefined : "Cadastrar",
      actionTab: "enterprise_center",
      weight: 15
    },
    {
      id: "importacao",
      label: "Importação",
      sublabel: hasData ? "Planilha ativa" : "Aguardando planilhas",
      icon: FileSpreadsheet,
      status: hasData ? "done" : !hasEnterprise ? "locked" : "pending",
      actionLabel: hasData ? undefined : "Importar",
      actionTab: "importacao",
      weight: 15
    },
    {
      id: "validacao",
      label: "Validação",
      sublabel: hasMapping ? "Campos confirmados" : "Aguardando confirmação",
      icon: CheckSquare,
      status: hasMapping ? "done" : !hasData ? "locked" : "pending",
      actionLabel: hasMapping ? undefined : "Configurar",
      actionTab: "perfis",
      weight: 15
    },
    {
      id: "analise",
      label: "Análise",
      sublabel: hasMapping ? "Painel pronto" : "Aguardando dados",
      icon: BarChart3,
      status: hasMapping ? "done" : !hasData ? "locked" : "partial",
      actionLabel: hasMapping ? "Ver Painel" : undefined,
      actionTab: "resumo",
      weight: 15
    },
    {
      id: "reuniao",
      label: "Reunião",
      sublabel: hasPresentation ? "Deck disponível" : "Apresentação pendente",
      icon: Presentation,
      status: hasPresentation ? "done" : !hasMapping ? "locked" : "pending",
      actionLabel: hasPresentation ? "Iniciar Reunião" : undefined,
      actionTab: "modo_reuniao",
      weight: 15
    },
    {
      id: "plano",
      label: "Plano de Ação",
      sublabel: hasActionPlan ? "Plano criado" : "Pendente definição",
      icon: TrendingUp,
      status: hasActionPlan ? "done" : !hasPresentation ? "locked" : "pending",
      actionLabel: hasActionPlan ? "Ver Plano" : "Criar",
      actionTab: "plano_executivo",
      weight: 15
    },
    {
      id: "historico",
      label: "Histórico",
      sublabel: hasHistory ? "Ata registrada" : "Reunião pendente",
      icon: History,
      status: hasHistory ? "done" : !hasActionPlan ? "locked" : "pending",
      actionLabel: hasHistory ? "Ver Histórico" : undefined,
      actionTab: "historico_executivo",
      weight: 10
    }
  ];
}

function computeReadinessScore(steps: PipelineStep[]): number {
  let score = 0;
  for (const step of steps) {
    if (step.status === "done") score += step.weight;
    else if (step.status === "partial") score += step.weight * 0.5;
  }
  return Math.round(score);
}

function StatusIcon({ status }: { status: PipelineStepStatus }) {
  if (status === "done") return <CheckCircle2 size={16} className="text-emerald-500" />;
  if (status === "partial") return <AlertCircle size={16} className="text-amber-400" />;
  if (status === "locked") return <Circle size={16} className="text-slate-600" />;
  return <Circle size={16} className="text-slate-500" />;
}

function ReadinessRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color =
    score >= 90 ? "#10b981" :
    score >= 70 ? "#f59e0b" :
    score >= 40 ? "#3b82f6" :
    "#94a3b8";

  return (
    <svg width={52} height={52} viewBox="0 0 52 52">
      <circle cx={26} cy={26} r={r} fill="none" stroke="#1e293b" strokeWidth={5} />
      <circle
        cx={26}
        cy={26}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x={26}
        y={30}
        textAnchor="middle"
        fontSize={10}
        fontWeight="900"
        fill={color}
        fontFamily="monospace"
      >
        {score}%
      </text>
    </svg>
  );
}

export const ConsultingPipelineWidget: React.FC<ConsultingPipelineWidgetProps> = ({
  enterprises,
  activeDataset,
  activeFiles,
  presentation,
  onSelectTab
}) => {
  const steps = computePipelineSteps(enterprises, activeDataset, activeFiles, presentation);
  const score = computeReadinessScore(steps);

  const readinessLabel =
    score >= 90 ? "Pronto para reunião" :
    score >= 70 ? "Quase Pronto" :
    score >= 40 ? "Em Configuração" :
    "Primeiros passos";

  const readinessColor =
    score >= 90 ? "text-emerald-400" :
    score >= 70 ? "text-amber-400" :
    score >= 40 ? "text-blue-400" :
    "text-slate-400";

  // Compute indicators
  const indicators = [
    { label: "Empresa", done: enterprises.length > 0 },
    { label: "Dados", done: !!activeDataset && activeDataset.rowCount > 0 },
    { label: "KPIs", done: !!activeDataset && activeDataset.columnProfiles && activeDataset.columnProfiles.length > 0 },
    { label: "Apresentação", done: !!presentation && presentation.status === "ready" },
    { label: "Mercado", done: !!localStorage.getItem("sauron_market_configured") }
  ];

  // Count pending actions
  let pendingCount = 0;
  if (enterprises.length === 0) pendingCount++;
  if (!activeDataset || activeDataset.rowCount === 0) pendingCount++;
  if (activeDataset && (!activeDataset.columnProfiles || activeDataset.columnProfiles.length === 0)) pendingCount++;
  if (!presentation || presentation.status !== "ready") pendingCount++;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Header & Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/15">
            <Zap size={15} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Jornada do Consultor
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              Próximos passos do projeto consultivo
            </p>
          </div>
        </div>

        {/* Indicators and Readiness */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Indicators list */}
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 border-r border-slate-800 pr-4">
            {indicators.map((ind, i) => (
              <span key={i} className="flex items-center gap-0.5">
                <span className={ind.done ? "text-emerald-500" : "text-slate-650"}>
                  {ind.done ? "✔" : "○"}
                </span>
                {ind.label}
              </span>
            ))}
            {pendingCount > 0 && (
              <span className="text-amber-500 font-black pl-1 flex items-center gap-0.5">
                ⚠ {pendingCount} {pendingCount === 1 ? "Pendente" : "Pendentes"}
              </span>
            )}
          </div>

          <div className="text-right">
            <p className={`text-xs font-black uppercase ${readinessColor}`}>{readinessLabel}</p>
            <p className="text-[10px] text-slate-500 font-semibold">Progresso da jornada</p>
          </div>
          <ReadinessRing score={score} />
        </div>
      </div>

      {/* Steps List */}
      <div className="flex items-start gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.status === "partial" || (step.status === "pending" && idx > 0 && steps[idx - 1].status === "done");
          const isLocked = step.status === "locked";

          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex flex-col items-center gap-2 min-w-[110px] p-3 rounded-xl border transition-all ${
                  step.status === "done"
                    ? "border-emerald-850 bg-emerald-950/15"
                    : isActive
                    ? "border-amber-800 bg-amber-950/15 animate-pulse"
                    : isLocked
                    ? "border-slate-850 opacity-40"
                    : "border-slate-800 bg-slate-950/30"
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  step.status === "done" ? "bg-emerald-900/30 text-emerald-400" :
                  isActive ? "bg-amber-900/20 text-amber-400" :
                  isLocked ? "bg-slate-800/40 text-slate-600" :
                  "bg-slate-800/30 text-slate-500"
                }`}>
                  <Icon size={16} />
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-black uppercase ${
                    isLocked ? "text-slate-650" : "text-slate-200"
                  }`}>{step.label}</p>
                  <p className="text-[8px] text-slate-500 font-semibold leading-tight mt-0.5 max-w-[100px] truncate">
                    {step.sublabel}
                  </p>
                </div>
                <StatusIcon status={step.status} />
                {step.actionLabel && !isLocked && (
                  <button
                    onClick={() => step.actionTab && onSelectTab(step.actionTab)}
                    className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer w-full text-center bg-blue-700/20 hover:bg-blue-700/40 text-blue-400"
                  >
                    {step.actionLabel}
                  </button>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className="flex items-center pt-8 px-0.5 shrink-0">
                  <ChevronRight
                    size={12}
                    className={steps[idx + 1].status === "locked" ? "text-slate-805" : "text-slate-700"}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export { computePipelineSteps, computeReadinessScore };
