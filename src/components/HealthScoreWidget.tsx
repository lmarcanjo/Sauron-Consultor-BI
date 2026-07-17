/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HealthScoreWidget — Score de Saúde do Projeto em 4 Dimensões Consultivas
 *
 * Lê dados dos repositórios existentes sem modificá-los.
 * Focado em termos de negócio e consultoria estratégica (sem jargões técnicos).
 */

import React from "react";
import { Activity } from "lucide-react";
import { Enterprise } from "../core/persistence/EnterpriseRepository";
import { ActiveDataset, SpreadsheetFile } from "../types/dataSource";

export interface HealthDimension {
  id: string;
  label: string;
  score: number; // 0-100
  detail: string;
  color: "emerald" | "blue" | "amber" | "rose";
}

interface HealthScoreWidgetProps {
  enterprises: Enterprise[];
  activeDataset: ActiveDataset | null;
  activeFiles: SpreadsheetFile[];
  isMarketConfigured: boolean;
}

function computeHealthDimensions(
  enterprises: Enterprise[],
  activeDataset: ActiveDataset | null,
  activeFiles: SpreadsheetFile[],
  isMarketConfigured: boolean
): HealthDimension[] {
  // --- Dimensão 1: Dados do Cliente (Completude) ---
  let dataScore = 0;
  let dataDetail = "Aguardando importação dos dados";
  if (activeDataset && activeDataset.rowCount > 0) {
    const rows = activeDataset.rowCount;
    if (rows >= 500) { dataScore = 100; dataDetail = "Volume de dados excelente para análise"; }
    else if (rows >= 100) { dataScore = 75; dataDetail = "Base de dados adequada para reuniões"; }
    else if (rows >= 20) { dataScore = 50; dataDetail = "Dados mínimos carregados"; }
    else { dataScore = 25; dataDetail = "Poucos registros disponíveis"; }
  }

  // --- Dimensão 2: Configuração Financeira (Mapeamento) ---
  let mappingScore = 0;
  let mappingDetail = "Nenhum campo financeiro mapeado";
  if (activeDataset && activeDataset.columnProfiles) {
    const cols = activeDataset.columnProfiles.length;
    const expectedMinCols = 4; // Receita, Custo, Despesa, Mês
    if (cols >= expectedMinCols * 2) { mappingScore = 100; mappingDetail = "Estrutura financeira totalmente configurada"; }
    else if (cols >= expectedMinCols) { mappingScore = 70; mappingDetail = "Campos financeiros básicos configurados"; }
    else if (cols > 0) { mappingScore = 30; mappingDetail = "Mapeamento financeiro parcial"; }
  }

  // --- Dimensão 3: Profundidade da Análise (Riqueza) ---
  let richScore = 0;
  let richDetail = "Sem dados disponíveis";
  if (activeDataset && activeDataset.rowCount > 0) {
    const cols = activeDataset.columnCount || 0;
    if (cols >= 10) { richScore = 100; richDetail = "Alta riqueza de indicadores setoriais"; }
    else if (cols >= 6) { richScore = 70; richDetail = "Riqueza moderada de indicadores"; }
    else if (cols >= 3) { richScore = 40; richDetail = "Indicadores essenciais disponíveis"; }
    else if (cols > 0) { richScore = 20; richDetail = "Variabilidade analítica limitada"; }
  }

  // --- Dimensão 4: Ambiente Configurado (Configuração) ---
  let configScore = 0;
  let configDetail = "Ambiente de consultoria não iniciado";
  let configPoints = 0;
  const configMax = 4;
  if (enterprises.length > 0) configPoints++;
  if (enterprises.some(e => e.segment)) configPoints++;
  if (isMarketConfigured) configPoints++;
  if (activeDataset) configPoints++;
  configScore = Math.round((configPoints / configMax) * 100);
  configDetail = configPoints === 0
    ? "Ambiente de consultoria não iniciado"
    : configPoints === configMax
    ? "Ambiente pronto para atendimento"
    : `${configPoints} de ${configMax} etapas essenciais preparadas`;

  return [
    { id: "data", label: "Dados do Cliente", score: dataScore, detail: dataDetail, color: "blue" },
    { id: "mapping", label: "Informações financeiras", score: mappingScore, detail: mappingDetail, color: "emerald" },
    { id: "richness", label: "Profundidade da Análise", score: richScore, detail: richDetail, color: "blue" },
    { id: "config", label: "Ambiente Configurado", score: configScore, detail: configDetail, color: "amber" }
  ];
}

function computeOverallHealth(dimensions: HealthDimension[]): number {
  const weights = [0.35, 0.35, 0.15, 0.15];
  return Math.round(dimensions.reduce((acc, d, i) => acc + d.score * weights[i], 0));
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const barColor =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-amber-400" :
    score >= 40 ? "bg-orange-500" :
    "bg-rose-500";

  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${barColor} rounded-full transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function HealthRing({ score }: { score: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const strokeColor =
    score >= 85 ? "#10b981" :
    score >= 65 ? "#f59e0b" :
    score >= 40 ? "#3b82f6" :
    "#ef4444";

  const label =
    score >= 85 ? "Pronto para apresentação" :
    score >= 65 ? "Quase Pronto" :
    score >= 40 ? "Em Configuração" :
    "Setup Inicial";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={64} height={64} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x={32} y={28} textAnchor="middle" fontSize={14} fontWeight="900" fill={strokeColor} fontFamily="monospace">
          {score}
        </text>
        <text x={32} y={40} textAnchor="middle" fontSize={8} fontWeight="700" fill="#64748b" fontFamily="sans-serif">
          /100
        </text>
      </svg>
      <span className="text-[9px] font-black uppercase tracking-wider text-center" style={{ color: strokeColor }}>
        {label}
      </span>
    </div>
  );
}

export const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({
  enterprises,
  activeDataset,
  activeFiles,
  isMarketConfigured
}) => {
  const dimensions = computeHealthDimensions(enterprises, activeDataset, activeFiles, isMarketConfigured);
  const overall = computeOverallHealth(dimensions);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800">
            <Activity size={14} className="text-slate-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Status do Projeto
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              Indicador estratégico de maturidade operacional
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* Overall ring */}
        <div className="shrink-0">
          <HealthRing score={overall} />
        </div>

        {/* Dimensions */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {dimensions.map(dim => (
            <div key={dim.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-300">{dim.label}</span>
                <span className="text-[10px] font-black font-mono text-slate-400">{dim.score}%</span>
              </div>
              <ScoreBar score={dim.score} color={dim.color} />
              <p className="text-[9px] text-slate-650 font-semibold leading-tight">{dim.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { computeHealthDimensions, computeOverallHealth };
