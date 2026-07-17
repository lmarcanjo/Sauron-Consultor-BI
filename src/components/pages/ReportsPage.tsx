import React, { useState, useMemo } from 'react';
import { FileText, ArrowRight, Sparkles, Table, BarChart3, HelpCircle, ToggleLeft, ArrowDownAz, RefreshCw, Layers } from 'lucide-react';
import { LancamentoFinanceiro } from '../../types';

interface ReportsPageProps {
  setActivePage?: (id: string) => void;
  dataOrigem?: LancamentoFinanceiro[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ setActivePage, dataOrigem = [] }) => {
  const reports = [
    { id: 'dre_inteligente', title: 'DRE Gerencial Completo', category: 'Financeiro', desc: 'Visão detalhada de Receitas, Custos e Despesas com drill down contábil.' },
    { id: 'comercial', title: 'Resultado Comercial', category: 'Comercial', desc: 'Vendas, Despesas e Margem comparativa por unidade e marca.' },
    { id: 'vendedores', title: 'Ranking de Vendedores', category: 'Comercial', desc: 'Desempenho analítico por vendedor e ticket médio.' },
    { id: 'comissoes', title: 'Relatório de Comissões', category: 'Controladoria', desc: 'Cálculos de comissionamento da equipe e projeções.' },
    { id: 'posvendas', title: 'Análise de Pós-Vendas', category: 'Oficina / Serviços', desc: 'Performance de mecânica, passagens e lucratividade.' },
    { id: 'itens', title: 'Itens & Categorias', category: 'Estoque / Vendas', desc: 'Margem e giro de inventário por item e canal.' },
  ];

  // 1. Detect all column categories & numbers from the uploaded dataset
  const columnsInfo = useMemo(() => {
    if (dataOrigem.length === 0) return { categorical: [] as string[], numeric: [] as string[] };
    const categorical = new Set<string>();
    const numeric = new Set<string>();

    dataOrigem.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k === 'id') return;
        const v = row[k];
        if (typeof v === 'number') {
          numeric.add(k);
        } else if (v !== '' && v !== null && v !== undefined && isNaN(Number(v))) {
          categorical.add(k);
        }
      });
    });

    return {
      categorical: Array.from(categorical).sort(),
      numeric: Array.from(numeric).sort(),
    };
  }, [dataOrigem]);

  // Set default dimensions and metrics based on what was found
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedOperation, setSelectedOperation] = useState<'SUM' | 'AVG' | 'COUNT'>('SUM');

  // Trigger dynamic defaults if custom dataset loaded
  React.useEffect(() => {
    if (columnsInfo.categorical.length > 0 && !selectedDimension) {
      // Prefer standard names first, fallback to first category
      const preferred = ['Empresa', 'Vendedor', 'Marca', 'Grupo', 'Categoria', 'Razão', 'Mês'];
      const match = preferred.find((p) => columnsInfo.categorical.includes(p));
      setSelectedDimension(match || columnsInfo.categorical[0]);
    }
    if (columnsInfo.numeric.length > 0 && !selectedMetric) {
      const preferredNum = ['Receita', 'Lucro', 'Despesa', 'Valor'];
      const matchNum = preferredNum.find((p) => columnsInfo.numeric.includes(p));
      setSelectedMetric(matchNum || columnsInfo.numeric[0]);
    }
  }, [columnsInfo]);

  // Generate recommendations based on column analysis
  const suggestedAnalyses = useMemo(() => {
    const list: Array<{ dim: string; met: string; op: 'SUM' | 'AVG'; title: string }> = [];
    if (columnsInfo.categorical.includes('Vendedor') && columnsInfo.numeric.includes('Receita')) {
      list.push({ dim: 'Vendedor', met: 'Receita', op: 'SUM', title: 'Ranking de Vendas por Vendedor' });
    }
    if (columnsInfo.categorical.includes('Empresa') && columnsInfo.numeric.includes('Lucro')) {
      list.push({ dim: 'Empresa', met: 'Lucro', op: 'SUM', title: 'Resultado Operacional por Empresa' });
    }
    if (columnsInfo.categorical.includes('Marca') && columnsInfo.numeric.includes('Receita')) {
      list.push({ dim: 'Marca', met: 'Receita', op: 'SUM', title: 'Distribuição de Receita por Marca' });
    }
    if (columnsInfo.categorical.includes('Categoria') && columnsInfo.numeric.includes('Despesa')) {
      list.push({ dim: 'Categoria', met: 'Despesa', op: 'SUM', title: 'Despesas Analíticas por Categoria' });
    }
    // General fallback suggestions if nothing specific matched
    if (list.length < 3 && columnsInfo.categorical.length > 0 && columnsInfo.numeric.length > 0) {
      const dim = columnsInfo.categorical[0];
      const met = columnsInfo.numeric[0];
      list.push({
        dim,
        met,
        op: 'SUM',
        title: `Evolução e Soma de ${met} por ${dim}`,
      });
    }
    return list;
  }, [columnsInfo]);

  // Compute aggregated dynamic report data
  const dynamicReportData = useMemo(() => {
    if (dataOrigem.length === 0 || !selectedDimension || !selectedMetric) return [];

    const groupedMap: Record<string, { key: string; values: number[]; labels: string[] }> = {};

    dataOrigem.forEach((item) => {
      const dimValue = String(item[selectedDimension] || 'N/D').trim();
      const numValue = Number(item[selectedMetric] || 0);

      if (!groupedMap[dimValue]) {
        groupedMap[dimValue] = { key: dimValue, values: [], labels: [] };
      }
      groupedMap[dimValue].values.push(numValue);
    });

    const result = Object.values(groupedMap).map((g) => {
      let finalVal = 0;
      if (selectedOperation === 'SUM') {
        finalVal = g.values.reduce((a, b) => a + b, 0);
      } else if (selectedOperation === 'AVG') {
        finalVal = g.values.reduce((a, b) => a + b, 0) / (g.values.length || 1);
      } else {
        finalVal = g.values.length;
      }
      return {
        dimension: g.key,
        value: finalVal,
      };
    });

    // Sort descending by value of metrics
    return result.sort((a, b) => b.value - a.value);
  }, [dataOrigem, selectedDimension, selectedMetric, selectedOperation]);

  const totalMetricSum = useMemo(() => {
    return dynamicReportData.reduce((acc, curr) => acc + curr.value, 0);
  }, [dynamicReportData]);

  const formatValue = (val: number) => {
    if (selectedOperation === 'COUNT') return val.toLocaleString('pt-BR') + ' registros';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in bg-white dark:bg-slate-950 font-sans">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-150 dark:border-slate-850 pb-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <FileText size={20} className="text-blue-600" /> Biblioteca de Relatórios & Business Intelligence
          </h2>
          <p className="text-slate-500 text-xs font-semibold">Consulte visões corporativas consolidadas ou construa relatórios dinâmicos ad-hoc da sua própria planilha.</p>
        </div>
      </div>

      {/* Dynamic Ad-hoc Spreadsheet Analyser Module */}
      {dataOrigem.length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-500 animate-pulse shrink-0" size={16} />
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Gerador de Relatórios Dinâmicos Ad-Hoc</h3>
                <p className="text-[10px] text-slate-450 font-semibold">Construa agregações por qualquer dimensão identificada nos dados.</p>
              </div>
            </div>

            {/* Quick Suggested Buttons */}
            {suggestedAnalyses.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-0.5">🚀 Sugestões:</span>
                {suggestedAnalyses.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDimension(s.dim);
                      setSelectedMetric(s.met);
                      setSelectedOperation(s.op);
                    }}
                    className="text-[9px] font-black bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 border border-blue-250 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded transition-colors cursor-pointer capitalize"
                  >
                    {s.dim} x {s.met}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Aggregator Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Agrupador (Dimensão Categórica)</label>
              <select
                value={selectedDimension}
                onChange={(e) => setSelectedDimension(e.target.value)}
                className="w-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded p-2 focus:ring-1 focus:ring-blue-500 uppercase tracking-wide cursor-pointer h-9 text-slate-700 dark:text-slate-300"
              >
                {columnsInfo.categorical.map((c) => (
                  <option key={c} value={c}>
                    {c} (Coluna Texto)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Métrica (Campo Monetário/Valor)</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded p-2 focus:ring-1 focus:ring-blue-500 uppercase tracking-wide cursor-pointer h-9 text-slate-700 dark:text-slate-300"
              >
                {columnsInfo.numeric.map((n) => (
                  <option key={n} value={n}>
                    {n} (Coluna Numérica)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Operação Matemática</label>
              <div className="grid grid-cols-3 gap-1 h-9">
                {(['SUM', 'AVG', 'COUNT'] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => setSelectedOperation(op)}
                    className={`text-[10px] font-extrabold uppercase rounded border transition-all cursor-pointer ${
                      selectedOperation === op
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-black'
                        : 'border-slate-200 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {op === 'SUM' ? 'Soma (Σ)' : op === 'AVG' ? 'Média (μ)' : 'Contagem (#)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Ranking Table and Visual Bar Progress */}
          {dynamicReportData.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
              <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold font-mono">
                <span className="text-slate-650 dark:text-slate-350">
                  RANKING DE RESULTADOS CONSOLIDADOS POR {selectedDimension.toUpperCase()} ({dynamicReportData.length} ITENS)
                </span>
                <span className="text-blue-600 dark:text-blue-400 select-none">
                  Total Acumulado: {formatValue(totalMetricSum)}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-80 overflow-y-auto">
                {dynamicReportData.slice(0, 15).map((row, index) => {
                  const pct = totalMetricSum > 0 ? (row.value / totalMetricSum) * 100 : 0;
                  return (
                    <div key={index} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors flex items-center gap-4 text-xs font-mono relative">
                      {/* background meter visual effect */}
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-500/5 dark:bg-blue-400/5 transition-all pointer-events-none"
                        style={{ width: `${pct}%` }}
                      />

                      <div className="w-6 text-center text-slate-400 font-extrabold z-10">#{index + 1}</div>
                      
                      <div className="flex-1 font-bold text-slate-800 dark:text-slate-200 z-10 truncate capitalize">
                        {row.dimension || 'N/A'}
                      </div>

                      {/* Spark / bar visual */}
                      <div className="hidden sm:block w-32 bg-slate-100 dark:bg-slate-800 h-2 rounded overflow-hidden shrink-0 z-10">
                        <div className="bg-blue-600 dark:bg-blue-500 h-full rounded" style={{ width: `${pct}%` }} />
                      </div>

                      <div className="w-16 font-extrabold text-right text-slate-500 dark:text-slate-450 shrink-0 z-10">
                        {pct.toFixed(1)}%
                      </div>

                      <div className="w-40 font-black text-right text-slate-800 dark:text-slate-100 font-mono shrink-0 z-10">
                        {formatValue(row.value)}
                      </div>
                    </div>
                  );
                })}
                {dynamicReportData.length > 15 && (
                  <div className="p-3 text-center text-[10px] text-slate-500 italic bg-slate-50/50 dark:bg-slate-950">
                    Exibindo as 15 primeiras linhas de destaque. Total de {dynamicReportData.length} registros agregados de forma única.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-450 text-xs italic font-semibold">
              Preencha uma dimensão e métrica válidas para carregar o ranking de visualização consolidada.
            </div>
          )}
        </section>
      )}

      {/* Predefined Standard Consulting Reports */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Mapeamento de Relatórios Executivos Integrados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <div 
              key={r.id} 
              onClick={() => setActivePage && setActivePage(r.id)} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer rounded-xl p-5 shadow-sm transition-all group hover:shadow-md flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">{r.category}</span>
                <FileText size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-1">{r.title}</h3>
              <p className="text-xs text-slate-500 font-medium flex-1 leading-relaxed">{r.desc}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end text-blue-500 font-bold text-[10px] items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                EXIBIR PAINEL CORPORATIVO <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
