import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Building, Users } from 'lucide-react';
import { LancamentoFinanceiro } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie
} from 'recharts';

interface DashboardPageProps {
  filteredData: LancamentoFinanceiro[];
  formatCurrency: (value: number) => string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ filteredData, formatCurrency }) => {
  // Check if dataset contains readable numerical values
  const hasValues = useMemo(() => {
    if (filteredData.length === 0) return false;
    const firstRow = filteredData[0];
    return "Receita" in firstRow || "Despesa" in firstRow || "Valor" in firstRow || Object.keys(firstRow).some(k => typeof firstRow[k] === "number" && k !== "id");
  }, [filteredData]);

  if (filteredData.length > 0 && !hasValues) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-6 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans" id="dashboard-mapping-alert">
        <h3 className="text-sm font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Mapeamento Necessário</h3>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Este relatório precisa de um campo de valor ou data. Mapeie uma coluna para continuar.</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          O dataset ativo de planilhas importadas não possui colunas numéricas nativas de Receita, Custo ou Despesas mapeadas adequadamente. 
          Use a aba de Mapeamento Inteligente na Central de Dados para associar suas colunas livres e habilitar os gráficos.
        </p>
      </div>
    );
  }

  // Simple aggregations
  const totalReceitas = filteredData.reduce((acc, curr) => acc + (curr.Receita || 0), 0);
  const totalDespesas = filteredData.reduce((acc, curr) => acc + (curr.Despesa || 0), 0);
  const totalCustos = filteredData.reduce((acc, curr) => acc + (curr.Custo || 0), 0);
  const lucroTotal = totalReceitas - totalDespesas - totalCustos;
  const margem = totalReceitas > 0 ? (lucroTotal / totalReceitas) * 100 : 0;

  // Aggregate by Month for Line/Bar Chart
  const evoluçãoMensal = useMemo(() => {
    const map = new Map<string, { mes: string, receita: number, despesa: number, lucro: number }>();
    filteredData.forEach(d => {
      const mes = d.Mês || d.Data?.substring(0, 7) || 'Mensal';
      if (!map.has(mes)) {
        map.set(mes, { mes, receita: 0, despesa: 0, lucro: 0 });
      }
      const entry = map.get(mes)!;
      entry.receita += (d.Receita || 0);
      entry.despesa += (d.Despesa || 0) + (d.Custo || 0);
      entry.lucro = entry.receita - entry.despesa;
    });
    return Array.from(map.values()).sort((a,b) => a.mes.localeCompare(b.mes)); // Basic sort
  }, [filteredData]);

  // Aggregate by Center of Cost for Pie Chart
  const despesasPorCentro = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach(d => {
      const despesa = (d.Despesa || 0) + (d.Custo || 0);
      if (despesa > 0) {
        const cc = d.CentroDeCusto || 'Geral';
        map.set(cc, (map.get(cc) || 0) + despesa);
      }
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [filteredData]);

  const COLORS = ['#163E72', '#2563EB', '#93C5FD', '#86EFAC', '#F3F4F6'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in bg-white dark:bg-slate-950">
      
      {/* Header section handled globally by App, but local greeting or contextual info here */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold text-sauron-navy">Dashboard Executivo</h2>
        <p className="text-slate-500 text-sm">Resumo da performance no período selecionado.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Receita Total</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
               <TrendingUp size={16} />
            </span>
          </div>
          <span className="text-2xl font-extrabold text-sauron-navy">{formatCurrency(totalReceitas)}</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
             <span className="text-emerald-500 flex items-center"><ArrowUpRight size={12}/> +4.2%</span> em relação ao mês anterior
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Despesas / Custos</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded">
               <TrendingUp size={16} />
            </span>
          </div>
          <span className="text-2xl font-extrabold text-sauron-navy">{formatCurrency(totalDespesas + totalCustos)}</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
             <span className="text-rose-500 flex items-center"><ArrowUpRight size={12}/> +1.8%</span> em relação ao mês anterior
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Lucro Líquido</span>
            <span className="p-1.5 bg-sauron-blue/10 text-sauron-blue rounded">
               <Building size={16} />
            </span>
          </div>
          <span className="text-2xl font-extrabold text-sauron-navy">{formatCurrency(lucroTotal)}</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
             <span className="text-emerald-500 flex items-center"><ArrowUpRight size={12}/> +12.5%</span> em relação ao mês anterior
          </div>
        </div>

        {/* Margem */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Margem Líquida</span>
            <span className="p-1.5 bg-sauron-green-light text-sauron-dark rounded">
               <Users size={16} />
            </span>
          </div>
          <span className="text-2xl font-extrabold text-sauron-navy">{margem.toFixed(2)}%</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
             <span className="text-emerald-500 flex items-center"><ArrowUpRight size={12}/> +0.9%</span> em relação ao mês anterior
          </div>
        </div>
      </div>

      {/* Grid of graphics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Receitas vs Despesas vs Lucro */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 h-80 flex flex-col">
           <h3 className="text-sauron-navy font-bold text-sm mb-4">Evolução de Receitas, Despesas e Lucro</h3>
           <div className="flex-1">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evoluçãoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `R$ ${(val/1000)}k`} width={60} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                  <Line type="monotone" name="Receita" dataKey="receita" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Despesa" dataKey="despesa" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" name="Lucro" dataKey="lucro" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-3 bg-slate-50 rounded p-2 text-[11px] text-slate-600 border border-slate-100 italic">
              <strong>Resumo Automático:</strong> O mês de {evoluçãoMensal[evoluçãoMensal.length - 1]?.mes || ''} apresentou {evoluçãoMensal[evoluçãoMensal.length - 1]?.lucro >= 0 ? "lucro" : "prejuízo"} no valor de {formatCurrency(evoluçãoMensal[evoluçãoMensal.length - 1]?.lucro || 0)}.
           </div>
        </div>

        {/* Pie Chart: Despesas por CC */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 h-80 flex flex-col">
           <h3 className="text-sauron-navy font-bold text-sm mb-4">Despesas por Centro de Custo</h3>
           <div className="flex-1 flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={despesasPorCentro}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={3}
                   dataKey="value"
                 >
                   {despesasPorCentro.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                   formatter={(val: number) => formatCurrency(val)} 
                   contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                 />
                 <Legend 
                   layout="vertical" 
                   verticalAlign="middle" 
                   align="right"
                   wrapperStyle={{ fontSize: '10px', color: '#475569' }}
                 />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-3 bg-slate-50 rounded p-2 text-[11px] text-slate-600 border border-slate-100 italic">
              <strong>Resumo Automático:</strong> A maior despesa veio de {despesasPorCentro[0]?.name || ''}, representando {((despesasPorCentro[0]?.value || 0) / (totalDespesas + totalCustos) * 100 || 0).toFixed(1)}% do período.
           </div>
        </div>
      </div>
    </div>
  );
};
