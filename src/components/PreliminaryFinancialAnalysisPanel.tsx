/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  Calendar,
  Building2,
  Activity,
  CheckCircle,
  HelpCircle,
  Database,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { PreliminaryFinancialAnalysisArtifact, PreliminaryFinancialGrouping, PreliminaryFinancialTemporalSeries } from "../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts";

interface PreliminaryFinancialAnalysisPanelProps {
  artifact: PreliminaryFinancialAnalysisArtifact;
  clientName?: string;
  engagementName?: string;
  onReviewInterpretations: () => void;
}

export const PreliminaryFinancialAnalysisPanel: React.FC<PreliminaryFinancialAnalysisPanelProps> = ({
  artifact,
  clientName = "Cliente",
  engagementName = "Engajamento",
  onReviewInterpretations
}) => {
  const [activeGroupTab, setActiveGroupTab] = useState<string>(
    artifact.groupings[0]?.dimensionCode || "SITUATION"
  );
  const [activeSeriesTab, setActiveSeriesTab] = useState<string>(
    artifact.temporalSeries[0]?.seriesCode || "EMISSION_MONTH"
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  const getMetric = (code: string) => {
    return artifact.metrics.find((m) => m.code === code);
  };

  const valTotal = getMetric("VALUE_TOTAL")?.value || 0;
  const paidTotal = getMetric("PAID_VALUE_TOTAL")?.value || 0;
  const balanceTotal = getMetric("BALANCE_TOTAL")?.value || 0;

  const currentGrouping = artifact.groupings.find(g => g.dimensionCode === activeGroupTab);
  const currentSeries = artifact.temporalSeries.find(s => s.seriesCode === activeSeriesTab);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 text-white font-sans" data-testid="preliminary-analysis-panel">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1.5 animate-pulse">
              <Activity size={12} /> ANÁLISE FINANCEIRA PRELIMINAR
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Versão {artifact.artifactVersion} · Geração: {new Date(artifact.generatedAt).toLocaleString("pt-BR")}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Resultado da Fonte: {artifact.sourceFileName}
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl font-medium">
            Métricas factuais e agrupamentos estruturados extraídos deterministicamente. Nenhuma regra de classificação oficial foi aplicada.
          </p>
        </div>

        <button
          type="button"
          onClick={onReviewInterpretations}
          className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start md:self-center"
          data-testid="btn-review-fields"
        >
          <HelpCircle size={15} />
          REVISAR ENTENDIMENTO DOS CAMPOS
        </button>
      </div>

      {/* METADATA SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Cliente", val: clientName, icon: Building2, color: "text-blue-400" },
          { label: "Engajamento", val: engagementName, icon: FolderOpen, color: "text-indigo-400" },
          { label: "Escopo", val: `${artifact.organizationalScope.scopeType} (${artifact.organizationalScope.targetId})`, icon: Layers, color: "text-purple-400" },
          { label: "ID do Artefato", val: artifact.artifactId, icon: Database, color: "text-teal-400" }
        ].map((item, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
            <item.icon size={20} className={`${item.color} mt-0.5 shrink-0`} />
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{item.label}</span>
              <strong className="block text-xs font-extrabold text-slate-100 truncate" title={item.val}>{item.val}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* VALUE METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-y border-slate-800/50 py-6">
        {[
          { label: "Valor Total", val: valTotal, color: "text-white", desc: "Soma da coluna Valor" },
          { label: "Valor Pago", val: paidTotal, color: "text-emerald-400", desc: "Soma da coluna Valor Pago" },
          { label: "Saldo Aberto", val: balanceTotal, color: "text-amber-400", desc: "Soma da coluna Saldo" }
        ].map((item, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{item.label}</span>
              <strong className={`block text-xl md:text-2xl font-black mt-1 ${item.color}`}>
                {formatCurrency(item.val)}
              </strong>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* ROW COUNT RECONCILIATION EQUATION */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers size={14} className="text-indigo-400" />
          Conciliação de Linhas da Fonte
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-center text-xs">
          {[
            { label: "Lidas Físicas", val: artifact.physicalRowCount, color: "bg-slate-900 border-slate-800" },
            { label: "Cabeçalhos", val: artifact.headerRowCount, color: "bg-slate-900 border-slate-800 text-slate-400" },
            { label: "Data Rows", val: artifact.dataRowCount, color: "bg-slate-900 border-slate-800 text-indigo-400" },
            { label: "Válidas", val: artifact.validRowCount, color: "bg-emerald-950/20 border-emerald-900/40 text-emerald-400" },
            { label: "Parciais", val: artifact.partiallyValidRowCount, color: "bg-amber-950/20 border-amber-900/40 text-amber-400" },
            { label: "Excluídas", val: artifact.excludedRowCount, color: "bg-rose-950/20 border-rose-900/40 text-rose-400" },
            { label: "Vazias", val: artifact.emptyRowCount, color: "bg-slate-900 border-slate-800 text-slate-400" }
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${item.color} flex flex-col justify-center`}>
              <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">{item.label}</span>
              <strong className="block text-sm font-black mt-1">{item.val}</strong>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Equação: Lidas Físicas ({artifact.physicalRowCount}) = Cabeçalho ({artifact.headerRowCount}) + Data Rows ({artifact.dataRowCount}) + Vazias ({artifact.emptyRowCount}).
          <br />
          Data Rows ({artifact.dataRowCount}) = Válidas ({artifact.validRowCount}) + Parciais ({artifact.partiallyValidRowCount}) + Excluídas ({artifact.excludedRowCount}).
        </p>
      </div>

      {/* DIMENSIONAL GROUPINGS & TEMPORAL SERIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GROUPINGS */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers size={14} className="text-indigo-400" />
              Agrupamentos Dimensionais
            </h3>
            <select
              value={activeGroupTab}
              onChange={(e) => setActiveGroupTab(e.target.value)}
              className="text-xs p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
            >
              {artifact.groupings.map((g) => (
                <option key={g.dimensionCode} value={g.dimensionCode}>
                  {g.dimensionLabel}
                </option>
              ))}
            </select>
          </div>

          {currentGrouping && (
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black tracking-wider">
                <span>Categoria ({currentGrouping.sourcePhysicalName})</span>
                <span>Registros / Valor Total / Saldo</span>
              </div>
              
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1.5">
                {currentGrouping.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-extrabold text-slate-100 truncate block" title={item.displayName}>
                        {item.displayName}
                      </span>
                      {item.limitations.includes("GROUPING_TRUNCATED") && (
                        <span className="text-[9px] text-amber-400 font-bold block mt-0.5">AGRUPAMENTO TRUNCADO</span>
                      )}
                    </div>
                    
                    <div className="text-right shrink-0 font-mono text-[10px] space-y-0.5">
                      <span className="text-slate-400 font-bold block">{item.recordCount} registros</span>
                      <strong className="text-slate-200 block">{formatCurrency(item.valueTotal)}</strong>
                      <span className="text-amber-400 block">{formatCurrency(item.balanceTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {currentGrouping.truncated && (
                <p className="text-[10px] text-amber-500 font-medium">
                  Nota: Exibindo top {currentGrouping.includedGroupCount} de {currentGrouping.totalGroupCount} grupos reais para manter a legibilidade do relatório.
                </p>
              )}
            </div>
          )}
        </div>

        {/* TEMPORAL SERIES */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-400" />
              Séries Temporais
            </h3>
            <select
              value={activeSeriesTab}
              onChange={(e) => setActiveSeriesTab(e.target.value)}
              className="text-xs p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
            >
              {artifact.temporalSeries.map((s) => (
                <option key={s.seriesCode} value={s.seriesCode}>
                  {s.seriesLabel}
                </option>
              ))}
            </select>
          </div>

          {currentSeries && (
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black tracking-wider">
                <span>Período ({currentSeries.sourcePhysicalName})</span>
                <span>Registros / Somas Financeiras</span>
              </div>
              
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1.5">
                {currentSeries.items.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">Nenhum período de data parseado na coluna.</p>
                )}
                {currentSeries.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-extrabold text-slate-100 shrink-0">
                      {item.periodKey}
                    </span>
                    
                    <div className="text-right font-mono text-[10px] space-y-0.5">
                      <span className="text-slate-400 font-bold block">{item.recordCount} registros</span>
                      <strong className="text-slate-250 block">Valor: {formatCurrency(item.valueTotal)}</strong>
                      <span className="text-emerald-400 block">Pago: {formatCurrency(item.paidValueTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIELD USAGES & QUALITY FINDINGS / LIMITATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FIELDS MAP */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileSpreadsheet size={14} className="text-indigo-400" />
            Mapeamento dos Campos Físicos
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {artifact.physicalFields.map((field) => (
              <div key={field.physicalColumnIndex} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <strong className="block text-slate-100 font-mono">
                    {field.displayName}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                    Índice Físico: {field.physicalColumnIndex}
                  </span>
                  {field.limitationCode === "EMPTY_PHYSICAL_HEADER" && (
                    <span className="text-[9px] text-amber-500 font-bold block mt-0.5">CABEÇALHO VAZIO NA PLANILHA</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    field.usageStatus === "USED"
                      ? "bg-indigo-950 text-indigo-400 border border-indigo-900"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}>
                    {field.usageStatus}
                  </span>
                  {field.semanticRole && (
                    <span className="block font-mono text-[9px] text-slate-400 mt-1 uppercase font-bold">
                      Função: {field.semanticRole}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUALITY FINDINGS & LIMITATIONS */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AlertTriangle size={14} className="text-indigo-400" />
            Limitações & Achados de Qualidade
          </h3>
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {artifact.limitations.map((limit, idx) => (
              <div key={idx} className="p-3 bg-amber-950/10 border border-amber-900/40 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={12} /> {limit.code} · {limit.severity}
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{limit.message}</p>
              </div>
            ))}

            {artifact.qualityFindings.slice(0, 10).map((finding) => (
              <div key={finding.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 block">
                  {finding.code} · {finding.severity}
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{finding.message}</p>
                {finding.physicalRowIndex && (
                  <span className="text-[9px] text-slate-500 font-bold block">
                    Linha: {finding.physicalRowIndex} | Coluna: {finding.physicalColumnName || "desconhecida"}
                  </span>
                )}
              </div>
            ))}

            {artifact.limitations.length === 0 && artifact.qualityFindings.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle size={24} className="text-emerald-500" />
                Nenhum problema de qualidade ou limitação identificado na fonte.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER INFO */}
      <div className="text-[9px] font-mono text-slate-500 border-t border-slate-800 pt-4 flex flex-wrap justify-between gap-2">
        <span>Policy ID: {artifact.policyId} (v{artifact.policyVersion})</span>
        <span>Fingerprint: {artifact.fingerprint}</span>
        <span>Policy Fingerprint: {artifact.policyFingerprint}</span>
      </div>
    </div>
  );
};
