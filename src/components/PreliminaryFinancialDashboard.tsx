/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity, DollarSign, CreditCard, Wallet, FileSpreadsheet,
  Layers, Calendar, Building2, AlertTriangle, CheckCircle, Info,
  Database, Shield, ChevronDown, BarChart3, Users, Tag
} from 'lucide-react';
import type {
  PreliminaryFinancialAnalysisArtifact,
  PreliminaryFinancialGrouping,
  PreliminaryFinancialGroupingItem,
  PreliminaryFinancialTemporalSeries,
  PreliminaryFinancialTemporalSeriesItem,
} from '../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts';

interface PreliminaryFinancialDashboardProps {
  artifact: PreliminaryFinancialAnalysisArtifact;
  onReviewFields?: () => void;
  onNavigateToAnalysis?: () => void;
}

const formatCurrency = (val: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatNumber = (val: number): string =>
  new Intl.NumberFormat('pt-BR').format(val);

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  SITUATION: <Tag size={13} />,
  ACCOUNT: <Layers size={13} />,
  RESULT_CENTER: <Building2 size={13} />,
  PERSON: <Users size={13} />,
  PAYMENT_METHOD: <CreditCard size={13} />,
  BUSINESS_UNIT: <Building2 size={13} />,
};

const DIMENSION_LABELS: Record<string, string> = {
  SITUATION: 'Situação',
  ACCOUNT: 'Conta Contábil',
  RESULT_CENTER: 'Centro de Resultado',
  PERSON: 'Pessoa',
  PAYMENT_METHOD: 'Forma de Pagamento',
  BUSINESS_UNIT: 'Unidade de Negócio',
};

const SERIES_LABELS: Record<string, string> = {
  EMISSION_MONTH: 'Evolução por Emissão',
  DUE_MONTH: 'Evolução por Vencimento',
  PAYMENT_MONTH: 'Evolução por Pagamento',
};

export const PreliminaryFinancialDashboard: React.FC<PreliminaryFinancialDashboardProps> = ({
  artifact,
  onReviewFields,
  onNavigateToAnalysis,
}) => {
  const [activeDimension, setActiveDimension] = useState<string>(
    artifact.groupings[0]?.dimensionCode || ''
  );
  const [activeSeries, setActiveSeries] = useState<string>(
    artifact.temporalSeries[0]?.seriesCode || ''
  );

  const getMetric = (code: string) => artifact.metrics.find(m => m.code === code);
  const valTotal = getMetric('VALUE_TOTAL')?.value || 0;
  const paidTotal = getMetric('PAID_VALUE_TOTAL')?.value || 0;
  const balanceTotal = getMetric('BALANCE_TOTAL')?.value || 0;

  const currentGrouping = artifact.groupings.find(g => g.dimensionCode === activeDimension);
  const currentSeries = artifact.temporalSeries.find(s => s.seriesCode === activeSeries);

  const usedFields = artifact.physicalFields.filter(f => f.usageStatus === 'USED');
  const warningFindings = artifact.qualityFindings.filter(f => f.severity === 'WARNING' || f.severity === 'CRITICAL');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 text-white font-sans" data-testid="preliminary-financial-dashboard">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1.5">
              <Activity size={12} /> Análise Preliminar
            </span>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Database size={11} /> {artifact.sourceFileName}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <DollarSign size={22} className="text-emerald-400" />
            Dashboard Financeiro
          </h2>
          <p className="text-[11px] text-slate-500 max-w-2xl">
            Visualização descritiva baseada nos campos físicos observados. Alguns campos podem ainda não ter sido confirmados pelo consultor.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          {onReviewFields && (
            <button type="button" onClick={onReviewFields} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all" data-testid="review-fields-btn">
              Revisar Campos
            </button>
          )}
          {onNavigateToAnalysis && (
            <button type="button" onClick={onNavigateToAnalysis} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all">
              Voltar à Análise
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="financial-kpi-cards">
        <KPICard icon={<DollarSign size={18} />} label="Valor Total" value={formatCurrency(valTotal)} color="emerald" testId="kpi-valor-total" />
        <KPICard icon={<CreditCard size={18} />} label="Valor Pago" value={formatCurrency(paidTotal)} color="blue" testId="kpi-valor-pago" />
        <KPICard icon={<Wallet size={18} />} label="Saldo" value={formatCurrency(balanceTotal)} color="amber" testId="kpi-saldo" />
        <KPICard icon={<FileSpreadsheet size={18} />} label="Registros" value={formatNumber(artifact.validRowCount)} color="slate" subtitle={`${artifact.columnCount} campos · ${usedFields.length} utilizados`} testId="kpi-registros" />
      </div>

      {/* QUALITY / LIMITATIONS SUMMARY */}
      {(warningFindings.length > 0 || artifact.limitations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {artifact.limitations.length > 0 && (
            <div className="rounded-xl bg-amber-950/20 border border-amber-500/15 p-4 space-y-1.5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Shield size={12} /> Limitações ({artifact.limitations.length})
              </h4>
              <ul className="text-[11px] text-amber-200/70 space-y-0.5">
                {artifact.limitations.slice(0, 5).map((lim, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertTriangle size={10} className="text-amber-500 mt-0.5 shrink-0" /> {lim.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {warningFindings.length > 0 && (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-1.5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info size={12} /> Qualidade ({warningFindings.length} alertas)
              </h4>
              <ul className="text-[11px] text-slate-400 space-y-0.5">
                {warningFindings.slice(0, 5).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertTriangle size={10} className="text-slate-500 mt-0.5 shrink-0" /> {f.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TEMPORAL SERIES */}
      {artifact.temporalSeries.length > 0 && (
        <div className="space-y-3" data-testid="temporal-series-section">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={14} className="text-blue-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Evolução Temporal</h3>
            <div className="flex gap-1 ml-auto">
              {artifact.temporalSeries.map(s => (
                <button
                  key={s.seriesCode}
                  type="button"
                  onClick={() => setActiveSeries(s.seriesCode)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    activeSeries === s.seriesCode
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {SERIES_LABELS[s.seriesCode] || s.seriesLabel}
                </button>
              ))}
            </div>
          </div>
          {currentSeries && <TemporalSeriesChart series={currentSeries} />}
        </div>
      )}

      {/* GROUPING DIMENSIONS */}
      {artifact.groupings.length > 0 && (
        <div className="space-y-3" data-testid="grouping-section">
          <div className="flex items-center gap-2 flex-wrap">
            <BarChart3 size={14} className="text-indigo-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Agrupamentos</h3>
            <div className="flex gap-1 ml-auto flex-wrap">
              {artifact.groupings.map(g => (
                <button
                  key={g.dimensionCode}
                  type="button"
                  onClick={() => setActiveDimension(g.dimensionCode)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    activeDimension === g.dimensionCode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {DIMENSION_ICONS[g.dimensionCode]} {DIMENSION_LABELS[g.dimensionCode] || g.dimensionLabel}
                </button>
              ))}
            </div>
          </div>
          {currentGrouping && <GroupingTable grouping={currentGrouping} />}
        </div>
      )}

      {/* FIELDS USED */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <CheckCircle size={12} className="text-emerald-500" /> Campos Utilizados ({usedFields.length} de {artifact.columnCount})
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {usedFields.map(f => (
            <span key={f.physicalColumnIndex} className="px-2 py-0.5 rounded-md bg-emerald-950/30 border border-emerald-500/15 text-[10px] font-bold text-emerald-300">
              {f.displayName || f.physicalName}
              {f.semanticRole && <span className="text-emerald-500/50 ml-1">({f.semanticRole})</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
  testId?: string;
}

const KPICard: React.FC<KPICardProps> = ({ icon, label, value, color, subtitle, testId }) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    slate: 'text-slate-300 bg-slate-800 border-slate-700',
  };
  const classes = colorMap[color] || colorMap.slate;

  return (
    <div className={`rounded-xl border p-4 space-y-1.5 ${classes}`} data-testid={testId}>
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider opacity-70">
        {icon} {label}
      </div>
      <p className="text-lg md:text-xl font-black">{value}</p>
      {subtitle && <p className="text-[10px] opacity-50">{subtitle}</p>}
    </div>
  );
};

const TemporalSeriesChart: React.FC<{ series: PreliminaryFinancialTemporalSeries }> = ({ series }) => {
  const items = series.items;
  if (items.length === 0) return null;

  const maxValue = Math.max(...items.map(i => i.valueTotal), 1);

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 overflow-x-auto">
      <div className="flex items-end gap-1 min-w-[400px]" style={{ height: 160 }}>
        {items.map((item, idx) => {
          const heightPercent = Math.max((item.valueTotal / maxValue) * 100, 2);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group" title={`${item.periodKey}: ${formatCurrency(item.valueTotal)}`}>
              <div className="w-full flex flex-col items-center justify-end" style={{ height: 140 }}>
                <div
                  className="w-full max-w-[32px] rounded-t-md bg-blue-500/70 group-hover:bg-blue-400 transition-all relative"
                  style={{ height: `${heightPercent}%` }}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-blue-300 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                    {formatCurrency(item.valueTotal)}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">{item.periodKey}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
        <span>Períodos: {items.length}</span>
        <span>Os totais exibidos acima vêm do artefato preliminar.</span>
      </div>
    </div>
  );
};

const GroupingTable: React.FC<{ grouping: PreliminaryFinancialGrouping }> = ({ grouping }) => {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? grouping.items : grouping.items.slice(0, 10);

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left px-4 py-2.5 font-black text-slate-400 uppercase tracking-wider text-[10px]">
              {DIMENSION_LABELS[grouping.dimensionCode] || grouping.dimensionLabel}
            </th>
            <th className="text-right px-4 py-2.5 font-black text-slate-400 uppercase tracking-wider text-[10px]">Registros</th>
            <th className="text-right px-4 py-2.5 font-black text-slate-400 uppercase tracking-wider text-[10px]">Valor</th>
            <th className="text-right px-4 py-2.5 font-black text-slate-400 uppercase tracking-wider text-[10px]">Pago</th>
            <th className="text-right px-4 py-2.5 font-black text-slate-400 uppercase tracking-wider text-[10px]">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-2 font-bold text-white truncate max-w-[200px]" title={item.displayName || item.physicalValue}>
                {item.displayName || item.physicalValue || '(vazio)'}
              </td>
              <td className="px-4 py-2 text-right text-slate-300">{formatNumber(item.recordCount)}</td>
              <td className="px-4 py-2 text-right font-semibold text-emerald-300">{formatCurrency(item.valueTotal)}</td>
              <td className="px-4 py-2 text-right text-blue-300">{formatCurrency(item.paidValueTotal)}</td>
              <td className="px-4 py-2 text-right text-amber-300">{formatCurrency(item.balanceTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {grouping.items.length > 10 && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="w-full py-2 text-center text-[11px] font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          <ChevronDown size={12} className={expanded ? 'rotate-180' : ''} />
          {expanded ? 'Mostrar menos' : `Mostrar todos (${grouping.items.length})`}
        </button>
      )}
    </div>
  );
};
