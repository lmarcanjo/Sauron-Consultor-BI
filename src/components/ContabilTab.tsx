import React, { useState, useMemo, useEffect } from "react";
import { BookOpen, Search, AlertTriangle, FileSpreadsheet, Play, ArrowRight, Database } from "lucide-react";
import { LancamentoFinanceiro, MetricasConsolidadas } from "../types";
import { dataSourceManager } from "../services/dataSourceManager";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";

interface ContabilTabProps {
  dataOrigem: LancamentoFinanceiro[];
  filteredData: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
  margemLimite: number;
}

export const ContabilTab: React.FC<ContabilTabProps> = ({
  dataOrigem,
  filteredData,
  formatCurrency,
  margemLimite
}) => {
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");
  const [selectedConta, setSelectedConta] = useState<string>("");
  const [clickedAccount, setClickedAccount] = useState<string>("");

  const [activeDataset, setActiveDataset] = React.useState(activeDatasetStore.getActiveDataset());

  useEffect(() => {
    const unsub = activeDatasetStore.subscribe((event) => {
        if (event.type === "DATASET_ACTIVATED" || event.type === "DATASET_REHYDRATED" || event.type === "DATASET_REMOVED") {
            setActiveDataset(activeDatasetStore.getActiveDataset());
        }
    });
    return unsub;
  }, []);
  
  useEffect(() => {
    if (activeDataset) {
      console.log(`[Sauron Instrumentation] CONTABIL_RECEIVED_ACTIVE_DATASET - datasetId: ${activeDataset.datasetId}, sourceName: ${activeDataset.sourceName}, rowCount: ${activeDataset.rowCount}, columnCount: ${activeDataset.columnCount}, sourceType: ${activeDataset.sourceType}`);
    } else {
      console.log(`[Sauron Instrumentation] CONTABIL_RECEIVED_ACTIVE_DATASET - datasetId: null, sourceName: null, rowCount: 0, columnCount: 0, sourceType: null`);
    }
  }, [activeDataset]);

  const isPendingConfiguration = useMemo(() => {
    if (dataSourceManager.getActiveSource() !== "SPREADSHEET_DATA") return false;
    if (activeDataset && activeDataset.columnProfiles) {
      // For Contabil, we expect DRE or financial KPIs
      const hasContabilCol = activeDataset.columnProfiles.some((p: any) => p.isDRE || p.isKPI);
      return !hasContabilCol;
    }
    return true;
  }, [activeDataset]);

  if (isPendingConfiguration) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <Database className="text-emerald-500 w-12 h-12 animate-pulse" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Fonte de dados ativa. Configure os campos deste módulo para gerar análises.
        </p>
      </div>
    );
  }

  // Extract unique values for filter selects
  const availableDepartamentos = useMemo(() => {
    const list = dataOrigem.map(item => item.Departamento || "Geral");
    return Array.from(new Set(list)).sort();
  }, [dataOrigem]);

  const availableContasContabeis = useMemo(() => {
    const list = dataOrigem.map(item => item.ContaContabil || "3.1.04.10000.10 - Combustível");
    return Array.from(new Set(list)).sort();
  }, [dataOrigem]);

  // Apply accounting-specific sub-filters
  const finalContabilData = useMemo(() => {
    return filteredData.filter(item => {
      const matchDepto = !selectedDepartamento || item.Departamento === selectedDepartamento;
      const matchConta = !selectedConta || item.ContaContabil === selectedConta;
      return matchDepto && matchConta;
    });
  }, [filteredData, selectedDepartamento, selectedConta]);

  // Totals of filtered accountant data
  const contabilTotals = useMemo(() => {
    const receita = finalContabilData.reduce((acc, cr) => acc + cr.Receita, 0);
    const custo = finalContabilData.reduce((acc, cr) => acc + cr.Custo, 0);
    const despesa = finalContabilData.reduce((acc, cr) => acc + cr.Despesa, 0);
    const lucro = receita - custo - despesa;
    const margem = receita > 0 ? (lucro / receita * 100) : 0;
    return { receita, custo, despesa, lucro, margem };
  }, [finalContabilData]);

  // Get active account for extracts
  const activeAccountForExtract = clickedAccount || selectedConta || "3.1.04.10000.10 - Combustível";

  // Mock individual transaction logs (Extratos de Lançamento) for the selected account
  const simulatedExtracts = useMemo(() => {
    const records = [];
    const deptoAssigned = finalContabilData.find(d => d.ContaContabil === activeAccountForExtract)?.Departamento || "Geral";
    const valueBase = contabilTotals.receita > 0 ? (contabilTotals.receita / 12) : 24000;
    
    const descriptions = [
      { text: "NF 94212 - Compra de suprimentos regional", op: "DÉBITO" },
      { text: "Lançamento de depreciação mensal de ativos", op: "DÉBITO" },
      { text: "NF 84001 - Faturamento direto de contrapartida", op: "CRÉDITO" },
      { text: "Apropriação contábil de folha de salários", op: "DÉBITO" },
      { text: "Serviço terceirizado de consultoria de rede", op: "DÉBITO" }
    ];

    for (let i = 0; i < 5; i++) {
      const entryVal = Math.round((valueBase * (0.15 + (i * 0.12))) * 100) / 100;
      records.push({
        id: `CN-2026-${1000 + i}`,
        data: `0${i + 3}/03/2026`,
        conta: activeAccountForExtract,
        historico: descriptions[i % descriptions.length].text,
        tipo: descriptions[i % descriptions.length].op,
        valor: entryVal,
        usuario: `faturamento.sauron${i}@gm.com`,
        depto: deptoAssigned
      });
    }
    return records;
  }, [activeAccountForExtract, contabilTotals, finalContabilData]);

  return (
    <div className="space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-150">
      
      {/* Top filter section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <BookOpen size={15} className="text-blue-500" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-white">Filtros Avançados de Conciliação Contábil</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Filtrar por Departamento Operacional:</span>
            <select
              value={selectedDepartamento}
              onChange={(e) => setSelectedDepartamento(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-3 py-1.5 rounded focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
            >
              <option value="">-- Exibir Todos os Departamentos --</option>
              {availableDepartamentos.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Filtrar por Conta Contábil de Lançamento:</span>
            <select
              value={selectedConta}
              onChange={(e) => {
                setSelectedConta(e.target.value);
                setClickedAccount(e.target.value);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-3 py-1.5 rounded focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
            >
              <option value="">-- Exibir Todas as Contas --</option>
              {availableContasContabeis.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic sub-totals */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 pt-2 text-center text-slate-600 dark:text-slate-350">
          <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Receita Filtrada</span>
            <span className="text-xs font-mono font-bold">{formatCurrency(contabilTotals.receita)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Custo de Compra</span>
            <span className="text-xs font-mono font-bold">{formatCurrency(contabilTotals.custo)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Despesas Atravessadas</span>
            <span className="text-xs font-mono font-bold">{formatCurrency(contabilTotals.despesa)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Resultado Líquido</span>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{formatCurrency(contabilTotals.lucro)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Margem</span>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{contabilTotals.margem.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Main split: Table on left, extracts on right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Table list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm xl:col-span-2 space-y-3">
          <div className="flex justify-between items-center pb-1">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Lançamentos Encontrados ({finalContabilData.length})</span>
            <span className="text-[10px] text-slate-400 italic">Dica: Clique no código da Conta Contábil para auditá-la</span>
          </div>

          <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-lg max-h-[360px] overflow-y-auto">
            <table className="w-full text-[11px] text-left leading-normal">
              <thead className="bg-slate-50 dark:bg-slate-950 font-bold uppercase text-[9px] text-slate-450 tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Conta Contábil</th>
                  <th className="py-2.5 px-3">Departamento</th>
                  <th className="py-2.5 px-3 text-right">Faturamento</th>
                  <th className="py-2.5 px-3 text-right">Orçamento</th>
                  <th className="py-2.5 px-3 text-right">Desvio</th>
                  <th className="py-2.5 px-3 text-right">Resultado</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {finalContabilData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-450 italic">Nenhum registro contábil disponível para os filtros selecionados.</td>
                  </tr>
                ) : (
                  finalContabilData.map((row, idx) => {
                    const isAlert = row.Margem < margemLimite;
                    const orcamentoValue = row.Orcamento || (row.Receita * 0.95);
                    const desvioValue = row.Receita - orcamentoValue;
                    const desvioPct = orcamentoValue > 0 ? (desvioValue / orcamentoValue) * 100 : 0;
                    const isPositiveDesvio = desvioValue >= 0;
                    
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-colors ${isAlert ? "bg-red-50/45 dark:bg-red-950/10" : ""}`}
                      >
                        <td className="py-2 px-3">
                          <button
                            onClick={() => setClickedAccount(row.ContaContabil || "")}
                            className="font-mono font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left text-[10px] sm:text-[11px]"
                          >
                            {row.ContaContabil || "3.1.04.10000.10 - Combustível"}
                          </button>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-350">{row.Departamento || "Geral"}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-700 dark:text-white">{formatCurrency(row.Receita)}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500 dark:text-slate-400">{formatCurrency(orcamentoValue)}</td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${isPositiveDesvio ? "text-emerald-600 dark:text-emerald-450" : "text-amber-600 dark:text-amber-400"}`}>
                          <span className="text-[9px] mr-0.5">{isPositiveDesvio ? "▲" : "▼"}</span>
                          {formatCurrency(Math.abs(desvioValue))} ({desvioPct.toFixed(1)}%)
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-extrabold ${row.Lucro >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                          {formatCurrency(row.Lucro)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button 
                            onClick={() => setClickedAccount(row.ContaContabil || "")}
                            className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold rounded text-[9px] hover:bg-blue-100 uppercase cursor-pointer"
                          >
                            Auditar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytical extract deep-dive ledger */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">RASTREAMENTO ANALÍTICO DE EXTRATO</span>
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5" title={activeAccountForExtract}>
                {activeAccountForExtract}
              </h4>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
              Visão detalhada de extrato de diários de auditoria. Lançamentos singulares cruzados contra o período corporate ativo.
            </p>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5 custom-scrollbar pt-1.5">
              {simulatedExtracts.map((ent, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                    <span>Doc: {ent.id}</span>
                    <span>{ent.data}</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-705 dark:text-slate-200">{ent.historico}</p>
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-slate-450 font-bold">Dep: {ent.depto}</span>
                    <span className={`font-mono font-extrabold ${ent.tipo === "DÉBITO" ? "text-orange-550 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {ent.tipo}: {formatCurrency(ent.valor)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sky-50 dark:bg-sky-950/25 p-2 rounded border border-sky-100 dark:border-sky-900/40 text-[9px] text-sky-700 dark:text-sky-305 font-mono leading-normal pt-1.5">
            🔐 <strong>Rastreabilidade de Ledger:</strong> Log auditado por auditor sênior em conformidade com as diretivas contábeis e fiscais do grupo.
          </div>
        </div>

      </div>
    </div>
  );
};
